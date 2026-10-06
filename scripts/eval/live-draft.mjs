// Proef met een ECHT model voor de conceptmail (E5). Gebruik:
//   node --env-file=.env.local --experimental-strip-types --import ./scripts/eval/register.mjs scripts/eval/live-draft.mjs
// Roept de aanbieder rechtstreeks aan (zonder login of database) met verzonnen redenen. Kost een paar honderd tokens per geval.
import { getProvider } from "@/lib/ai/providers";
import { buildDraftRequest, parseDraft, fillName } from "@/lib/ai/draft-mail";

const provider = getProvider();
if (!provider || provider.name === "fake") { console.log("Zet AI_PROVIDER=openai en OPENAI_API_KEY in .env.local."); process.exitCode = 1; }
else {
  const cases = [
    { lang: "nl", reasons: ["income_too_low", "guarantor_required"], name: "Anna" },
    { lang: "nl", reasons: ["probation_not_allowed", "employment_too_short"], name: "Mark" },
    { lang: "en", reasons: ["income_too_low"], name: "Sarah" },
    { lang: "nl", reasons: ["residence_permit_required"], name: "Sanne" },
  ];
  for (const c of cases) {
    const req = buildDraftRequest({ lang: c.lang, propertyAddress: "Keizersgracht 100, Amsterdam", reasons: c.reasons });
    const res = await provider.completeJson(req);
    if (!res.ok) { console.log(`--- ${c.reasons.join("+")} (${c.lang}): AI-fout ${res.code}`); continue; }
    const parsed = parseDraft(res.text);
    console.log(`--- ${c.reasons.join("+")} (${c.lang}) tokens ${res.usage.inputTokens}/${res.usage.outputTokens}`);
    if (!parsed.ok) { console.log(`AFGEKEURD door bewaker: ${parsed.code}`); continue; }
    const f = fillName(parsed.content, c.name);
    console.log(`Onderwerp: ${f.subject}\n${f.body}`);
  }
}
