// Test: de vertaling tussen het formulier "Eisen per woning" en de criteria van de regelmotor. Zonder netwerk.
//   node --experimental-strip-types --import ./scripts/eval/register.mjs scripts/eval/test-requirements.mjs
import { readFileSync } from "node:fs";
import { criteriaSchema, DEFAULT_SEVERITY, PRECHECK_REASONS, propertyConfigSchema, applicationInputSchema } from "@/lib/schema";
import { criteriaToForm, formToCriteria, defaultCriteria, propertyMetaSchema } from "@/lib/properties/requirements";
import { deriveFromInput } from "@/lib/precheck";
import { requirementItems } from "@/lib/requirement-items";

let ok = 0, bad = 0;
const check = (n, c, x = "") => { if (c) ok++; else { bad++; console.log("FOUT:", n, x); } };
const effective = (c) => Object.fromEntries(PRECHECK_REASONS.map((r) => [r, c.severity?.[r] ?? DEFAULT_SEVERITY[r]]));
// petsAllowed true en niet ingesteld gedragen zich identiek (er wordt alleen gevraagd naar huisdieren bij false).
const normalized = (c) => { const { petsAllowed, ...rest } = c; return petsAllowed === false ? { ...rest, petsAllowed } : rest; };
const plain = (c) => { const n = { ...normalized(c), severity: effective(c) }; return JSON.stringify(n, Object.keys(n).sort()); };

const tenants = ["demo", "rotsvast-test", "voorbeeld-productie"].map((t) => JSON.parse(readFileSync(new URL(`../../data/tenants/${t}.json`, import.meta.url), "utf8")));

// 1. Alle bestaande woningen: heen en terug geeft dezelfde eisen (en dezelfde uitkomst van de regels).
for (const t of tenants) {
  const list = [...t.properties, ...(t.propertyDefaults ? [{ propertyId: "defaults", rent: 1500, address: "x", criteria: t.propertyDefaults.criteria, documentsLater: t.propertyDefaults.documentsLater ?? [] }] : [])];
  for (const p of list) {
    const original = criteriaSchema.parse(p.criteria);
    const form = criteriaToForm(original, p.documentsLater ?? []);
    const back = formToCriteria(form);
    check(`${t.tenantId}/${p.propertyId}: terugvertaling slaagt`, back.ok, JSON.stringify(back.errors));
    if (!back.ok) continue;
    check(`${t.tenantId}/${p.propertyId}: criteria gelijk`, plain(back.criteria) === plain(original), `${plain(back.criteria)}\n${plain(original)}`);
    check(`${t.tenantId}/${p.propertyId}: documenten gelijk`, JSON.stringify(back.documentsLater) === JSON.stringify([...(p.documentsLater ?? [])]), JSON.stringify(back.documentsLater));
  }
}

// 2. De standaard voor een nieuwe woning is geldig.
{
  const d = defaultCriteria();
  check("standaard is geldig", criteriaSchema.safeParse(d).success);
  const back = formToCriteria(criteriaToForm(d));
  check("standaard heen en terug", back.ok && plain(back.criteria) === plain(d));
}

// 3. Foutmeldingen per veld.
const base = criteriaToForm(defaultCriteria());
const errorsFor = (patch) => { const r = formToCriteria({ ...base, ...patch }); return r.ok ? null : r.errors; };
check("inkomensfactor 0 geweigerd", errorsFor({ incomeFactor: "0" })?.incomeFactor);
check("inkomensfactor 11 geweigerd", errorsFor({ incomeFactor: "11" })?.incomeFactor);
check("inkomensfactor tekst geweigerd", errorsFor({ incomeFactor: "drie" })?.incomeFactor);
check("inkomensfactor 2,5 (komma) geaccepteerd", errorsFor({ incomeFactor: "2,5" }) === null);
check("inkomensfactor leeg = geen eis", formToCriteria({ ...base, incomeFactor: "" }).criteria.minIncomeFactor === undefined);
check("marge 11 geweigerd", errorsFor({ incomeMarginPercent: "11" })?.incomeMarginPercent);
check("marge zonder inkomenseis geweigerd", errorsFor({ incomeFactor: "", incomeMarginPercent: "3" })?.incomeMarginPercent);
check("marge 3 geaccepteerd", formToCriteria({ ...base, incomeMarginPercent: "3" }).criteria.incomeMarginPercent === 3);
check("marge 0 = geen marge", formToCriteria({ ...base, incomeMarginPercent: "0" }).criteria.incomeMarginPercent === undefined);
check("geen inkomstenbron geweigerd", errorsFor({ incomeTypes: [] })?.incomeTypes);
check("aanvragers 0 geweigerd", errorsFor({ maxApplicants: "0" })?.maxApplicants);
check("aanvragers 5 geweigerd", errorsFor({ maxApplicants: "5" })?.maxApplicants);
check("aanvragers leeg geweigerd", errorsFor({ maxApplicants: "" })?.maxApplicants);
check("bewoners 2,5 geweigerd", errorsFor({ maxOccupants: "2.5" })?.maxOccupants);
check("bewoners leeg = geen limiet", formToCriteria({ ...base, maxOccupants: "" }).criteria.maxOccupants === undefined);
check("dienstverband 0 = geen eis", formToCriteria({ ...base, minEmploymentMonths: "0" }).criteria.minEmploymentMonths === undefined);
check("dienstverband -1 geweigerd", errorsFor({ minEmploymentMonths: "-1" })?.minEmploymentMonths);
check("huurperiode 0 geweigerd", errorsFor({ minLeaseMonths: "0" })?.minLeaseMonths);
check("datum onzin geweigerd", errorsFor({ startFrom: "morgen" })?.startFrom);
check("data in verkeerde volgorde geweigerd", errorsFor({ startFrom: "2027-01-01", startUntil: "2026-01-01" })?.startUntil);
check("data in goede volgorde geaccepteerd", errorsFor({ startFrom: "2026-01-01", startUntil: "2027-01-01" }) === null);
check("leeftijd 21", formToCriteria({ ...base, minAge: "21" }).criteria.minAge === 21);
check("huisdieren niet toegestaan", formToCriteria({ ...base, pets: "no" }).criteria.petsAllowed === false);
check("huisdieren 'maakt niet uit' = niet gevraagd", formToCriteria({ ...base, pets: "any" }).criteria.petsAllowed === undefined);

// 4. Ernst: alleen afwijkingen van de standaard worden opgeslagen, en komen er ook weer uit.
{
  const r = formToCriteria({ ...base, probationSeverity: "review", incomeSeverity: "hard" });
  check("alleen afwijking opgeslagen", r.ok && JSON.stringify(r.criteria.severity) === JSON.stringify({ probation_not_allowed: "review" }), JSON.stringify(r.criteria?.severity));
  const f = criteriaToForm(r.criteria);
  check("ernst komt terug in het formulier", f.probationSeverity === "review" && f.incomeSeverity === "hard");
  check("niets afwijkend = geen severity-veld", formToCriteria(base).criteria.severity === undefined);
}

// 5. Woninggegevens.
{
  const meta = (o) => propertyMetaSchema.safeParse({ propertyId: "W-1", address: "Straat 1, Plaats", rent: 1500, availableFrom: "", ...o });
  check("geldige woning", meta({}).success);
  check("id met spatie geweigerd", !meta({ propertyId: "W 1" }).success);
  check("id met slash geweigerd", !meta({ propertyId: "../x" }).success);
  check("id te lang geweigerd", !meta({ propertyId: "a".repeat(41) }).success);
  check("adres te kort geweigerd", !meta({ address: "ab" }).success);
  check("huur 0 geweigerd", !meta({ rent: 0 }).success);
  check("huur te hoog geweigerd", !meta({ rent: 100001 }).success);
  check("datum onzin geweigerd", !meta({ availableFrom: "ooit" }).success);
  check("datum leeg geaccepteerd", meta({ availableFrom: "" }).success);
}

// 6. De regelmotor gedraagt zich met de gebouwde eisen zoals bedoeld (marge uit het formulier).
{
  const r = formToCriteria({ ...base, incomeFactor: "3", incomeMarginPercent: "5", incomeBasis: "primary_applicant", maxApplicants: "1", guarantor: "not_allowed" });
  const config = propertyConfigSchema.parse({ tenantId: "t", propertyId: "p", rent: 1000, address: "Straat 1", criteria: r.criteria });
  const run = (income) => deriveFromInput(applicationInputSchema.parse({
    lang: "nl", tenantId: "t", propertyId: "p",
    applicant: { name: "Test Persoon", email: "t@example.com", phone: "0612345678", ageConfirmed: true },
    persons: [{ role: "primary", incomeType: "employment", monthlyIncome: income, employmentMonths: 24, inProbation: false, isStudent: false }],
    situation: { hasHousemates: false }, lease: { desiredStartDate: "2026-12-01", desiredLeaseMonths: 12 }, residence: {},
    consent: { privacyAccepted: true, version: "t" },
  }), config).precheck.status;
  check("eis 3.000, marge 5%: 3.000 = suitable", run(3000) === "suitable");
  check("2.850 (precies marge) = review", run(2850) === "review");
  check("2.849 = unsuitable", run(2849) === "unsuitable");
  const items = requirementItems({ criteria: r.criteria, rent: 1000 }, "nl");
  check("eisen in gewone taal bevatten het bedrag", items.some((i) => /3\.000/.test(i)), items.join(" | "));
}

console.log(bad ? `${bad} fout, ${ok} goed` : `${ok}/${ok} goed`);
if (bad) process.exitCode = 1;
