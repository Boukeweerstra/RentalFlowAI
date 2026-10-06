"use server";

import { z } from "zod";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
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

const NOT_SIGNED_IN = "Je bent niet ingelogd. Log opnieuw in.";
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
