// Basismeting: hoe goed doet de regelmotor (zonder AI) op de testset?
//
//   node --experimental-strip-types --import ./scripts/eval/register.mjs scripts/eval/run-rules.mjs [--write]
//
// Met --write wordt het rapport in docs/rapport-regels-basis.md gezet. Zonder netwerk, zonder sleutels, zonder kosten.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cases } from "./cases.mjs";
import { deriveFromInput } from "@/lib/precheck";
import { propertyConfigSchema, applicationInputSchema } from "@/lib/schema";

const root = path.resolve(import.meta.dirname, "../..");
const tenant = JSON.parse(readFileSync(path.join(root, "data/tenants/demo.json"), "utf8"));
const GROUPS = ["suitable", "review", "unsuitable"];
const LABEL = { suitable: "Suitable", review: "Review", unsuitable: "Unsuitable" };

const rows = cases.map((c) => {
  const property = tenant.properties.find((p) => p.propertyId === c.propertyId);
  if (!property) throw new Error(`Woning ${c.propertyId} ontbreekt (${c.id})`);
  const config = propertyConfigSchema.parse({ ...property, tenantId: "demo" });
  const input = applicationInputSchema.parse({
    lang: "nl", tenantId: "demo", propertyId: c.propertyId,
    applicant: { name: `Testpersoon ${c.id}`, email: `${c.id}@example.com`, phone: "0612345678", ageConfirmed: true },
    persons: c.persons, situation: c.situation, lease: c.lease, residence: c.residence ?? {},
    motivation: c.motivation, consent: { privacyAccepted: true, version: "test" },
  });
  const { precheck } = deriveFromInput(input, config);
  return { ...c, actual: precheck.status, reasons: precheck.reasons };
});

const ok = (r) => r.actual === r.expected;
const pct = (n, d) => (d === 0 ? "n.v.t." : `${Math.round((n / d) * 100)}%`);

function summarize(list) {
  const matrix = Object.fromEntries(GROUPS.map((e) => [e, Object.fromEntries(GROUPS.map((a) => [a, 0]))]));
  list.forEach((r) => { matrix[r.expected][r.actual]++; });
  const correct = list.filter(ok).length;
  // Het duurste soort fout: de regels zeggen "niet passend" terwijl een mens het wel zou bekijken of geschikt vindt.
  const wronglyUnsuitable = list.filter((r) => r.actual === "unsuitable" && r.expected !== "unsuitable");
  // Het tweede soort: de regels zeggen "geschikt" terwijl een mens het niet geschikt vindt of wil beoordelen.
  const wronglySuitable = list.filter((r) => r.actual === "suitable" && r.expected !== "suitable");
  return { matrix, correct, total: list.length, wronglyUnsuitable, wronglySuitable };
}

const all = summarize(rows);
const clear = summarize(rows.filter((r) => r.kind === "clear"));
const judgment = summarize(rows.filter((r) => r.kind === "judgment"));
const withText = rows.filter((r) => r.needsText);

const line = (s) => `${s.correct}/${s.total} (${pct(s.correct, s.total)})`;
const table = (s) =>
  ["| verwacht \\ regels | Suitable | Review | Unsuitable |", "|---|---|---|---|",
    ...GROUPS.map((e) => `| ${LABEL[e]} | ${GROUPS.map((a) => s.matrix[e][a]).join(" | ")} |`)].join("\n");

const md = `# Basismeting: de regelmotor zonder AI

Gemaakt met \`scripts/eval/run-rules.mjs\` op ${rows.length} verzonnen aanvragen (\`scripts/eval/cases.mjs\`), tegen de woningen 1001 tot 1005 van de demo-tenant.
Rapport is reproduceerbaar: dezelfde invoer geeft hetzelfde rapport.

**Verloop van de meting:**
- Eerste meting (6 okt, zonder inkomensmarge): 31 van 40 goed (78%); 8 aanvragen onterecht "Unsuitable".
- Daarna is \`criteria.incomeMarginPercent\` gebouwd en voor de woningen 1001, 1003 en 1004 op 3% gezet (een inkomen tot 3% onder de eis is dan "Review"). Dit rapport is de meting **met** die marge. Dat de score stijgt is deels logisch, want de testset bevat bewust gevallen net onder de grens (c05, c29, c37). Het is dus een bevestiging dat de instelling doet wat hij moet doen, geen bewijs dat 3% de goede marge is: dat is een keuze van de makelaar.

**Let op bij het lezen:**
- De verwachte uitkomsten zijn bepaald door de ontwikkelaar (met Claude), niet door een echte makelaar. Ze moeten nog worden nagekeken.
- "Duidelijke gevallen" volgen uit de eisen van de woning. "Inschattingsgevallen" zijn gevallen waarin een mens redelijkerwijs anders kan kiezen of informatie gebruikt die de regels niet zien. De testset is bewust niet representatief voor de praktijk: hij bevat verhoudingsgewijs veel lastige gevallen.
- **Circulair deel:** de duidelijke gevallen zijn afgeleid uit dezelfde eisen die de regels gebruiken, dus 100% daar bewijst alleen dat de regels de eisen correct uitrekenen (geen rekenfouten). De inschattingsgevallen zijn bewust bedacht op plekken waar regels tekort kunnen schieten, dus een lage score daar is deels ingebouwd. Een eerlijke meting vraagt om labels van een onafhankelijke persoon (echte makelaar) op aanvragen die niet door ons zijn bedacht.
- Veertig gevallen zijn te weinig voor harde percentages. Gebruik dit als richting en voor het vinden van patronen, niet als bewijs.

## Resultaat

| Groep gevallen | Regels zitten goed |
|---|---|
| Alle gevallen | ${line(all)} |
| Duidelijke gevallen | ${line(clear)} |
| Inschattingsgevallen | ${line(judgment)} |

Verwarringstabel, alle gevallen:

${table(all)}

- **Onterecht "Unsuitable"** (de regels zeggen niet passend, een mens zou het wel bekijken of geschikt vinden): ${all.wronglyUnsuitable.length} van ${rows.length}.
  Dit is het meest schadelijke soort fout, want de woningzoeker komt in de onderste groep terecht. ${all.wronglyUnsuitable.map((r) => r.id).join(", ") || "geen"}.
- **Onterecht "Suitable"** (de regels zeggen geschikt, een mens wil het toch beoordelen): ${all.wronglySuitable.length} van ${rows.length}. ${all.wronglySuitable.map((r) => r.id).join(", ") || "geen"}.

## Alle afwijkingen

| Geval | Woning | Verwacht | Regels | Soort | Reden (mens) | Redenen (regels) |
|---|---|---|---|---|---|---|
${rows.filter((r) => !ok(r)).map((r) => `| ${r.id} | ${r.propertyId} | ${LABEL[r.expected]} | ${LABEL[r.actual]} | ${r.kind === "clear" ? "duidelijk" : "inschatting"}${r.needsText ? ", toelichting beslist" : ""} | ${r.why} | ${r.reasons.join(", ") || "-"} |`).join("\n") || "| (geen) | | | | | | |"}

## Wat dit betekent voor AI (fase E)

- Gevallen waarin de vrije toelichting het oordeel beslist: ${withText.length} (${withText.map((r) => r.id).join(", ")}). Hiervan staan de regels fout bij ${withText.filter((r) => !ok(r)).length}.
  Dit is waar een samenvatting van de toelichting de makelaar kan helpen: zij maakt zichtbaar dat er informatie staat die de regels niet zien. De AI mag de uitkomst **niet zelf** wijzigen.
- Afwijkingen die geen toelichting nodig hebben (grensgevallen, bronlijsten): daar helpt AI niet; dat zijn beleidskeuzes in de woningconfiguratie (bijvoorbeeld een marge, of meer criteria op "review" zetten).
- De regels zijn bij duidelijke gevallen ${line(clear)} goed. Dat is de bovengrens van wat AI hier nog kan verbeteren.

## Wat opvalt (ontwerpvragen, geen AI-vragen)

- Bijna alle afwijkingen zijn van het soort "de regels zeggen **Unsuitable**, een mens zou **Review** kiezen" (${all.wronglyUnsuitable.length} van ${rows.filter((r) => !ok(r)).length}). Dat komt doordat een harde grens (inkomen, bronnenlijst, studenten) niets "bijna" kent.
  Dat is precies de fout waar de woningzoeker het meest onder lijdt, ook al beslist een mens altijd.
- Mogelijke ontwerpkeuzes om te bespreken met een makelaar, zonder AI: een marge van enkele procenten onder de inkomensgrens als **Review** (c05, c29, c37; bestaat nu als instelling incomeMarginPercent, 0 tot 10 procent, standaard uit); studenten of bijzondere inkomensbronnen met een stevig inkomen als **Review** in plaats van **Unsuitable** (c10, c15, c23; nog niet aangepakt).
- Dit zijn beleidskeuzes van de makelaar (per woning in te stellen via \`criteria.severity\`), niet iets wat de ontwikkelaar of AI voor hen beslist.
`;

console.log(`Alle gevallen: ${line(all)} | duidelijk: ${line(clear)} | inschatting: ${line(judgment)}`);
console.log(`Onterecht Unsuitable: ${all.wronglyUnsuitable.map((r) => r.id).join(", ") || "geen"} | onterecht Suitable: ${all.wronglySuitable.map((r) => r.id).join(", ") || "geen"}`);
rows.filter((r) => !ok(r)).forEach((r) => console.log(`  ${r.id} (${r.kind}) verwacht ${r.expected}, regels ${r.actual} [${r.reasons.join(",")}]`));

if (process.argv.includes("--write")) {
  writeFileSync(path.join(root, "docs/rapport-regels-basis.md"), md);
  console.log("Rapport geschreven naar docs/rapport-regels-basis.md");
}
