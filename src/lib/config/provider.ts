import type { PropertyConfig, TenantConfig } from "@/lib/schema";

/** Woninggegevens uit het widget (`data-*`). Alleen bruikbaar voor tenants met `propertyDefaults`. */
export type PropertyHints = { rent?: number; address?: string };

/**
 * Bron van de per-woning configuratie. Fase 1: JSON-bestanden.
 * Later te vervangen door een Google Sheet of Supabase zonder dat het formulier,
 * de validatie of de beoordeling verandert.
 */
export interface ConfigProvider {
  getTenant(tenantId: string): Promise<TenantConfig | null>;
  getProperty(
    tenantId: string,
    propertyId: string,
    hints?: PropertyHints,
  ): Promise<PropertyConfig | null>;
}
