import {
  DEFAULT_SEVERITY,
  type Application,
  type ApplicationInput,
  type PrecheckReason,
  type PrecheckStatus,
  type PropertyConfig,
} from "@/lib/schema";

export type Precheck = Application["precheck"];

type PrecheckInput = Pick<
  Application,
  "persons" | "situation" | "lease" | "residence" | "household"
>;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Berekent de afgeleide waarden (totaal inkomen, aantal aanvragers/bewoners,
 * woningdelen) en de eerste check. Wordt op de server gebruikt voor de
 * definitieve waarden en in het formulier voor de waarschuwing vóór het versturen.
 */
export function deriveFromInput(input: ApplicationInput, config: PropertyConfig) {
  const situation: Application["situation"] = {
    hasHousemates:
      input.situation.hasHousemates ||
      input.persons.some((p) => p.role === "housemate"),
    hasPets: input.situation.hasPets,
    occupants: input.situation.occupants,
  };
  const household: Application["household"] = {
    applicants: input.persons.length,
    // Zonder aparte vraag (geen maxOccupants) gaan we uit van de aanvragers zelf.
    occupants: input.situation.occupants ?? input.persons.length,
    totalMonthlyIncome: round2(
      input.persons.reduce((sum, p) => sum + p.monthlyIncome, 0),
    ),
  };
  const precheck = runPrecheck(
    {
      persons: input.persons,
      situation,
      lease: input.lease,
      residence: input.residence,
      household,
    },
    config,
  );
  return { situation, household, precheck };
}

/**
 * Eerste ruwe beoordeling met vaste regels tegen de config van de woning.
 *
 * Elk criterium heeft een ernst (`hard` of `review`, in `criteria.severity`,
 * anders `DEFAULT_SEVERITY`):
 * - `hard`: niet halen = `unsuitable`
 * - `review`: niet halen = `review` (makelaar beoordeelt zelf)
 * Een inkomenstekort dat met een beschikbare garantsteller opgelost kan worden
 * is `review`, tenzij `guarantorCompensatesIncome` uit staat.
 *
 * Bewust géén AI en geen gevoelige kenmerken: alleen de door de verhuurder
 * ingestelde criteria. Fase 2 bouwt hierop voort.
 */
export function runPrecheck(input: PrecheckInput, config: PropertyConfig): Precheck {
  const c = config.criteria;
  const hard = new Set<PrecheckReason>();
  const soft = new Set<PrecheckReason>();
  const primary = input.persons[0];

  const flag = (reason: PrecheckReason) => {
    const severity = c.severity?.[reason] ?? DEFAULT_SEVERITY[reason];
    (severity === "hard" ? hard : soft).add(reason);
  };

  // Inkomen
  const factor = c.minIncomeFactor;
  const incomeRequired = factor ? round2(config.rent * factor) : null;
  const incomeMeasured = round2(
    c.incomeBasis === "household"
      ? input.household.totalMonthlyIncome
      : primary.monthlyIncome,
  );
  const meetsIncomeRule = incomeRequired === null ? null : incomeMeasured >= incomeRequired;
  if (meetsIncomeRule === false) {
    // Configureerbaar per woning via criteria.guarantorCompensatesIncome (standaard true).
    const guarantorCanFix =
      c.guarantorCompensatesIncome &&
      c.guarantor !== "not_allowed" &&
      input.lease.guarantorAvailable === true;
    // Net onder de eis (criteria.incomeMarginPercent): de makelaar kijkt zelf, het is geen harde afwijzing.
    const withinMargin =
      incomeRequired !== null &&
      c.incomeMarginPercent !== undefined &&
      c.incomeMarginPercent > 0 &&
      incomeMeasured >= round2(incomeRequired * (1 - c.incomeMarginPercent / 100));
    if (guarantorCanFix || withinMargin) soft.add("income_too_low");
    else flag("income_too_low");
  }
  if (!c.allowedIncomeTypes.includes(primary.incomeType)) flag("income_type_not_allowed");

  // Dienstverband
  if (primary.incomeType === "employment") {
    if (!c.probationAllowed && primary.inProbation === true) flag("probation_not_allowed");
    if (
      c.minEmploymentMonths !== undefined &&
      (primary.employmentMonths ?? 0) < c.minEmploymentMonths
    ) {
      flag("employment_too_short");
    }
  }

  // Situatie
  if (!c.studentsAllowed && primary.isStudent === true) flag("student_not_allowed");
  if (!c.housematesAllowed && input.situation.hasHousemates) flag("housemates_not_allowed");
  if (c.petsAllowed === false && input.situation.hasPets === true) flag("pets_not_allowed");
  if (c.maxOccupants !== undefined && input.household.occupants > c.maxOccupants) {
    flag("too_many_occupants");
  }
  if (c.guarantor === "required" && input.lease.guarantorAvailable !== true) {
    flag("guarantor_required");
  }
  if (c.depositGuarantee === "required" && input.lease.depositGuaranteeOk !== true) {
    flag("deposit_guarantee_required");
  }
  if (c.residencePermitRequired && input.residence.hasValidPermit !== true) {
    flag("residence_permit_required");
  }

  // Datum en huurperiode
  const start = input.lease.desiredStartDate;
  if ((c.startDateFrom && start < c.startDateFrom) || (c.startDateUntil && start > c.startDateUntil)) {
    flag("start_date_out_of_range");
  }
  if (c.minLeaseMonths !== undefined && input.lease.desiredLeaseMonths < c.minLeaseMonths) {
    flag("lease_too_short");
  }

  // Een reden die op een ander criterium al "hard" is, blijft hard.
  for (const r of hard) soft.delete(r);

  const status: PrecheckStatus =
    hard.size > 0 ? "unsuitable" : soft.size > 0 ? "review" : "suitable";

  return {
    status,
    reasons: [...hard, ...soft],
    incomeRequired,
    incomeMeasured,
    meetsIncomeRule,
  };
}
