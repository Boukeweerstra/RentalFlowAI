// Rooktest voor de hele keten: app, n8n, opslag, afscherming (RLS) en opruimen.
//
// Gebruik (app draait op :3100, n8n draait, .env.local bevat de Supabase-sleutels):
//   node scripts/smoke.mjs [jouw-emailadres]
//
// Let op:
//  - Er gaat echt een aanvraag door n8n: een rij in de Sheet en een melding in je inbox (het adres
//    krijgt "+smoke..."). Het testkantoor "demo" stuurt geen bevestiging naar de aanvrager.
//  - De testaanvraag wordt aan het eind uit de database verwijderd (rechtstreeks, niet via het dashboard).
//  - De waarden van de sleutels worden nooit geprint.

import { readFileSync } from "node:fs";

const base = process.env.APP_URL ?? "http://localhost:3100";
const n8nBase = process.env.N8N_URL ?? "http://localhost:5678";
const email = process.argv[2] ?? "smoke@example.com";

function loadEnv(file) {
  const out = {};
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}
const env = { ...loadEnv(".env.local"), ...process.env };
const supaUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = env.SUPABASE_SECRET_KEY;
const webhookUrl = env.WORKFLOW_WEBHOOK_URL || env.MAKE_WEBHOOK_URL;

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "OK    " : "FOUT  "}${name}${!ok && detail ? `  (${detail})` : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rest = (key, path, init = {}) =>
  fetch(`${supaUrl}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });

// 1. Basis: is alles bereikbaar en ingesteld?
check("sleutels en URL's staan in .env.local", Boolean(supaUrl && anonKey && secretKey && webhookUrl));
if (!(supaUrl && anonKey && secretKey && webhookUrl)) {
  throw new Error("Ontbrekende instellingen; zie scripts/smoke.mjs");
}
const home = await fetch(base).catch(() => null);
check("app bereikbaar", home?.ok === true, base);
const health = await fetch(`${n8nBase}/healthz`).catch(() => null);
check("n8n bereikbaar (healthz)", health?.ok === true, n8nBase);

// 2. De webhook weigert een verkeerd geheim (zonder dat er een aanvraag of mail ontstaat).
const bad = await fetch(webhookUrl, {
  method: "POST",
  headers: { "content-type": "application/json", "x-make-apikey": "verkeerd-geheim" },
  body: "{}",
}).catch(() => null);
check("webhook weigert een verkeerd geheim", bad && (bad.status === 401 || bad.status === 403), `status ${bad?.status}`);

// 3. Aanvraag indienen via de echte route.
const tag = Date.now().toString(36);
const uniqueEmail = email.replace("@", `+smoke${tag}@`);
const body = {
  lang: "nl",
  tenantId: "demo",
  propertyId: "1001",
  applicant: { name: "Smoke Test", email: uniqueEmail, phone: "0612345678", ageConfirmed: true },
  residence: {},
  lease: { desiredStartDate: "2026-12-01", desiredLeaseMonths: 12 },
  consent: { privacyAccepted: true, version: "smoke" },
  motivation: `Rooktest ${new Date().toISOString()}`,
  persons: [{ role: "primary", incomeType: "employment", monthlyIncome: 6000, employmentMonths: 2, inProbation: true, isStudent: false }],
  situation: { hasHousemates: false, hasPets: false, occupants: 1 },
};
async function submit() {
  const t = await fetch(`${base}/api/form-token?tenantId=demo&propertyId=1001`);
  if (!t.ok) throw new Error(`geen formuliertoken (${t.status})`);
  const { formToken, minSeconds } = await t.json();
  await sleep((minSeconds + 0.5) * 1000);
  const res = await fetch(`${base}/api/aanvraag`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, formToken }),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
console.log("Aanvraag indienen (wacht op de minimale invultijd)...");
const first = await submit();
check("aanvraag geaccepteerd (200)", first.status === 200 && first.data.ok === true, JSON.stringify(first));
check("doorgestuurd naar de workflow", first.data.mode === "workflow", `mode ${first.data.mode}`);
const id = first.data.id;

// 4. Opslag in de database en afscherming.
if (id) {
  const row = await (await rest(secretKey, `applications?id=eq.${id}&select=id,email,precheck_status,group_current,handling_status`)).json();
  check("aanvraag staat in de database", Array.isArray(row) && row.length === 1, JSON.stringify(row).slice(0, 120));
  check("eerste check = review (proeftijd en kort dienstverband)", row?.[0]?.precheck_status === "review", `status ${row?.[0]?.precheck_status}`);
  check("aanvraag begint in de groep review en op status nieuw", row?.[0]?.group_current === "review" && row?.[0]?.handling_status === "nieuw", JSON.stringify(row?.[0]));

  const anon = await rest(anonKey, `applications?id=eq.${id}&select=id`);
  const anonRows = await anon.json().catch(() => null);
  check("anonieme bezoeker kan de aanvraag NIET lezen (RLS)", Array.isArray(anonRows) ? anonRows.length === 0 : anon.status >= 400, `status ${anon.status}`);
}

// 5. Misbruikbescherming: dezelfde aanvraag direct opnieuw wordt als dubbel geweigerd.
const second = await submit();
check("dubbele aanvraag wordt geweigerd (409)", second.status === 409, `status ${second.status}`);

// 6. Opruimen: testaanvraag verwijderen en controleren.
if (id) {
  await rest(secretKey, `applications?id=eq.${id}`, { method: "DELETE" });
  const gone = await (await rest(secretKey, `applications?id=eq.${id}&select=id`)).json();
  check("testaanvraag opgeruimd", Array.isArray(gone) && gone.length === 0);
}

console.log(failed === 0 ? "\nAlles OK." : `\n${failed} controle(s) mislukt.`);
console.log("Handmatig nog te zien: een rij in de Sheet en een mail '[Aanvraag: BEOORDELEN]' in je inbox (n8n bewaart geen uitvoeringen).");
process.exitCode = failed === 0 ? 0 : 1;
