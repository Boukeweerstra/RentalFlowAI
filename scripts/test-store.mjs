// Test van het opslaan in Supabase bij het indienen, inclusief uitvalscenario's.
//
//   1. node scripts/mock-services.mjs
//   2. app starten (productiebuild of dev) met deze omgeving:
//        MAKE_WEBHOOK_URL=http://localhost:4000/hook MAKE_WEBHOOK_SECRET=test-secret
//        UPSTASH_REDIS_REST_URL=http://localhost:4001 UPSTASH_REDIS_REST_TOKEN=tok
//        SUPABASE_URL=http://localhost:4002 SUPABASE_SECRET_KEY=sb_secret_test
//        APP_URL=http://localhost:3100 FORM_MIN_SECONDS=2 MAX_APPLICATIONS_PER_DAY=100
//        npx next start -p 3100
//   3. node scripts/test-store.mjs
//
// Er worden alleen nep-diensten gebruikt; er gaat niets naar echte systemen.

const APP = process.env.APP_URL ?? "http://localhost:3100";
const MAKE = "http://localhost:4000";
const DB = "http://localhost:4002";
const WAIT_MS = Number(process.env.FORM_MIN_SECONDS ?? 2) * 1000 + 400;

let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "  ok   " : "  FOUT "} ${name}${!ok && detail ? `  -> ${detail}` : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url) => (await fetch(url)).json();
const post = (url) => fetch(url, { method: "POST" });
const makeCount = async () => Number(await (await fetch(`${MAKE}/__count`)).text());
const makeReceived = () => get(`${MAKE}/__received`);
const dbRows = async () => (await get(`${DB}/__apps`)).rows;

let n = 0;
const newIp = () => `10.8.0.${++n}`;
let seq = 0;

function demoBody(email, formToken) {
  return {
    lang: "nl",
    tenantId: "demo",
    propertyId: "1004",
    applicant: { name: "Opslag Test", email, phone: "06 1234 5678", ageConfirmed: true },
    persons: [{ role: "primary", incomeType: "employment", monthlyIncome: 4000, employmentMonths: 24, inProbation: false }],
    situation: { hasHousemates: false, occupants: 2 },
    lease: { desiredStartDate: "2026-12-01", desiredLeaseMonths: 12, guarantorAvailable: true, depositGuaranteeOk: true },
    residence: {},
    motivation: "Testaanvraag voor het opslaan",
    consent: { privacyAccepted: true, version: "2026-09-v1" },
    formToken,
  };
}

function hintsBody(email, formToken) {
  return {
    ...demoBody(email, formToken),
    tenantId: "rotsvast-test",
    propertyId: `TS-${++seq}-${Date.now()}`,
    hints: { rent: 1500, address: "Teststraat 1" },
    situation: { hasHousemates: false, hasPets: false, occupants: 1 },
    lease: { desiredStartDate: "2026-12-01", desiredLeaseMonths: 12, guarantorAvailable: false },
  };
}

async function submit(kind, email, ip = newIp()) {
  const draft = kind === "hints" ? hintsBody(email, "x") : demoBody(email, "x");
  const t = await get(`${APP}/api/form-token?tenantId=${draft.tenantId}&propertyId=${draft.propertyId}`);
  draft.formToken = t.formToken;
  await sleep(WAIT_MS);
  const r = await fetch(`${APP}/api/aanvraag`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(draft),
  });
  let data = {};
  try { data = await r.json(); } catch {}
  return { status: r.status, data, body: draft };
}

const email = () => `store+${Date.now().toString(36)}${++seq}@example.com`;
await post(`${DB}/__reset`);

console.log(`Test tegen ${APP}\n`);

console.log("Alles werkt: opslaan en Make");
{
  const before = await makeCount();
  const e = email();
  const r = await submit("demo", e);
  check("aanvraag geslaagd (200, mode make)", r.status === 200 && r.data.mode === "make", JSON.stringify(r));
  const rows = (await dbRows()).filter((x) => x.email === e);
  check("er staat precies 1 rij in de database", rows.length === 1, String(rows.length));
  const row = rows[0] ?? {};
  check("rij hoort bij het kantoor van tenant demo", row.organization_id === "00000000-0000-4000-8000-0000000000d1", row.organization_id);
  check("naam, e-mail en telefoon staan erin", row.name === "Opslag Test" && row.email === e && row.phone === "06 1234 5678");
  check("woning, huur en inkomen kloppen (config leidend)", row.property_id === "1004" && Number(row.rent) === 1100 && Number(row.total_income) === 4000 && Number(row.income_required) === 2750, JSON.stringify({ rent: row.rent, inc: row.total_income, req: row.income_required }));
  check("eerste check en startgroep gelijk (suitable)", row.precheck_status === "suitable" && row.group_current === "suitable", `${row.precheck_status}/${row.group_current}`);
  check("payload bevat de volledige aanvraag", row.payload?.applicant?.email === e && row.payload?.schemaVersion === 1);
  check("aanvraag-id in de database is gelijk aan het id in de payload", row.id === row.payload?.id);
  check("Make kreeg de aanvraag ook", (await makeCount()) === before + 1);
  const mail = (await makeReceived()).find((x) => x.email === e)?.__mail?.notify?.body ?? "";
  check("mail aan de makelaar bevat de link naar het dashboard", mail.includes(`Open in dashboard: http://localhost:3100/dashboard?application=${row.id}`), mail.slice(-160));
}

console.log("\nMake down, database werkt");
{
  await post(`${MAKE}/__mode?fail=1`);
  const before = await makeCount();
  const e = email();
  const r = await submit("demo", e);
  await post(`${MAKE}/__mode?fail=0`);
  check("toch gelukt (200, mode stored)", r.status === 200 && r.data.mode === "stored", JSON.stringify(r));
  check("de aanvraag staat in de database", (await dbRows()).some((x) => x.email === e));
  check("er ging niets naar Make", (await makeCount()) === before);
}

console.log("\nDatabase down, Make werkt");
{
  await post(`${DB}/__fail?on=1`);
  const before = await makeCount();
  const e = email();
  const r = await submit("demo", e);
  await post(`${DB}/__fail?on=0`);
  check("toch gelukt (200)", r.status === 200 && r.data.ok === true, JSON.stringify(r));
  check("Make kreeg de aanvraag", (await makeCount()) === before + 1);
  const mail = (await makeReceived()).find((x) => x.email === e)?.__mail?.notify?.body ?? "";
  check("de mail bevat GEEN dashboardlink (niet opgeslagen)", mail.length > 0 && !mail.includes("Open in dashboard"), mail.slice(-120));
  check("er staat niets in de database", !(await dbRows()).some((x) => x.email === e));
}

console.log("\nBeide down: plekken worden teruggegeven");
{
  await post(`${DB}/__fail?on=1`);
  await post(`${MAKE}/__mode?fail=1`);
  const e = email();
  const ip = newIp();
  const first = await submit("demo", e, ip);
  await post(`${DB}/__fail?on=0`);
  await post(`${MAKE}/__mode?fail=0`);
  check("duidelijke fout (502)", first.status === 502, JSON.stringify(first));
  const retry = await submit("demo", e, newIp());
  check("opnieuw proberen lukt (geen 409 duplicate)", retry.status === 200, JSON.stringify(retry));
}

console.log("\nTenant zonder kantoor in de database");
{
  const before = await makeCount();
  const e = email();
  const r = await submit("hints", e);
  check("aanvraag gaat gewoon naar Make (200)", r.status === 200 && r.data.mode === "make", JSON.stringify(r));
  check("er is niets opgeslagen (geen kantoor)", !(await dbRows()).some((x) => x.email === e));
  check("Make kreeg de aanvraag", (await makeCount()) === before + 1);
}

console.log("\nSleutel");
{
  const { wrongKey } = await get(`${DB}/__apps`);
  check("de app gebruikte altijd de juiste geheime sleutel (geen 401 bij de database)", wrongKey === 0, String(wrongKey));
}

console.log(`\n${passed} geslaagd, ${failed} mislukt`);
process.exitCode = failed ? 1 : 0;
