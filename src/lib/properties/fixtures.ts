import demo from "../../../data/tenants/demo.json";
import { criteriaSchema } from "@/lib/schema";
import type { PropertyDto } from "./types";

/** Voorbeeldwoningen voor de voorbeeldpagina's (alleen lokaal): de woningen van de demo-tenant uit de bestanden. */
export const fixtureOrgId = "00000000-0000-4000-8000-000000000001";

export const fixtureProperties: PropertyDto[] = demo.properties.map((p, i) => ({
  id: `voorbeeld-${p.propertyId}`,
  organizationId: fixtureOrgId,
  propertyId: p.propertyId,
  address: p.address,
  rent: p.rent,
  availableFrom: (p as { availableFrom?: string }).availableFrom ?? null,
  criteria: criteriaSchema.parse(p.criteria),
  documentsLater: (p as { documentsLater?: PropertyDto["documentsLater"] }).documentsLater ?? [],
  active: i !== 4,
  updatedAt: "2026-10-06T10:00:00.000Z",
}));
