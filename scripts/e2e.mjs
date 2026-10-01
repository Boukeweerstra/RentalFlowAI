// End-to-end test: stuurt een testaanvraag door de echte keten
// (app → Make.com → Google Sheets → Gmail), zonder het formulier in te vullen.
//
// Gebruik (app moet draaien, .env.local moet MAKE_WEBHOOK_URL bevatten):
//   node scripts/e2e.mjs <suitable|review|unsuitable> <jouw-emailadres> [nl|en]
//
// Let op:
//  - De bevestigingsmail (als die aan staat) gaat naar het opgegeven adres. Gebruik je eigen adres.
//  - Het script wacht de minimale invultijd af (standaard 8 s) omdat de app snelle bots weigert.
//  - Het adres krijgt automatisch "+e2e<code>" (naam+e2eabc@gmail.com), zodat de controle op dubbele
//    aanvragen elke testrun toelaat. De mail komt gewoon in dezelfde inbox aan.
//  - Standaard maximaal 5 aanvragen per 10 minuten per IP.
//  - Werkt niet tegen een site met Vercel Deployment Protection of Turnstile (gebruik dan de browser).

const [scenario, email, lang = "nl"] = process.argv.slice(2);
const base = process.env.APP_URL ?? "http://localhost:3100";

if (!["suitable", "review", "unsuitable"].includes(scenario) || !email?.includes("@")) {
  console.error("Gebruik: node scripts/e2e.mjs <suitable|review|unsuitable> <emailadres> [nl|en]");
  process.exit(1);
}

// De app blokkeert dezelfde persoon + woning binnen 24 uur (dubbele aanvragen) en beperkt het aantal
// aanvragen per e-mailadres. Met "plus-adressering" (naam+tekst@gmail.com) is elke testrun een ander
// adres, terwijl de mail gewoon in dezelfde inbox aankomt.
const uniqueEmail = email.includes("+")
  ? email
  : email.replace("@", `+e2e${Date.now().toString(36)}@`);

// Woning 1001: huur € 1.850, inkomenseis € 5.550 (gezamenlijk), geen huisdieren, max 3 bewoners.
const good = { role: "primary", incomeType: "employment", monthlyIncome: 3200, employmentMonths: 24, inProbation: false, isStudent: false };
const scenarios = {
  // Twee personen, samen € 6.100, geen bezwaren.
  suitable: {
    persons: [good, { role: "partner", incomeType: "employment", monthlyIncome: 2900, employmentMonths: 36, inProbation: false }],
    situation: { hasHousemates: false, hasPets: false, occupants: 2 },
  },
  // Inkomen prima, maar in proeftijd en kort in dienst: bij 1001 zijn dat review-criteria.
  review: {
    persons: [{ ...good, monthlyIncome: 6000, employmentMonths: 2, inProbation: true }],
    situation: { hasHousemates: false, hasPets: false, occupants: 1 },
  },
  // Te laag inkomen én huisdier: hard.
  unsuitable: {
    persons: [{ ...good, monthlyIncome: 2000 }],
    situation: { hasHousemates: false, hasPets: true, occupants: 1 },
  },
};

const body = {
  lang,
  tenantId: "demo",
  propertyId: "1001",
  applicant: { name: `E2E ${scenario}`, email: uniqueEmail, phone: "0612345678", ageConfirmed: true },
  residence: {},
  lease: { desiredStartDate: "2026-12-01", desiredLeaseMonths: 12 },
  consent: { privacyAccepted: true, version: "2026-09-v1" },
  motivation: `E2E-testaanvraag (${scenario}), ${new Date().toISOString()}`,
  ...scenarios[scenario],
};

// De API eist een ondertekend formuliertoken en een minimale invultijd (bescherming tegen bots).
const tokenRes = await fetch(
  `${base}/api/form-token?tenantId=${body.tenantId}&propertyId=${body.propertyId}`,
);
if (!tokenRes.ok) {
  // Een fout werpen i.p.v. process.exit(): dat laat Node op Windows crashen na een fetch.
  throw new Error(`Kon geen formuliertoken ophalen (${tokenRes.status}). Draait de app op ${base}?`);
}
const { formToken, minSeconds } = await tokenRes.json();
console.log(`Token opgehaald; ${minSeconds} s wachten (minimale invultijd)…`);
await new Promise((r) => setTimeout(r, (minSeconds + 0.5) * 1000));

const res = await fetch(`${base}/api/aanvraag`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ ...body, formToken }),
});
const text = await res.text();
console.log(`${res.status} ${text}`);
if (res.ok) {
  const { mode } = JSON.parse(text);
  console.log(
    mode === "make"
      ? "Verstuurd naar Make.com. Controleer de Sheet en je inbox."
      : "LET OP: mode=dev-log, er is niets naar Make gestuurd (MAKE_WEBHOOK_URL ontbreekt).",
  );
}
process.exitCode = res.ok ? 0 : 1; // geen process.exit(): dat laat Node op Windows crashen na een fetch
