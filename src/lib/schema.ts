import { z } from "zod";

/**
 * Gedeelde schema's voor RentalFlowAI.
 * Alle waarden zijn taalonafhankelijke keys/enums (geen vertaalde tekst), zodat
 * dezelfde structuur later 1-op-1 naar Supabase en de AI-beoordeling kan.
 */

export const SCHEMA_VERSION = 1 as const;

export const LANGS = ["nl", "en"] as const;
export const langSchema = z.enum(LANGS);
export type Lang = z.infer<typeof langSchema>;

export const INCOME_TYPES = [
  "employment",
  "self_employed",
  "pension",
  "student_finance",
  "benefits",
  "other",
] as const;
export const incomeTypeSchema = z.enum(INCOME_TYPES);
export type IncomeType = z.infer<typeof incomeTypeSchema>;

export const DOCUMENT_TYPES = [
  "id",
  "payslip",
  "employer_statement",
  "bank_statement",
  "guarantor_statement",
  "residence_permit",
] as const;
export const documentTypeSchema = z.enum(DOCUMENT_TYPES);
export type DocumentType = z.infer<typeof documentTypeSchema>;

/** Uitkomst van de eerste ruwe check (fase 1: regels; fase 2: AI vult aan). */
export const PRECHECK_STATUSES = ["suitable", "review", "unsuitable"] as const;
export type PrecheckStatus = (typeof PRECHECK_STATUSES)[number];

/**
 * Redenen achter de status. Taalonafhankelijke codes, zodat ze in Sheets, mails,
 * dashboards en AI-prompts hetzelfde blijven.
 */
export const PRECHECK_REASONS = [
  "income_too_low",
  "income_type_not_allowed",
  "probation_not_allowed",
  "employment_too_short",
  "student_not_allowed",
  "housemates_not_allowed",
  "guarantor_required",
  "deposit_guarantee_required",
  "residence_permit_required",
  "start_date_out_of_range",
  "lease_too_short",
  "pets_not_allowed",
  "too_many_occupants",
] as const;
export type PrecheckReason = (typeof PRECHECK_REASONS)[number];
export const precheckReasonSchema = z.enum(PRECHECK_REASONS);

/**
 * Per criterium: `hard` = niet halen betekent "ongeschikt";
 * `review` = niet halen betekent "beoordelen" (handmatig door de makelaar).
 */
export const severitySchema = z.enum(["hard", "review"]);
export type Severity = z.infer<typeof severitySchema>;

/** Standaardwaarden als de makelaar niets instelt. */
export const DEFAULT_SEVERITY: Record<PrecheckReason, Severity> = {
  income_too_low: "hard",
  income_type_not_allowed: "hard",
  probation_not_allowed: "hard",
  employment_too_short: "hard",
  student_not_allowed: "hard",
  housemates_not_allowed: "hard",
  guarantor_required: "hard",
  deposit_guarantee_required: "hard",
  residence_permit_required: "hard",
  pets_not_allowed: "hard",
  too_many_occupants: "hard",
  start_date_out_of_range: "review",
  lease_too_short: "review",
};

// ---------------------------------------------------------------------------
// Config per woning (beheerd door de makelaar)
// ---------------------------------------------------------------------------

export const criteriaSchema = z.object({
  /** Minimale leeftijd; de woningzoeker bevestigt alleen "ik ben X of ouder". */
  minAge: z.union([z.literal(18), z.literal(21)]).optional(),
  allowedIncomeTypes: z.array(incomeTypeSchema).min(1),
  /** Inkomen moet minimaal factor × kale huur zijn. */
  minIncomeFactor: z.number().positive().optional(),
  /** Telt alleen het inkomen van de hoofdaanvrager of het gezamenlijke inkomen? */
  incomeBasis: z.enum(["primary_applicant", "household"]),
  /** Aantal personen dat samen kan aanvragen (1 = alleen hoofdaanvrager). */
  maxApplicants: z.number().int().min(1).max(4).default(1),
  /**
   * Maximaal aantal personen dat in de woning gaat wonen (incl. kinderen).
   * Los van `maxApplicants`: kinderen wonen mee maar vragen niet mee aan.
   * Niet ingesteld = geen limiet en geen vraag in het formulier.
   */
  maxOccupants: z.number().int().min(1).max(20).optional(),
  /**
   * Huisdieren. Niet ingesteld = geen criterium en geen vraag;
   * `false` = huisdieren niet toegestaan (de zoeker wordt ernaar gevraagd).
   */
  petsAllowed: z.boolean().optional(),
  /** false = kandidaat in proeftijd wordt niet geaccepteerd. */
  probationAllowed: z.boolean(),
  minEmploymentMonths: z.number().int().min(0).optional(),
  /** Vroegste ingangsdatum die de verhuurder accepteert (ISO). */
  startDateFrom: z.string().date().optional(),
  /** Uiterlijke ingangsdatum die de verhuurder accepteert (ISO). */
  startDateUntil: z.string().date().optional(),
  guarantor: z.enum(["not_allowed", "allowed", "required"]),
  /**
   * Mag een beschikbare garantsteller een inkomenstekort compenseren?
   * true (standaard): tekort + garantsteller = `review` in plaats van hard.
   * false: een inkomenstekort blijft ook met garantsteller een gewoon (hard) tekort.
   */
  guarantorCompensatesIncome: z.boolean().default(true),
  minLeaseMonths: z.number().int().min(1).optional(),
  housematesAllowed: z.boolean(),
  studentsAllowed: z.boolean(),
  depositGuarantee: z.enum(["not_needed", "allowed", "required"]),
  /** Alleen "geldige verblijfstitel ja/nee"; nooit op nationaliteit sturen. */
  residencePermitRequired: z.boolean(),
  /** Per criterium hard of review; ontbrekend = `DEFAULT_SEVERITY`. */
  severity: z.partialRecord(precheckReasonSchema, severitySchema).optional(),
});
export type Criteria = z.infer<typeof criteriaSchema>;

export const propertyConfigSchema = z.object({
  tenantId: z.string().min(1),
  propertyId: z.string().min(1),
  /** Kale huur per maand in euro; de config is leidend, niet het widget. */
  rent: z.number().positive(),
  address: z.string().min(1),
  availableFrom: z.string().date().optional(),
  criteria: criteriaSchema,
  /** Pas opgevraagd bij status "Geschikt" (gefaseerde documentaanvraag). */
  documentsLater: z.array(documentTypeSchema).default([]),
  /**
   * Herkomst van huur en adres. `config` = betrouwbare woningconfiguratie;
   * `widget_hints` = ongecontroleerd uit `data-*` (alleen test-tenants).
   */
  source: z.enum(["config", "widget_hints"]).default("config"),
});
export type PropertyConfig = z.infer<typeof propertyConfigSchema>;

export const tenantConfigSchema = z
  .object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  /**
   * `production`: huur, adres en criteria komen uitsluitend uit `properties`
   * (betrouwbare config op basis van het woning-id); `data-*` uit het widget
   * wordt genegeerd. `test`: hints en `propertyDefaults` zijn toegestaan.
   */
  mode: z.enum(["test", "production"]).default("production"),
  /** Ontvanger van de melding bij de makelaar; leeg = vast adres in het Make-scenario. */
  notifyEmail: z.string().email().optional(),
  /** Mail met een ontvangstbevestiging naar de woningzoeker (Make voert dit uit). */
  sendApplicantMail: z.boolean().default(true),
  /** Domeinen waarop het widget mag draaien (frame-ancestors + origin-check). */
  allowedOrigins: z.array(z.string().url()),
  privacyPolicyUrl: z.string().url().optional(),
  properties: z.array(propertyConfigSchema.omit({ tenantId: true })),
  /**
   * Alleen voor test-tenants: woningen die niet in `properties` staan, krijgen
   * deze criteria, met huurprijs en adres uit de hints van het widget (`data-*`).
   * Voor echte tenants weglaten: daar is de config leidend.
   */
  propertyDefaults: z
    .object({
      criteria: criteriaSchema,
      documentsLater: z.array(documentTypeSchema).default([]),
    })
    .optional(),
  })
  .refine((t) => t.mode === "test" || !t.propertyDefaults, {
    message: "propertyDefaults is alleen toegestaan bij mode 'test'",
    path: ["propertyDefaults"],
  });
export type TenantConfig = z.infer<typeof tenantConfigSchema>;

// ---------------------------------------------------------------------------
// Aanvraag (wat de woningzoeker indient en wat naar Make.com gaat)
// ---------------------------------------------------------------------------

export const personSchema = z.object({
  role: z.enum(["primary", "partner", "housemate"]),
  incomeType: incomeTypeSchema,
  /** Maandinkomen in euro. */
  monthlyIncome: z.number().min(0).max(1_000_000),
  employmentMonths: z.number().int().min(0).max(600).optional(),
  inProbation: z.boolean().optional(),
  isStudent: z.boolean().optional(),
});
export type Person = z.infer<typeof personSchema>;

/** Wat de browser mag sturen. Totalen en checks rekent de server zelf uit. */
export const applicationInputSchema = z.object({
  lang: langSchema,
  tenantId: z.string().min(1),
  propertyId: z.string().min(1),
  applicant: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(6).max(30),
    ageConfirmed: z.literal(true),
  }),
  persons: z.array(personSchema).min(1).max(4),
  situation: z.object({
    hasHousemates: z.boolean(),
    /** Alleen gevraagd als de woning huisdieren verbiedt. */
    hasPets: z.boolean().optional(),
    /** Aantal personen dat er gaat wonen; alleen gevraagd bij `maxOccupants`. */
    occupants: z.number().int().min(1).max(20).optional(),
  }),
  lease: z.object({
    desiredStartDate: z.string().date(),
    desiredLeaseMonths: z.number().int().min(1).max(120),
    guarantorAvailable: z.boolean().optional(),
    depositGuaranteeOk: z.boolean().optional(),
  }),
  residence: z.object({ hasValidPermit: z.boolean().optional() }),
  motivation: z.string().trim().max(1000).optional(),
  consent: z.object({
    privacyAccepted: z.literal(true),
    version: z.string(),
  }),
  /** Woninggegevens uit het widget; alleen gebruikt bij tenants met `propertyDefaults`. */
  hints: z
    .object({
      rent: z.number().positive().max(100_000).optional(),
      address: z.string().trim().max(200).optional(),
    })
    .optional(),
  /** Honeypot: moet leeg blijven. */
  website: z.string().max(0).optional(),
  /**
   * Bescherming tegen misbruik. Beide worden door de API-route afgedwongen (niet door dit schema),
   * zodat het formulier het schema ook kan gebruiken voor de waarschuwing vóór het versturen.
   */
  formToken: z.string().max(200).optional(),
  turnstileToken: z.string().max(4096).optional(),
});
export type ApplicationInput = z.infer<typeof applicationInputSchema>;

/** Definitieve, server-verrijkte payload naar Make.com. */
export type Application = Omit<
  ApplicationInput,
  "website" | "consent" | "hints" | "formToken" | "turnstileToken"
> & {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  submittedAt: string;
  /** `applicants` = personen die aanvragen; `occupants` = personen die er gaan wonen. */
  household: { applicants: number; occupants: number; totalMonthlyIncome: number };
  consent: { privacyAccepted: true; version: string; at: string };
  /** Eerste ruwe check tegen de config; de definitieve beoordeling volgt in fase 2. */
  precheck: {
    status: PrecheckStatus;
    reasons: PrecheckReason[];
    incomeRequired: number | null;
    incomeMeasured: number;
    meetsIncomeRule: boolean | null;
  };
};
