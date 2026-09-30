import { randomUUID } from "node:crypto";
import {
  SCHEMA_VERSION,
  applicationInputSchema,
  type Application,
  type ApplicationInput,
  type PropertyConfig,
} from "@/lib/schema";
import { buildFormModel, needsEmploymentDetails } from "@/lib/form-model";
import { deriveFromInput } from "@/lib/precheck";

export const PRIVACY_VERSION = "2026-09-v1";

export type FieldErrors = Record<string, string>;

export type ValidationResult =
  | { ok: true; application: Application }
  | { ok: false; errors: FieldErrors };

/**
 * Valideert de ruwe invoer tegen het schema én tegen de config van de woning,
 * en verrijkt de aanvraag met server-side berekende waarden. Wat de client zelf
 * meestuurt over totalen of checks wordt genegeerd.
 *
 * Een aanvraag die niet aan de voorwaarden voldoet wordt níet geweigerd: die
 * krijgt `precheck.status = "unsuitable"` en gaat gewoon naar de makelaar.
 * Alleen onmogelijke of onvolledige invoer geeft een fout.
 */
export function validateApplication(
  raw: unknown,
  config: PropertyConfig,
): ValidationResult {
  const parsed = applicationInputSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".") || "_"] ??= issue.message;
    }
    return { ok: false, errors };
  }
  const input: ApplicationInput = parsed.data;
  const model = buildFormModel(config);
  const errors: FieldErrors = {};

  if (input.tenantId !== config.tenantId || input.propertyId !== config.propertyId) {
    errors["_"] = "property_mismatch";
  }

  // Personen: precies één hoofdaanvrager, niet meer dan de woning toestaat.
  const primaries = input.persons.filter((p) => p.role === "primary");
  if (primaries.length !== 1 || input.persons[0].role !== "primary") {
    errors["persons"] = "one_primary_required";
  }
  if (input.persons.length > model.maxApplicants) {
    errors["persons"] = "too_many_applicants";
  }
  input.persons.forEach((p, i) => {
    if (p.role !== "primary" && !model.extraPersonRoles.includes(p.role)) {
      errors[`persons.${i}.role`] = "role_not_allowed";
    }
    if (needsEmploymentDetails(p.incomeType)) {
      if (p.employmentMonths === undefined) {
        errors[`persons.${i}.employmentMonths`] = "required";
      }
      if (p.inProbation === undefined) {
        errors[`persons.${i}.inProbation`] = "required";
      }
    }
  });

  // Alleen vragen die voor deze woning relevant zijn zijn verplicht.
  if (model.askGuarantor && input.lease.guarantorAvailable === undefined) {
    errors["lease.guarantorAvailable"] = "required";
  }
  if (model.askDepositGuarantee && input.lease.depositGuaranteeOk === undefined) {
    errors["lease.depositGuaranteeOk"] = "required";
  }
  if (model.askResidencePermit && input.residence.hasValidPermit === undefined) {
    errors["residence.hasValidPermit"] = "required";
  }
  if (model.askPets && input.situation.hasPets === undefined) {
    errors["situation.hasPets"] = "required";
  }
  if (model.askOccupants) {
    if (input.situation.occupants === undefined) {
      errors["situation.occupants"] = "required";
    } else if (input.situation.occupants < input.persons.length) {
      // Iedere aanvrager woont er zelf ook, dus bewoners >= aanvragers.
      errors["situation.occupants"] = "occupants_below_applicants";
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const { situation, household, precheck } = deriveFromInput(input, config);

  const application: Application = {
    schemaVersion: SCHEMA_VERSION,
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    lang: input.lang,
    tenantId: input.tenantId,
    propertyId: input.propertyId,
    applicant: input.applicant,
    persons: input.persons,
    situation,
    lease: input.lease,
    residence: input.residence,
    motivation: input.motivation || undefined,
    household,
    consent: {
      privacyAccepted: true,
      version: input.consent.version,
      at: new Date().toISOString(),
    },
    precheck,
  };
  return { ok: true, application };
}
