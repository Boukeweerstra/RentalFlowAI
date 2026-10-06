import type {
  Application,
  DocumentType,
  Lang,
  PrecheckReason,
  PrecheckStatus,
  PropertyConfig,
} from "@/lib/schema";

/**
 * Mailteksten voor de automatische mails. Bewust simpel en op één plek, zodat
 * ze makkelijk aan te passen zijn. Make.com verstuurt alleen wat hier staat.
 *
 * Flow: precheck (suitable/review/unsuitable) → makelaar beoordeelt → makelaar beslist.
 * De precheck is voorsorterend en ondersteunend. De mail naar de woningzoeker is
 * voor elke status een ontvangstbevestiging waarin staat dat na beoordeling een
 * definitieve reactie volgt. RentalFlowAI verstuurt zelf géén afwijzing (AVG art. 22);
 * een definitieve afwijzingsmail komt later pas na goedkeuring door de makelaar.
 * De precheck-uitkomst en redenen gaan alleen naar de makelaar.
 */

/** `body` = platte tekst, `html` = zelfde tekst als HTML (Gmail in Make behoudt anders geen regeleinden). */
export type Mail = { subject: string; body: string; html: string };

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Gebruikersinvoer (naam, toelichting) komt in de mail: altijd escapen. */
const toMail = (subject: string, body: string): Mail => ({
  subject,
  body,
  html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">${escapeHtml(body).replace(/\n/g, "<br>")}</div>`,
});

export const STATUS_NL: Record<PrecheckStatus, string> = {
  suitable: "geschikt voor bezichtiging",
  review: "beoordelen",
  unsuitable: "ongeschikt",
};

export const REASON_NL: Record<PrecheckReason, string> = {
  income_too_low: "inkomen te laag",
  income_type_not_allowed: "inkomensbron niet toegestaan",
  probation_not_allowed: "proeftijd niet toegestaan",
  employment_too_short: "dienstverband te kort",
  student_not_allowed: "studenten niet toegestaan",
  housemates_not_allowed: "woningdelen niet toegestaan",
  guarantor_required: "garantsteller vereist",
  deposit_guarantee_required: "borgstelling vereist",
  residence_permit_required: "geldige verblijfstitel vereist",
  start_date_out_of_range: "ingangsdatum wijkt af",
  lease_too_short: "huurperiode korter dan gewenst",
  pets_not_allowed: "huisdieren niet toegestaan",
  too_many_occupants: "te veel bewoners",
};

const DOCS: Record<Lang, Record<DocumentType, string>> = {
  nl: {
    id: "identiteitsbewijs",
    payslip: "recente loonstrook(en)",
    employer_statement: "werkgeversverklaring",
    bank_statement: "bankafschriften",
    guarantor_statement: "gegevens en verklaring garantsteller",
    residence_permit: "verblijfsdocument",
  },
  en: {
    id: "proof of identity",
    payslip: "recent payslip(s)",
    employer_statement: "employer statement",
    bank_statement: "bank statements",
    guarantor_statement: "guarantor details and statement",
    residence_permit: "residence permit",
  },
};

const eur = (n: number) => `€ ${n.toLocaleString("nl-NL")}`;
const yn = (v: boolean | null | undefined) => (v === null || v === undefined ? "-" : v ? "ja" : "nee");

/** Compacte tekst voor de makelaar (altijd Nederlands). */
export function buildSummary(
  app: Application,
  config: PropertyConfig,
  dashboardUrl?: string,
): string {
  const p1 = app.persons[0];
  const { precheck } = app;
  return [
    `Nieuwe aanvraag voor ${config.address} (woning ${app.propertyId})`,
    `Eerste check: ${STATUS_NL[precheck.status]}${
      precheck.reasons.length ? ` (${precheck.reasons.map((r) => REASON_NL[r]).join("; ")})` : ""
    }`,
    ``,
    `Aanvrager: ${app.applicant.name} · ${app.applicant.email} · ${app.applicant.phone}`,
    `Aanvragers: ${app.household.applicants} · bewoners: ${app.household.occupants} · gezamenlijk bruto maandinkomen ${eur(app.household.totalMonthlyIncome)}`,
    precheck.incomeRequired !== null
      ? `Inkomenseis: ${eur(precheck.incomeRequired)} · gemeten ${eur(precheck.incomeMeasured)} → ${yn(precheck.meetsIncomeRule)}`
      : `Inkomenseis: geen`,
    `Hoofdaanvrager: ${p1.incomeType}${p1.employmentMonths !== undefined ? `, ${p1.employmentMonths} mnd in dienst, proeftijd: ${yn(p1.inProbation)}` : ""}`,
    `Ingangsdatum: ${app.lease.desiredStartDate} · huurperiode ${app.lease.desiredLeaseMonths} mnd`,
    `Garantsteller: ${yn(app.lease.guarantorAvailable)} · Borgstelling akkoord: ${yn(app.lease.depositGuaranteeOk)} · Verblijfstitel: ${yn(app.residence.hasValidPermit)}`,
    `Woningdelers: ${yn(app.situation.hasHousemates)} · Huisdieren: ${yn(app.situation.hasPets)}`,
    app.motivation ? `Toelichting: ${app.motivation}` : null,
    config.source === "widget_hints"
      ? `Let op: huur en adres komen uit het widget (test-tenant), niet uit een vaste woningconfiguratie.`
      : null,
    ``,
    dashboardUrl ? `Open in dashboard: ${dashboardUrl}` : null,
    `Aanvraag-ID: ${app.id}`,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

/** Melding aan de makelaar; de status staat in de onderwerpregel. */
export function buildNotifyMail(
  app: Application,
  config: PropertyConfig,
  dashboardUrl?: string,
): Mail {
  const tag = { suitable: "GESCHIKT", review: "BEOORDELEN", unsuitable: "ONGESCHIKT" }[
    app.precheck.status
  ];
  return toMail(
    `[Aanvraag: ${tag}] ${config.address} – ${app.applicant.name}`,
    buildSummary(app, config, dashboardUrl),
  );
}

/** Ontvangstbevestiging naar de woningzoeker, per status en taal. */
export function buildApplicantMail(
  app: Application,
  config: PropertyConfig,
  tenantName: string,
): Mail {
  const nl = app.lang === "nl";
  const name = app.applicant.name.split(" ")[0];
  const docs = config.documentsLater.map((d) => `- ${DOCS[app.lang][d]}`).join("\n");

  const subject = nl
    ? `Uw aanvraag voor ${config.address} is ontvangen`
    : `Your application for ${config.address} has been received`;

  // Elke status krijgt dezelfde boodschap: ontvangen, de makelaar beoordeelt, daarna
  // volgt een definitieve reactie. De precheck stuurt alleen voor; de beslissing is van de makelaar.
  const bodies: Record<Lang, Record<PrecheckStatus, string>> = {
    nl: {
      suitable:
        `Beste ${name},\n\nBedankt voor uw aanvraag voor ${config.address}. Wij hebben uw aanvraag ontvangen. Op basis van de ingevulde gegevens lijkt uw aanvraag te passen bij de woning. De makelaar beoordeelt uw aanvraag; na de beoordeling ontvangt u een definitieve reactie, bijvoorbeeld over een bezichtiging.` +
        (docs ? `\n\nMogelijk vragen we u dan om de volgende documenten:\n${docs}` : ""),
      review:
        `Beste ${name},\n\nBedankt voor uw aanvraag voor ${config.address}. Wij hebben uw aanvraag ontvangen. De makelaar beoordeelt uw aanvraag en neemt contact met u op als er meer informatie nodig is. Na de beoordeling ontvangt u een definitieve reactie.`,
      unsuitable:
        `Beste ${name},\n\nBedankt voor uw aanvraag voor ${config.address}. Wij hebben uw aanvraag ontvangen. Alle aanvragen worden door de makelaar beoordeeld. Na de beoordeling ontvangt u een definitieve reactie.`,
    },
    en: {
      suitable:
        `Dear ${name},\n\nThank you for your application for ${config.address}. We have received your application. Based on the details provided, it appears to fit the property. The agent will review your application; after the review you will receive a final response, for example about a viewing.` +
        (docs ? `\n\nWe may then ask you for the following documents:\n${docs}` : ""),
      review:
        `Dear ${name},\n\nThank you for your application for ${config.address}. We have received your application. The agent will review it and get in touch if more information is needed. After the review you will receive a final response.`,
      unsuitable:
        `Dear ${name},\n\nThank you for your application for ${config.address}. We have received your application. All applications are reviewed by the agent. After the review you will receive a final response.`,
    },
  };

  const sign = nl ? `Met vriendelijke groet,\n${tenantName}` : `Kind regards,\n${tenantName}`;
  return toMail(subject, `${bodies[app.lang][app.precheck.status]}\n\n${sign}`);
}
