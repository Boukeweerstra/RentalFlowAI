import type { Application, PropertyConfig, TenantConfig } from "@/lib/schema";
import {
  REASON_NL,
  buildApplicantMail,
  buildNotifyMail,
  type Mail,
} from "@/lib/mail-texts";

/**
 * Kolommen van de Google Sheet, in volgorde. De eerste rij van de Sheet moet
 * exact deze namen hebben (zie docs/make-setup.md). Bewust een compacte set:
 * de volledige gestructureerde aanvraag zit in `application` (voor later:
 * Supabase/AI) en hoeft niet in Make gemapt te worden.
 */
export const SHEET_COLUMNS = [
  "submittedAt",
  "id",
  "tenantId",
  "propertyId",
  "address",
  "rent",
  "propertySource",
  "name",
  "email",
  "phone",
  "applicants",
  "occupants",
  "p1_incomeType",
  "p1_monthlyIncome",
  "p2_role",
  "p2_monthlyIncome",
  "totalMonthlyIncome",
  "incomeRequired",
  "hasPets",
  "hasHousemates",
  "guarantorAvailable",
  "desiredStartDate",
  "desiredLeaseMonths",
  "precheckStatus",
  "precheckReasons",
  "precheckReasonsText",
  "motivation",
] as const;

export type SheetColumn = (typeof SHEET_COLUMNS)[number];
type Cell = string | number | boolean | null;

/**
 * Payload naar Make.com.
 * - `flat`: één vlakke rij, sleutels = `SHEET_COLUMNS` (direct te mappen naar Sheets).
 * - `mail`: kant-en-klare onderwerp/tekst voor de makelaar en de woningzoeker.
 * - `application`: volledige gestructureerde aanvraag (voor Supabase/AI later).
 */
export type MakePayload = {
  schemaVersion: number;
  tenantMode: "test" | "production";
  flat: Record<SheetColumn, Cell>;
  mail: {
    notify: Mail & { to: string | null };
    applicant: Mail & { to: string; enabled: boolean };
  };
  application: Application;
};

export function buildMakePayload(
  app: Application,
  config: PropertyConfig,
  tenant: TenantConfig,
  /** Link naar de aanvraag in het dashboard; alleen meegeven als de aanvraag echt is opgeslagen. */
  opts?: { dashboardUrl?: string },
): MakePayload {
  const p1 = app.persons[0];
  const p2 = app.persons[1];

  const flat: MakePayload["flat"] = {
    submittedAt: app.submittedAt,
    id: app.id,
    tenantId: app.tenantId,
    propertyId: app.propertyId,
    address: config.address,
    rent: config.rent,
    propertySource: config.source,
    name: app.applicant.name,
    email: app.applicant.email,
    phone: app.applicant.phone,
    applicants: app.household.applicants,
    occupants: app.household.occupants,
    p1_incomeType: p1.incomeType,
    p1_monthlyIncome: p1.monthlyIncome,
    p2_role: p2?.role ?? null,
    p2_monthlyIncome: p2?.monthlyIncome ?? null,
    totalMonthlyIncome: app.household.totalMonthlyIncome,
    incomeRequired: app.precheck.incomeRequired,
    hasPets: app.situation.hasPets ?? null,
    hasHousemates: app.situation.hasHousemates,
    guarantorAvailable: app.lease.guarantorAvailable ?? null,
    desiredStartDate: app.lease.desiredStartDate,
    desiredLeaseMonths: app.lease.desiredLeaseMonths,
    precheckStatus: app.precheck.status,
    precheckReasons: app.precheck.reasons.join(","),
    precheckReasonsText: app.precheck.reasons.map((r) => REASON_NL[r]).join("; "),
    motivation: app.motivation ?? null,
  };

  return {
    schemaVersion: app.schemaVersion,
    tenantMode: tenant.mode,
    flat,
    mail: {
      notify: { to: tenant.notifyEmail ?? null, ...buildNotifyMail(app, config, opts?.dashboardUrl) },
      applicant: {
        to: app.applicant.email,
        enabled: tenant.sendApplicantMail,
        ...buildApplicantMail(app, config, tenant.name),
      },
    },
    application: app,
  };
}
