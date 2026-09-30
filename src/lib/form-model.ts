import type { Criteria, IncomeType, PropertyConfig } from "@/lib/schema";

/**
 * Bepaalt welke vragen voor een woning relevant zijn. Wordt door het formulier
 * (om te tonen) én door de server (om te valideren) gebruikt, zodat beide altijd
 * hetzelfde beeld hebben van "wat is verplicht voor deze woning".
 */
export type FormModel = {
  minAge: 18 | 21;
  maxApplicants: number;
  extraPersonRoles: Array<"partner" | "housemate">;
  askStudent: boolean;
  askHousemates: boolean;
  askPets: boolean;
  /** Aantal personen dat er gaat wonen; alleen gevraagd als de woning een maximum heeft. */
  askOccupants: boolean;
  maxOccupants: number | undefined;
  askGuarantor: boolean;
  askDepositGuarantee: boolean;
  askResidencePermit: boolean;
  minLeaseMonths: number;
};

export function buildFormModel(config: PropertyConfig): FormModel {
  const c: Criteria = config.criteria;
  return {
    minAge: c.minAge ?? 18,
    maxApplicants: c.maxApplicants,
    extraPersonRoles: c.housematesAllowed
      ? ["partner", "housemate"]
      : ["partner"],
    askStudent: !c.studentsAllowed,
    askHousemates: !c.housematesAllowed,
    askPets: c.petsAllowed === false,
    askOccupants: c.maxOccupants !== undefined,
    maxOccupants: c.maxOccupants,
    askGuarantor: c.guarantor !== "not_allowed",
    askDepositGuarantee: c.depositGuarantee !== "not_needed",
    askResidencePermit: c.residencePermitRequired,
    minLeaseMonths: c.minLeaseMonths ?? 1,
  };
}

export const needsEmploymentDetails = (t: IncomeType) => t === "employment";
