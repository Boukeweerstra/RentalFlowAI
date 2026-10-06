"use server";

import { z } from "zod";
import { adminClient } from "@/lib/db/applications";
import { clearPropertyCache } from "@/lib/properties/db";
import { PROPERTY_SELECT, rowToProperty, type PropertyDto, type PropertyRow } from "@/lib/properties/types";
import { formToCriteria, propertyMetaSchema, type FormErrors, type RequirementsForm } from "@/lib/properties/requirements";
import { createClient, getAuthedUser } from "@/lib/supabase/server";

/**
 * Serveracties voor het scherm "Woningen". Schrijven gebeurt met de geheime sleutel (de database laat de browser dit niet zelf doen),
 * dus elke actie controleert eerst zelf: ingelogd, en eigenaar van het kantoor waar de woning bij hoort. De eisen worden hier
 * opnieuw gevalideerd, ook als de browser ze al gecontroleerd had.
 */
export type SaveResult =
  | { ok: true; data: PropertyDto }
  | { ok: false; error: string; errors?: FormErrors };
export type SimpleResult = { ok: true } | { ok: false; error: string };

const NOT_SIGNED_IN = "U bent niet ingelogd. Log opnieuw in.";
const NOT_OWNER = "Alleen de eigenaar van het kantoor kan woningen en eisen wijzigen.";
const GENERIC = "Dat is niet gelukt. Probeer het opnieuw.";

const uuid = z.string().uuid();

/** Is de ingelogde gebruiker eigenaar van dit kantoor? Gebruikt de sessie van de gebruiker, dus de rijafscherming bepaalt wat hij ziet. */
async function isOwnerOf(organizationId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("members").select("role").eq("organization_id", organizationId).maybeSingle();
  return data?.role === "owner";
}

export type SaveInput = {
  /** Leeg bij een nieuwe woning. */
  id?: string;
  organizationId: string;
  propertyId: string;
  address: string;
  rent: string;
  availableFrom: string;
  active: boolean;
  form: RequirementsForm;
};

export async function saveProperty(input: SaveInput): Promise<SaveResult> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, error: NOT_SIGNED_IN };
  if (!uuid.safeParse(input.organizationId).success) return { ok: false, error: GENERIC };
  if (input.id !== undefined && !uuid.safeParse(input.id).success) return { ok: false, error: GENERIC };
  if (!(await isOwnerOf(input.organizationId))) return { ok: false, error: NOT_OWNER };

  const rent = Number(String(input.rent).trim().replace(",", "."));
  const meta = propertyMetaSchema.safeParse({
    propertyId: input.propertyId,
    address: input.address,
    rent: Number.isFinite(rent) ? rent : undefined,
    availableFrom: input.availableFrom ?? "",
  });
  const converted = formToCriteria(input.form);
  const errors: FormErrors = converted.ok ? {} : { ...converted.errors };
  if (!meta.success) {
    for (const issue of meta.error.issues) {
      const key = String(issue.path[0]) as keyof FormErrors;
      if (!errors[key]) errors[key] = issue.message;
    }
  }
  if (!meta.success || !converted.ok) {
    return { ok: false, error: "Controleer de gemarkeerde velden.", errors };
  }

  const db = adminClient();
  if (!db) return { ok: false, error: "De opslag is niet ingesteld. Neem contact op met de beheerder." };

  const values = {
    property_id: meta.data.propertyId,
    address: meta.data.address,
    rent: meta.data.rent,
    available_from: meta.data.availableFrom === "" ? null : meta.data.availableFrom,
    criteria: converted.criteria,
    documents_later: converted.documentsLater,
    active: Boolean(input.active),
    updated_by: user.id,
  };

  const query = input.id
    ? db.from("properties").update(values).eq("id", input.id).eq("organization_id", input.organizationId)
    : db.from("properties").insert({ ...values, organization_id: input.organizationId });
  const { data, error } = await query.select(PROPERTY_SELECT).maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Controleer de gemarkeerde velden.", errors: { propertyId: "Dit woning-id bestaat al bij uw kantoor. Kies een ander id." } };
    }
    console.error("[properties] opslaan mislukt:", error.code);
    return { ok: false, error: GENERIC };
  }
  if (!data) return { ok: false, error: "Deze woning is niet gevonden." };

  clearPropertyCache();
  return { ok: true, data: rowToProperty(data as unknown as PropertyRow) };
}

/** Eigenaar van het kantoor waar deze woning bij hoort, of null als de woning niet bestaat. */
async function organizationOf(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("properties").select("organization_id").eq("id", id).maybeSingle();
  return data?.organization_id ?? null;
}

/** Zet een woning aan of uit. Uit = het formulier opent niet meer, bestaande aanvragen blijven staan. */
export async function setPropertyActive(id: string, active: boolean): Promise<SimpleResult> {
  if (!(await getAuthedUser())) return { ok: false, error: NOT_SIGNED_IN };
  if (!uuid.safeParse(id).success) return { ok: false, error: GENERIC };
  const org = await organizationOf(id);
  if (!org) return { ok: false, error: "Deze woning is niet gevonden." };
  if (!(await isOwnerOf(org))) return { ok: false, error: NOT_OWNER };

  const db = adminClient();
  if (!db) return { ok: false, error: GENERIC };
  const { error } = await db.from("properties").update({ active }).eq("id", id).eq("organization_id", org);
  if (error) {
    console.error("[properties] activeren mislukt:", error.code);
    return { ok: false, error: GENERIC };
  }
  clearPropertyCache();
  return { ok: true };
}

/** Verwijdert een woning, alleen als er geen aanvragen voor zijn (anders: zet haar uit). */
export async function deleteProperty(id: string): Promise<SimpleResult> {
  if (!(await getAuthedUser())) return { ok: false, error: NOT_SIGNED_IN };
  if (!uuid.safeParse(id).success) return { ok: false, error: GENERIC };
  const supabase = await createClient();
  const { data: prop } = await supabase.from("properties").select("organization_id, property_id").eq("id", id).maybeSingle();
  if (!prop) return { ok: false, error: "Deze woning is niet gevonden." };
  if (!(await isOwnerOf(prop.organization_id))) return { ok: false, error: NOT_OWNER };

  const { count, error: countError } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", prop.organization_id)
    .eq("property_id", prop.property_id);
  if (countError) return { ok: false, error: GENERIC };
  if ((count ?? 0) > 0) {
    return { ok: false, error: `Voor deze woning zijn ${count} aanvragen binnengekomen. Zet de woning op niet actief in plaats van haar te verwijderen.` };
  }

  const db = adminClient();
  if (!db) return { ok: false, error: GENERIC };
  const { error } = await db.from("properties").delete().eq("id", id).eq("organization_id", prop.organization_id);
  if (error) {
    console.error("[properties] verwijderen mislukt:", error.code);
    return { ok: false, error: GENERIC };
  }
  clearPropertyCache();
  return { ok: true };
}
