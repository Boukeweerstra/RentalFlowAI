import { tenantFiles } from "../../../data/tenants";
import {
  propertyConfigSchema,
  tenantConfigSchema,
  type PropertyConfig,
  type TenantConfig,
} from "@/lib/schema";
import type { ConfigProvider, PropertyHints } from "./provider";

export class JsonConfigProvider implements ConfigProvider {
  async getTenant(tenantId: string): Promise<TenantConfig | null> {
    if (!Object.hasOwn(tenantFiles, tenantId)) return null;
    return tenantConfigSchema.parse(tenantFiles[tenantId]);
  }

  async getProperty(
    tenantId: string,
    propertyId: string,
    hints?: PropertyHints,
  ): Promise<PropertyConfig | null> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return null;

    const known = tenant.properties.find((p) => p.propertyId === propertyId);
    if (known) return propertyConfigSchema.parse({ ...known, tenantId });

    // Hints uit het widget (data-*) zijn ongecontroleerde invoer van de bezoeker.
    // Alleen vertrouwd voor test-tenants; in productie komt alles uit `properties`.
    // Zonder huurprijs-hint kunnen we de inkomenscheck niet doen, dus dan geen woning.
    if (tenant.mode === "test" && tenant.propertyDefaults && hints?.rent) {
      return propertyConfigSchema.parse({
        tenantId,
        propertyId,
        rent: hints.rent,
        address: hints.address?.trim() || `Woning ${propertyId}`,
        criteria: tenant.propertyDefaults.criteria,
        documentsLater: tenant.propertyDefaults.documentsLater,
        source: "widget_hints",
      });
    }
    return null;
  }
}
