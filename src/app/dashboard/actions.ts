"use server";

import { z } from "zod";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { claimAiBudget } from "@/lib/ai/budget";
import { DRAFT_PROMPT_VERSION, asksFor, buildDraftRequest, draftSchema, fillName, parseDraft } from "@/lib/ai/draft-mail";
import { getProvider } from "@/lib/ai/providers";
import { adminClient } from "@/lib/db/applications";
import type { PrecheckReason } from "@/lib/schema";
import {
  APPLICATION_SELECT,
  GROUPS,
  HANDLINGS,
  rowToDash,
  type ApplicationRow,
  type DashApplication,
  type DashEvent,
} from "@/lib/dashboard/types";

/**
 * Serveracties voor het dashboard. Elke actie controleert zelf de gebruiker (de proxy is alleen een eerste hek),
 * en alle queries lopen met de sessie van de makelaar, dus de rijafscherming van de database beslist wat kan.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const NOT_SIGNED_IN = "U bent niet ingelogd. Log opnieuw in.";
const GENERIC = "Dat is niet gelukt. Probeer het opnieuw.";

const patchSchema = z
  .object({
    group: z.enum(GROUPS as [string, ...string[]]).optional(),
    handling: z.enum(HANDLINGS as [string, ...string[]]).optional(),
    contacted: z.boolean().optional(),
    note: z.string().max(5000).optional(),
  })
  .refine((p) => Object.keys(p).length > 0, "lege wijziging");

export type ApplicationPatch = z.infer<typeof patchSchema>;

export async function updateApplication(
  id: string,
  patch: ApplicationPatch,
): Promise<ActionResult<DashApplication>> {
  if (!(await getAuthedUser())) return { ok: false, error: NOT_SIGNED_IN };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: GENERIC };
  const parsed = patchSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: GENERIC };

  // Alleen de vier toegestane kolommen; de database staat ook niets anders toe.
  const update: Record<string, unknown> = {};
  if (parsed.data.group !== undefined) update.group_current = parsed.data.group;
  if (parsed.data.handling !== undefined) update.handling_status = parsed.data.handling;
  if (parsed.data.contacted !== undefined) {
    update.contacted_at = parsed.data.contacted ? new Date().toISOString() : null;
  }
  if (parsed.data.note !== undefined) update.note = parsed.data.note;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .update(update)
    .eq("id", id)
    .select(APPLICATION_SELECT)
    .maybeSingle();

  if (error) {
    console.error("[dashboard] bijwerken mislukt:", error.code);
    return { ok: false, error: GENERIC };
  }
  if (!data) return { ok: false, error: "Deze aanvraag is niet gevonden." };
  return { ok: true, data: rowToDash(data as unknown as ApplicationRow) };
}

/** Haalt alle aanvragen van de eigen kantoren opnieuw op (terugval als live bijwerken niet werkt). */
export async function loadApplications(): Promise<ActionResult<DashApplication[]>> {
  if (!(await getAuthedUser())) return { ok: false, error: NOT_SIGNED_IN };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(APPLICATION_SELECT)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("[dashboard] laden mislukt:", error.code);
    return { ok: false, error: GENERIC };
  }
  return { ok: true, data: (data as unknown as ApplicationRow[]).map(rowToDash) };
}

/** Het logboek van één aanvraag, nieuwste eerst. */
export async function loadEvents(applicationId: string): Promise<ActionResult<DashEvent[]>> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };
  if (!z.string().uuid().safeParse(applicationId).success) return { ok: false, error: GENERIC };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("application_events")
    .select("id, action, from_value, to_value, created_at, actor")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);
  if (error) {
    console.error("[dashboard] logboek laden mislukt:", error.code);
    return { ok: false, error: GENERIC };
  }
  return {
    ok: true,
    data: (data ?? []).map((e) => ({
      id: Number(e.id),
      action: e.action as DashEvent["action"],
      fromValue: e.from_value,
      toValue: e.to_value,
      createdAt: e.created_at,
      byMe: e.actor === user.id,
      bySystem: e.actor === null,
    })),
  };
}

/**
 * Verwijdert een aanvraag definitief (AVG: verwijderen op verzoek). Alleen de eigenaar van het kantoor mag dit;
 * de database dwingt dat af en legt de verwijdering vast zonder persoonsgegevens. Het logboek van de aanvraag gaat mee.
 * Let op: de rij in de Google Sheet en de mail naar het kantoor blijven bestaan en moeten handmatig weg.
 */
export async function deleteApplication(id: string): Promise<ActionResult<{ id: string }>> {
  if (!(await getAuthedUser())) return { ok: false, error: NOT_SIGNED_IN };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: GENERIC };

  const supabase = await createClient();
  const { data, error } = await supabase.from("applications").delete().eq("id", id).select("id");
  if (error) {
    console.error("[dashboard] verwijderen mislukt:", error.code);
    return { ok: false, error: GENERIC };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "Verwijderen is niet gelukt. Alleen de eigenaar van het kantoor mag aanvragen verwijderen." };
  }
  return { ok: true, data: { id } };
}

export type AiSummary = { summary: string; points: string[]; model: string };

/**
 * De AI-samenvatting van de toelichting (als die er is). Alleen een hulpmiddel: de rijafscherming laat alleen het eigen
 * kantoor lezen, en de uitkomst van de regels wordt hierdoor nooit gewijzigd. Fouten van de AI worden hier niet getoond.
 */
export async function loadAiSummary(applicationId: string): Promise<ActionResult<AiSummary | null>> {
  if (!(await getAuthedUser())) return { ok: false, error: NOT_SIGNED_IN };
  if (!z.string().uuid().safeParse(applicationId).success) return { ok: false, error: GENERIC };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_outputs")
    .select("content, model")
    .eq("application_id", applicationId)
    .eq("kind", "summary")
    .eq("status", "ok")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[dashboard] AI-samenvatting laden mislukt:", error.code);
    return { ok: false, error: GENERIC };
  }
  const content = data?.content as { summary?: unknown; points?: unknown } | null | undefined;
  if (!content || typeof content.summary !== "string") return { ok: true, data: null };
  const points = Array.isArray(content.points) ? content.points.filter((p): p is string => typeof p === "string").slice(0, 4) : [];
  return { ok: true, data: { summary: content.summary, points, model: String(data?.model ?? "") } };
}

export type DraftMail = { subject: string; body: string; model: string; fresh: boolean };

/**
 * Maakt (of haalt op) een CONCEPT-mail om ontbrekende informatie op te vragen. Alleen op verzoek van een ingelogde makelaar, alleen voor
 * aanvragen onder Review met een concrete vraag. Er gaat geen naam, mail of telefoonnummer naar de AI; de voornaam wordt hier pas ingevuld.
 * Niets wordt verstuurd: de makelaar leest, past aan en verstuurt zelf. Eén concept per aanvraag en promptversie (kostenbeheersing).
 */
export async function createDraftMail(applicationId: string): Promise<ActionResult<DraftMail>> {
  if (!(await getAuthedUser())) return { ok: false, error: NOT_SIGNED_IN };
  if (!z.string().uuid().safeParse(applicationId).success) return { ok: false, error: GENERIC };

  const supabase = await createClient();
  const { data: app, error } = await supabase
    .from("applications")
    .select("id, organization_id, name, lang, property_address, group_current, precheck_reasons")
    .eq("id", applicationId)
    .maybeSingle();
  if (error) {
    console.error("[dashboard] concept: aanvraag laden mislukt:", error.code);
    return { ok: false, error: GENERIC };
  }
  if (!app) return { ok: false, error: "Deze aanvraag is niet gevonden." };

  const firstName = String(app.name).trim().split(/\s+/)[0] ?? "";
  const reasons = (app.precheck_reasons ?? []) as PrecheckReason[];
  if (app.group_current !== "review" || asksFor(reasons).length === 0) {
    return { ok: false, error: "Een conceptmail kan alleen bij een aanvraag onder Review waarbij informatie ontbreekt." };
  }

  // Bestaat er al een concept? Dan dat tonen: geen tweede aanroep en dus geen extra kosten.
  const { data: existing } = await supabase
    .from("ai_outputs")
    .select("content, model")
    .eq("application_id", applicationId)
    .eq("kind", "draft_mail")
    .eq("status", "ok")
    .eq("prompt_version", DRAFT_PROMPT_VERSION)
    .maybeSingle();
  const old = draftSchema.safeParse(existing?.content);
  if (old.success) {
    const filled = fillName(old.data, firstName);
    return { ok: true, data: { ...filled, model: String(existing?.model ?? ""), fresh: false } };
  }

  const provider = getProvider();
  if (!provider) return { ok: false, error: "AI staat uit. Schrijf de mail zelf, of laat de beheerder AI aanzetten." };
  const request = buildDraftRequest({ lang: app.lang === "en" ? "en" : "nl", propertyAddress: String(app.property_address), reasons });
  if (!request) return { ok: false, error: GENERIC };
  if (!(await claimAiBudget())) return { ok: false, error: "Het dagplafond voor AI is bereikt. Probeer het morgen opnieuw of schrijf zelf." };

  const result = await provider.completeJson(request);
  if (!result.ok) {
    console.warn("[ai] concept mislukt:", result.code);
    return { ok: false, error: "De AI gaf geen antwoord. Probeer het zo nog eens of schrijf zelf." };
  }
  const parsed = parseDraft(result.text);
  if (!parsed.ok) {
    console.warn("[ai] concept afgekeurd:", parsed.code);
    return { ok: false, error: "Het concept voldeed niet aan de veiligheidsregels en wordt niet getoond. Schrijf zelf of probeer opnieuw." };
  }

  const db = adminClient();
  if (db) {
    const { error: saveError } = await db.from("ai_outputs").insert({
      application_id: applicationId,
      organization_id: app.organization_id,
      kind: "draft_mail",
      status: "ok",
      content: parsed.content,
      model: result.model,
      prompt_version: DRAFT_PROMPT_VERSION,
      input_tokens: result.usage.inputTokens,
      output_tokens: result.usage.outputTokens,
    });
    if (saveError && saveError.code !== "23505") console.error("[ai] concept opslaan mislukt:", saveError.code);
  }
  return { ok: true, data: { ...fillName(parsed.content, firstName), model: result.model, fresh: true } };
}
