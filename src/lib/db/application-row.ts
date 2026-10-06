import type { Application, PropertyConfig } from "@/lib/schema";

/** Een rij voor `public.applications`. */
export type ApplicationInsert = {
  id: string;
  organization_id: string;
  property_id: string;
  property_address: string;
  rent: number;
  property_source: "config" | "widget_hints";
  lang: "nl" | "en";
  name: string;
  email: string;
  phone: string;
  applicants: number;
  occupants: number;
  total_income: number;
  income_required: number | null;
  precheck_status: "suitable" | "review" | "unsuitable";
  precheck_reasons: string[];
  /** De makelaar begint met de uitkomst van de regels. */
  group_current: "suitable" | "review" | "unsuitable";
  payload: Application;
  created_at: string;
};

/**
 * Zet een verwerkte aanvraag om naar een databaserij. Puur (geen I/O), dus los te testen.
 * `payload` bevat de volledige gestructureerde aanvraag voor later gebruik (AI, export).
 */
export function toApplicationRow(
  app: Application,
  config: PropertyConfig,
  organizationId: string,
): ApplicationInsert {
  return {
    id: app.id,
    organization_id: organizationId,
    property_id: app.propertyId,
    property_address: config.address,
    rent: config.rent,
    property_source: config.source,
    lang: app.lang,
    name: app.applicant.name,
    email: app.applicant.email,
    phone: app.applicant.phone,
    applicants: app.household.applicants,
    occupants: app.household.occupants,
    total_income: app.household.totalMonthlyIncome,
    income_required: app.precheck.incomeRequired,
    precheck_status: app.precheck.status,
    precheck_reasons: app.precheck.reasons,
    group_current: app.precheck.status,
    payload: app,
    created_at: app.submittedAt,
  };
}
