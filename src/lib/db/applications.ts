import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Application, PropertyConfig } from "@/lib/schema";
import { toApplicationRow } from "./application-row";

/**
 * Slaat een aanvraag op in Supabase (de bron voor het dashboard). Gebruikt de GEHEIME sleutel en mag dus
 * alleen op de server draaien; wordt een client-component dit bestand importeren, dan faalt de build.
 *
 * Uitkomst:
 *  - "stored":  opgeslagen
 *  - "skipped": niet geprobeerd (Supabase niet ingesteld, of geen kantoor voor deze tenant)
 *  - "failed":  geprobeerd maar mislukt (de fout staat in de log, zonder persoonsgegevens)
 */
export type StoreResult = "stored" | "skipped" | "failed";

const g = globalThis as unknown as {
  __rfSupabase?: SupabaseClient;
  __rfOrgCache?: Map<string, { id: string | null; exp: number }>;
  __rfDbWarned?: boolean;
};
const orgCache = (g.__rfOrgCache ??= new Map());
const ORG_TTL_MS = 5 * 60 * 1000;

function admin(): SupabaseClient | null {
  // SUPABASE_URL (serveronly) wordt tijdens het draaien gelezen. NEXT_PUBLIC_* wordt bij het bouwen in de code gebakken,
  // dus alleen als terugval gebruikt.
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    if (process.env.NODE_ENV === "production" && !g.__rfDbWarned) {
      g.__rfDbWarned = true;
      console.warn("[db] SUPABASE_SECRET_KEY ontbreekt: aanvragen worden niet in de database opgeslagen.");
    }
    return null;
  }
  return (g.__rfSupabase ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }));
}

async function organizationId(db: SupabaseClient, tenantKey: string): Promise<string | null> {
  const cached = orgCache.get(tenantKey);
  if (cached && cached.exp > Date.now()) return cached.id;

  const { data, error } = await db
    .from("organizations")
    .select("id")
    .eq("tenant_key", tenantKey)
    .limit(1);
  if (error) throw new Error(`organizations ${error.code ?? "fout"}`);
  const id = (data?.[0] as { id: string } | undefined)?.id ?? null;
  orgCache.set(tenantKey, { id, exp: Date.now() + ORG_TTL_MS });
  return id;
}

export async function saveApplication(
  app: Application,
  config: PropertyConfig,
): Promise<StoreResult> {
  const db = admin();
  if (!db) return "skipped";

  try {
    const orgId = await organizationId(db, config.tenantId);
    if (!orgId) {
      console.warn(`[db] geen kantoor voor tenant "${config.tenantId}"; aanvraag niet opgeslagen.`);
      return "skipped";
    }
    const { error } = await db.from("applications").insert(toApplicationRow(app, config, orgId));
    // 23505 = bestaat al (zelfde id): dan staat de aanvraag er al.
    if (error && error.code !== "23505") {
      console.error("[db] opslaan mislukt:", error.code ?? error.message?.slice(0, 80));
      return "failed";
    }
    return "stored";
  } catch (err) {
    console.error("[db] opslaan mislukt:", (err as Error).message?.slice(0, 80));
    return "failed";
  }
}
