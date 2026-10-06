import type { Criteria, DocumentType } from "@/lib/schema";

/** Een woning zoals het scherm "Woningen" die toont. */
export type PropertyDto = {
  id: string;
  organizationId: string;
  propertyId: string;
  address: string;
  rent: number;
  availableFrom: string | null;
  criteria: Criteria;
  documentsLater: DocumentType[];
  active: boolean;
  updatedAt: string;
};

/** Kolommen die het scherm ophaalt. */
export const PROPERTY_SELECT =
  "id, organization_id, property_id, address, rent, available_from, criteria, documents_later, active, updated_at";

export type PropertyRow = {
  id: string;
  organization_id: string;
  property_id: string;
  address: string;
  rent: number | string;
  available_from: string | null;
  criteria: Criteria;
  documents_later: DocumentType[] | null;
  active: boolean;
  updated_at: string;
};

export function rowToProperty(r: PropertyRow): PropertyDto {
  return {
    id: r.id,
    organizationId: r.organization_id,
    propertyId: r.property_id,
    address: r.address,
    rent: Number(r.rent),
    availableFrom: r.available_from,
    criteria: r.criteria,
    documentsLater: r.documents_later ?? [],
    active: r.active,
    updatedAt: r.updated_at,
  };
}

