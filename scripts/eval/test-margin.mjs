// Test: marge onder de inkomenseis (criteria.incomeMarginPercent). Zonder netwerk.
//   node --experimental-strip-types --import ./scripts/eval/register.mjs scripts/eval/test-margin.mjs
import { readFileSync } from "node:fs";
import { deriveFromInput } from "@/lib/precheck";
import { propertyConfigSchema, applicationInputSchema } from "@/lib/schema";

const tenant = JSON.parse(readFileSync(new URL("../../data/tenants/demo.json", import.meta.url), "utf8"));
const base = tenant.properties.find((p) => p.propertyId === "1005"); // huur 1.200, factor 3 = 3.600, hoofdaanvrager
let ok = 0, bad = 0;
const check = (n, c, x = "") => { if (c) ok++; else { bad++; console.log("FOUT:", n, x); } };

function status({ income, margin, guarantor, severity }) {
  const criteria = { ...base.criteria, guarantorCompensatesIncome: false };
  if (margin !== undefined) criteria.incomeMarginPercent = margin; else delete criteria.incomeMarginPercent;
  if (severity) criteria.severity = { income_too_low: severity };
  const config = propertyConfigSchema.parse({ ...base, tenantId: "demo", criteria });
  const input = applicationInputSchema.parse({
    lang: "nl", tenantId: "demo", propertyId: "1005",
    applicant: { name: "Test Persoon", email: "t@example.com", phone: "0612345678", ageConfirmed: true },
    persons: [{ role: "primary", incomeType: "employment", monthlyIncome: income, employmentMonths: 24, inProbation: false, isStudent: false }],
    situation: { hasHousemates: false, hasPets: false }, lease: { desiredStartDate: "2026-12-01", desiredLeaseMonths: 12, guarantorAvailable: guarantor },
    residence: {}, consent: { privacyAccepted: true, version: "t" },
  });
  return deriveFromInput(input, config).precheck;
}

// Eis 3.600. Marge 5% => ondergrens 3.420.
check("zonder marge: net onder = unsuitable", status({ income: 3599 }).status === "unsuitable");
check("marge 0 telt als geen marge", status({ income: 3599, margin: 0 }).status === "unsuitable");
check("marge 5: precies op ondergrens (3.420) = review", status({ income: 3420, margin: 5 }).status === "review");
check("marge 5: 1 cent... € 1 eronder (3.419) = unsuitable", status({ income: 3419, margin: 5 }).status === "unsuitable");
check("marge 5: net onder de eis = review", status({ income: 3599, margin: 5 }).status === "review");
check("marge 5: reden blijft income_too_low", status({ income: 3500, margin: 5 }).reasons.includes("income_too_low"));
check("marge 5: voldoet gewoon = suitable", status({ income: 3600, margin: 5 }).status === "suitable");
check("marge 10: 3.240 = review", status({ income: 3240, margin: 10 }).status === "review");
check("marge 10: 3.239 = unsuitable", status({ income: 3239, margin: 10 }).status === "unsuitable");
check("marge geldt niet voor ver onder de eis", status({ income: 2000, margin: 10 }).status === "unsuitable");
check("marge 11 wordt geweigerd door het schema", (() => { try { status({ income: 3500, margin: 11 }); return false; } catch { return true; } })());
check("marge in combinatie met 'review'-ernst blijft review", status({ income: 3500, margin: 5, severity: "review" }).status === "review");

console.log(bad ? `${bad} fout, ${ok} goed` : `${ok}/${ok} goed`);
if (bad) process.exitCode = 1;
