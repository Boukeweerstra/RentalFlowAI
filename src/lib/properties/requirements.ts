import { z } from "zod";
import {
  DEFAULT_SEVERITY,
  DOCUMENT_TYPES,
  INCOME_TYPES,
  criteriaSchema,
  type Criteria,
  type DocumentType,
  type IncomeType,
  type PrecheckReason,
  type Severity,
} from "@/lib/schema";

/**
 * Het formulier "Eisen per woning" voor de makelaar. Alles is tekst of keuze (zoals een formulier is) en wordt hier vertaald van en naar de
 * `Criteria` die de regelmotor gebruikt. Geen server-code: de browser gebruikt dit voor een directe controle en voorbeeld,
 * de server gebruikt dezelfde functies als eindcontrole voordat er iets wordt opgeslagen.
 */
export type RequirementsForm = {
  minAge: "" | "18" | "21";
  incomeFactor: string;
  incomeBasis: "primary_applicant" | "household";
  incomeMarginPercent: string;
  incomeSeverity: Severity;
  incomeTypes: IncomeType[];
  incomeTypeSeverity: Severity;
  maxApplicants: string;
  maxOccupants: string;
  occupantsSeverity: Severity;
  pets: "any" | "no";
  petsSeverity: Severity;
  probationAllowed: boolean;
  probationSeverity: Severity;
  minEmploymentMonths: string;
  employmentSeverity: Severity;
  guarantor: "not_allowed" | "allowed" | "required";
  guarantorSeverity: Severity;
  guarantorCompensatesIncome: boolean;
  minLeaseMonths: string;
  leaseSeverity: Severity;
  startFrom: string;
  startUntil: string;
  startSeverity: Severity;
  housematesAllowed: boolean;
  housematesSeverity: Severity;
  studentsAllowed: boolean;
  studentsSeverity: Severity;
  depositGuarantee: "not_needed" | "allowed" | "required";
  depositSeverity: Severity;
  residencePermitRequired: boolean;
  permitSeverity: Severity;
  documentsLater: DocumentType[];
};

/** Welk veld van het formulier bij welke reden hoort. */
const SEVERITY_FIELDS: Array<[PrecheckReason, keyof RequirementsForm]> = [
  ["income_too_low", "incomeSeverity"],
  ["income_type_not_allowed", "incomeTypeSeverity"],
  ["probation_not_allowed", "probationSeverity"],
  ["employment_too_short", "employmentSeverity"],
  ["student_not_allowed", "studentsSeverity"],
  ["housemates_not_allowed", "housematesSeverity"],
  ["guarantor_required", "guarantorSeverity"],
  ["deposit_guarantee_required", "depositSeverity"],
  ["residence_permit_required", "permitSeverity"],
  ["start_date_out_of_range", "startSeverity"],
  ["lease_too_short", "leaseSeverity"],
  ["pets_not_allowed", "petsSeverity"],
  ["too_many_occupants", "occupantsSeverity"],
];

const num = (n: number | undefined): string => (n === undefined ? "" : String(n));

/** Een nieuwe woning begint met de verstandige standaard: gebruikelijke eisen, alles volgens de standaardernst. */
export function defaultCriteria(): Criteria {
  return criteriaSchema.parse({
    minAge: 18,
    allowedIncomeTypes: ["employment", "self_employed", "pension"],
    minIncomeFactor: 3,
    incomeBasis: "household",
    maxApplicants: 2,
    probationAllowed: true,
    guarantor: "allowed",
    housematesAllowed: false,
    studentsAllowed: true,
    depositGuarantee: "not_needed",
    residencePermitRequired: false,
  });
}

export function criteriaToForm(c: Criteria, documentsLater: DocumentType[] = []): RequirementsForm {
  const sev = (reason: PrecheckReason): Severity => c.severity?.[reason] ?? DEFAULT_SEVERITY[reason];
  return {
    minAge: c.minAge ? (String(c.minAge) as "18" | "21") : "",
    incomeFactor: num(c.minIncomeFactor),
    incomeBasis: c.incomeBasis,
    incomeMarginPercent: num(c.incomeMarginPercent),
    incomeSeverity: sev("income_too_low"),
    incomeTypes: [...c.allowedIncomeTypes],
    incomeTypeSeverity: sev("income_type_not_allowed"),
    maxApplicants: String(c.maxApplicants),
    maxOccupants: num(c.maxOccupants),
    occupantsSeverity: sev("too_many_occupants"),
    pets: c.petsAllowed === false ? "no" : "any",
    petsSeverity: sev("pets_not_allowed"),
    probationAllowed: c.probationAllowed,
    probationSeverity: sev("probation_not_allowed"),
    minEmploymentMonths: num(c.minEmploymentMonths),
    employmentSeverity: sev("employment_too_short"),
    guarantor: c.guarantor,
    guarantorSeverity: sev("guarantor_required"),
    guarantorCompensatesIncome: c.guarantorCompensatesIncome,
    minLeaseMonths: num(c.minLeaseMonths),
    leaseSeverity: sev("lease_too_short"),
    startFrom: c.startDateFrom ?? "",
    startUntil: c.startDateUntil ?? "",
    startSeverity: sev("start_date_out_of_range"),
    housematesAllowed: c.housematesAllowed,
    housematesSeverity: sev("housemates_not_allowed"),
    studentsAllowed: c.studentsAllowed,
    studentsSeverity: sev("student_not_allowed"),
    depositGuarantee: c.depositGuarantee,
    depositSeverity: sev("deposit_guarantee_required"),
    residencePermitRequired: c.residencePermitRequired,
    permitSeverity: sev("residence_permit_required"),
    documentsLater: [...documentsLater],
  };
}

export type FormErrors = Partial<Record<keyof RequirementsForm | "propertyId" | "address" | "rent" | "availableFrom", string>>;

/** Accepteert "3,5" en "3.5". Leeg = undefined, onzin = NaN. */
function parseNumber(value: string): number | undefined {
  const v = value.trim().replace(",", ".");
  if (v === "") return undefined;
  return /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : Number.NaN;
}

export type FormToCriteria =
  | { ok: true; criteria: Criteria; documentsLater: DocumentType[] }
  | { ok: false; errors: FormErrors };

/**
 * Controleert het formulier en bouwt de criteria. Elke fout krijgt een Nederlandse melding bij het juiste veld.
 * Alleen afwijkingen van de standaardernst komen in `severity`, zodat de opgeslagen eisen kort en leesbaar blijven.
 */
export function formToCriteria(f: RequirementsForm): FormToCriteria {
  const errors: FormErrors = {};

  const intField = (value: string, key: keyof RequirementsForm, min: number, max: number, label: string): number | undefined => {
    const n = parseNumber(value);
    if (n === undefined) return undefined;
    if (!Number.isInteger(n) || n < min || n > max) {
      errors[key] = `${label}: vul een heel getal in van ${min} tot ${max}, of laat het leeg.`;
      return undefined;
    }
    return n;
  };

  let factor = parseNumber(f.incomeFactor);
  if (factor !== undefined && !(factor >= 1 && factor <= 10)) {
    errors.incomeFactor = "Inkomensfactor: vul een getal in van 1 tot 10 (bijvoorbeeld 3), of laat het leeg voor geen inkomenseis.";
    factor = undefined;
  }
  let margin = parseNumber(f.incomeMarginPercent);
  if (margin !== undefined && !(margin >= 0 && margin <= 10)) {
    errors.incomeMarginPercent = "Marge: vul een percentage in van 0 tot 10, of laat het leeg.";
    margin = undefined;
  }
  if (margin !== undefined && margin > 0 && factor === undefined) {
    errors.incomeMarginPercent = "Een marge heeft alleen zin met een inkomenseis. Vul eerst de inkomensfactor in.";
  }
  if (f.incomeTypes.length === 0) errors.incomeTypes = "Kies minstens één toegestane inkomstenbron.";

  const maxApplicants = intField(f.maxApplicants, "maxApplicants", 1, 4, "Aantal aanvragers");
  if (maxApplicants === undefined && !errors.maxApplicants) errors.maxApplicants = "Aantal aanvragers: vul een heel getal in van 1 tot 4.";
  const maxOccupants = intField(f.maxOccupants, "maxOccupants", 1, 20, "Aantal bewoners");
  const employment = intField(f.minEmploymentMonths, "minEmploymentMonths", 0, 120, "Minimale duur dienstverband");
  const lease = intField(f.minLeaseMonths, "minLeaseMonths", 1, 120, "Minimale huurperiode");

  const isDate = (s: string) => s === "" || z.string().date().safeParse(s).success;
  if (!isDate(f.startFrom)) errors.startFrom = "Vroegste ingangsdatum: kies een geldige datum, of laat het leeg.";
  if (!isDate(f.startUntil)) errors.startUntil = "Uiterlijke ingangsdatum: kies een geldige datum, of laat het leeg.";
  if (!errors.startFrom && !errors.startUntil && f.startFrom && f.startUntil && f.startFrom > f.startUntil) {
    errors.startUntil = "De uiterlijke ingangsdatum ligt voor de vroegste. Pas een van de twee aan.";
  }

  const severity: Partial<Record<PrecheckReason, Severity>> = {};
  for (const [reason, field] of SEVERITY_FIELDS) {
    const chosen = f[field] as Severity;
    if (chosen !== "hard" && chosen !== "review") continue;
    if (chosen !== DEFAULT_SEVERITY[reason]) severity[reason] = chosen;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const parsed = criteriaSchema.safeParse({
    minAge: f.minAge === "" ? undefined : Number(f.minAge),
    allowedIncomeTypes: f.incomeTypes,
    minIncomeFactor: factor,
    incomeBasis: f.incomeBasis,
    incomeMarginPercent: margin !== undefined && margin > 0 ? margin : undefined,
    maxApplicants,
    maxOccupants,
    petsAllowed: f.pets === "no" ? false : undefined,
    probationAllowed: f.probationAllowed,
    minEmploymentMonths: employment !== undefined && employment > 0 ? employment : undefined,
    startDateFrom: f.startFrom || undefined,
    startDateUntil: f.startUntil || undefined,
    guarantor: f.guarantor,
    guarantorCompensatesIncome: f.guarantorCompensatesIncome,
    minLeaseMonths: lease,
    housematesAllowed: f.housematesAllowed,
    studentsAllowed: f.studentsAllowed,
    depositGuarantee: f.depositGuarantee,
    residencePermitRequired: f.residencePermitRequired,
    severity: Object.keys(severity).length > 0 ? severity : undefined,
  });
  if (!parsed.success) {
    return { ok: false, errors: { incomeFactor: "De eisen zijn niet geldig. Controleer de ingevulde velden." } };
  }

  const docs = DOCUMENT_TYPES.filter((d) => f.documentsLater.includes(d));
  return { ok: true, criteria: parsed.data, documentsLater: docs };
}

/** Gegevens van de woning zelf (naast de eisen). */
export const propertyMetaSchema = z.object({
  propertyId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/, "Gebruik letters, cijfers, punt, streepje of underscore (maximaal 40 tekens), zonder spaties."),
  address: z.string().trim().min(3, "Vul het adres in.").max(160, "Het adres is te lang (maximaal 160 tekens)."),
  rent: z.number({ error: "Vul de huurprijs in." }).positive("De huurprijs moet hoger zijn dan 0.").max(100000, "De huurprijs is te hoog."),
  availableFrom: z.string().refine((s) => s === "" || z.string().date().safeParse(s).success, "Kies een geldige datum, of laat het leeg."),
});
export type PropertyMeta = z.infer<typeof propertyMetaSchema>;

export { INCOME_TYPES, DOCUMENT_TYPES };
