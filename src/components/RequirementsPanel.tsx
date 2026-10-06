import type { Lang, PropertyConfig } from "@/lib/schema";
import { getDict } from "@/lib/i18n";

/** Server component: toont transparant wat voor deze woning nodig is. */
export default function RequirementsPanel({
  config,
  lang,
}: {
  config: PropertyConfig;
  lang: Lang;
}) {
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

  return (
    <section aria-labelledby="req-title" className="rounded-xl border border-accent-100 bg-accent-50 p-4 sm:p-5">
      <h2 id="req-title" className="font-semibold text-accent-700">{t.requirementsTitle}</h2>
      <ul className="mt-3 space-y-1.5 text-sm text-zinc-800">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true" className="font-semibold text-accent-600">✓</span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
      {config.documentsLater.length > 0 && (
        <div className="mt-4 border-t border-accent-100 pt-3">
          <h3 className="text-sm font-semibold text-zinc-900">{t.documentsLaterTitle}</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-800">
            {config.documentsLater.map((d) => (
              <li key={d}>{t.documents[d]}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-zinc-600">{t.documentsLaterNote}</p>
        </div>
      )}
    </section>
  );
}
