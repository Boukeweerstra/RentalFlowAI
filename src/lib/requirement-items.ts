import { getDict } from "@/lib/i18n";
import type { Lang, PropertyConfig } from "@/lib/schema";

/**
 * De eisen van een woning als korte zinnen in gewone taal. Gebruikt door het formulier voor de woningzoeker (eisenblok)
 * en door het scherm van de makelaar (overzicht en voorbeeld), zodat beiden hetzelfde zien.
 */
export function requirementItems(config: Pick<PropertyConfig, "criteria" | "rent">, lang: Lang): string[] {
  const t = getDict(lang);
  const c = config.criteria;
  const money = new Intl.NumberFormat(lang === "nl" ? "nl-NL" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  const items: string[] = [];
  if (c.minAge) items.push(t.reqMinAge(c.minAge));
  if (c.minIncomeFactor) {
    items.push(t.reqIncome(c.minIncomeFactor, money.format(config.rent * c.minIncomeFactor)));
    items.push(c.incomeBasis === "household" ? t.reqIncomeHousehold : t.reqIncomeIndividual);
  }
  if (!c.probationAllowed) items.push(t.reqNoProbation);
  if (c.minEmploymentMonths) items.push(t.reqMinEmployment(c.minEmploymentMonths));
  if (c.minLeaseMonths) items.push(t.reqMinLease(c.minLeaseMonths));
  if (!c.studentsAllowed) items.push(t.reqNoStudents);
  if (!c.housematesAllowed) items.push(t.reqNoHousemates);
  if (c.petsAllowed === false) items.push(t.reqNoPets);
  if (c.maxOccupants) items.push(t.reqMaxOccupants(c.maxOccupants));
  if (c.guarantor === "required") items.push(t.reqGuarantorRequired);
  if (c.guarantor === "allowed") items.push(t.reqGuarantorAllowed);
  if (c.depositGuarantee !== "not_needed") items.push(t.reqDepositGuarantee);
  if (c.residencePermitRequired) items.push(t.reqResidencePermit);
  return items;
}
