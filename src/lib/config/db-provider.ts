import { getStoredProperty } from "@/lib/properties/db";
import type { PropertyConfig, TenantConfig } from "@/lib/schema";
import type { ConfigProvider, PropertyHints } from "./provider";

/**
 * Woningen komen eerst uit de database (door de makelaar beheerd in het scherm "Woningen"), en pas daarna uit de
 * tenant-JSON-bestanden. Tenants (wie, welke sites, welke modus) blijven in de bestanden staan.
 *  - Staat een woning in de database en is die actief: die geldt.
 *  - Staat ze er maar is ze niet actief, of zijn de opgeslagen eisen ongeldig: geen formulier (nooit terugvallen op oudere gegevens).
 *  - Staat ze er niet: de JSON-bestanden beslissen.
 */
export class DbBackedConfigProvider implements ConfigProvider {
  constructor(private readonly fallback: ConfigProvider) {}

  getTenant(tenantId: string): Promise<TenantConfig | null> {
    return this.fallback.getTenant(tenantId);
  }

  async getProperty(tenantId: string, propertyId: string, hints?: PropertyHints): Promise<PropertyConfig | null> {
    const stored = await getStoredProperty(tenantId, propertyId);
    if (stored.kind === "active") return stored.config;
    if (stored.kind === "inactive" || stored.kind === "invalid") return null;
    return this.fallback.getProperty(tenantId, propertyId, hints);
  }
}
