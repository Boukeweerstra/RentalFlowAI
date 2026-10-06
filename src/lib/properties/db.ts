import "server-only";
import { adminClient, lookupOrganizationId } from "@/lib/db/applications";
import { propertyConfigSchema, type PropertyConfig } from "@/lib/schema";

/**
 * Leest een woning (met eisen) uit de database voor het formulier van de woningzoeker. Gebruikt de geheime sleutel, want
 * woningzoekers zijn niet ingelogd. Een korte cache voorkomt dat elke formulierweergave de database raakt.
 */
export type StoredProperty =
  | { kind: "none" }
  | { kind: "inactive" }
  | { kind: "active"; config: PropertyConfig }
  | { kind: "invalid" };

const g = globalThis as unknown as { __rfPropCache?: Map<string, { value: StoredProperty; exp: number }> };
const cache = (g.__rfPropCache ??= new Map());
const TTL_MS = 10_000;

/** Na het opslaan in het scherm direct vernieuwen (op deze serverinstantie; andere instanties volgen binnen 10 seconden). */
export function clearPropertyCache(): void {
  cache.clear();
}

export async function getStoredProperty(tenantId: string, propertyId: string): Promise<StoredProperty> {
  const key = `${tenantId}\u0000${propertyId}`;
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;

  const value = await load(tenantId, propertyId);
  // Een tijdelijke databasefout (kind "none" door een fout) niet lang onthouden: die geven we als "none" terug zonder cache.
  cache.set(key, { value, exp: Date.now() + TTL_MS });
  return value;
}

async function load(tenantId: string, propertyId: string): Promise<StoredProperty> {
  try {
    const db = adminClient();
    if (!db) return { kind: "none" };
    const orgId = await lookupOrganizationId(tenantId);
    if (!orgId) return { kind: "none" };

    const { data, error } = await db
      .from("properties")
      .select("property_id, address, rent, available_from, criteria, documents_later, active")
      .eq("organization_id", orgId)
      .eq("property_id", propertyId)
      .maybeSingle();
    if (error) {
      console.error("[properties] lezen mislukt:", error.code);
      return { kind: "none" };
    }
    if (!data) return { kind: "none" };
    if (!data.active) return { kind: "inactive" };

    const parsed = propertyConfigSchema.safeParse({
      tenantId,
      propertyId: data.property_id,
      rent: Number(data.rent),
      address: data.address,
      availableFrom: data.available_from ?? undefined,
      criteria: data.criteria,
      documentsLater: data.documents_later ?? [],
      source: "config",
    });
    if (!parsed.success) {
      // Een kapotte rij nooit stilletjes vervangen door oudere gegevens uit een bestand: liever geen formulier.
      console.error("[properties] opgeslagen eisen zijn ongeldig voor woning (id niet gelogd)");
      return { kind: "invalid" };
    }
    return { kind: "active", config: parsed.data };
  } catch (err) {
    console.error("[properties] onverwachte fout:", (err as Error).name);
    return { kind: "none" };
  }
}
