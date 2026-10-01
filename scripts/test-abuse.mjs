// Test van alle lagen tegen misbruik, tegen een draaiende app + de nep-diensten.
//
//   1. node scripts/mock-services.mjs
//   2. app starten met deze omgeving (productiebuild of dev):
//        MAKE_WEBHOOK_URL=http://localhost:4000/hook MAKE_WEBHOOK_SECRET=test-secret
//        UPSTASH_REDIS_REST_URL=http://localhost:4001 UPSTASH_REDIS_REST_TOKEN=tok
//        FORM_MIN_SECONDS=2 RL_IP_MAX=8 RL_EMAIL_MAX=3 MAX_APPLICATIONS_PER_DAY=14
//        npx next start -p 3100
//   3. node scripts/test-abuse.mjs
//
// Elke test gebruikt een eigen "IP" (x-forwarded-for) zodat de IP-limiet de andere tests niet raakt.

const APP = process.env.APP_URL ?? "http://localhost:3100";
const MAKE = "http://localhost:4000";
const UP = "http://localhost:4001";
const MIN_WAIT_MS = Number(process.env.FORM_MIN_SECONDS ?? 2) * 1000 + 400;

let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "  ok   " : "  FOUT "} ${name}${!ok && detail ? `  -> ${detail}` : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const makeCount = async () => Number(await (await fetch(`${MAKE}/__count`)).text());
const keys = async (prefix) => (await fetch(`${UP}/__keys?prefix=${encodeURIComponent(prefix)}`)).json();

let ipCounter = 10;
const newIp = () => `10.9.${Math.floor(ipCounter / 250)}.${ipCounter++ % 250}`;

async function token(propertyId, ip, tenantId = "rotsvast-test") {
  const r = await fetch(`${APP}/api/form-token?tenantId=${tenantId}&propertyId=${propertyId}`, {
    headers: { "x-forwarded-for": ip },
  });
  return (await r.json()).formToken;
}

function body({ propertyId, email, name = "Test Persoon", formToken, tenantId = "rotsvast-test", extra = {} }) {
  return {
    lang: "nl",
    tenantId,
    propertyId,
    hints: { rent: 1500, address: "Teststraat 1" },
    applicant: { name, email, phone: "0612345678", ageConfirmed: true },
    persons: [{ role: "primary", incomeType: "employment", monthlyIncome: 5000, employmentMonths: 24, inProbation: false }],
    situation: { hasHousemates: false, hasPets: false, occupants: 1 },
    lease: { desiredStartDate: "2026-12-01", desiredLeaseMonths: 12, guarantorAvailable: false },
    residence: {},
    consent: { privacyAccepted: true, version: "2026-09-v1" },
    formToken,
    ...extra,
  };
}

async function post(b, ip) {
  const r = await fetch(`${APP}/api/aanvraag`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(b),
  });
  let data = {};
  try {
    data = await r.json();
  } catch {}
  return { status: r.status, data };
}

/** Haalt een token, wacht de minimale invultijd en verstuurt. */
async function submitWhenReady({ propertyId, email, ip = newIp(), ...rest }) {
  const formToken = await token(propertyId, ip);
  await sleep(MIN_WAIT_MS);
  return post(body({ propertyId, email, formToken, ...rest }), ip);
}

console.log(`Test tegen ${APP}\n`);

// 1. Formuliertoken -------------------------------------------------------
console.log("Formuliertoken en invultijd");
{
  const ip = newIp();
  const t = await token("T-fast", ip);
  check("token-eindpunt geeft een token", typeof t === "string" && t.includes("."));

  const before = await makeCount();
  const fast = await post(body({ propertyId: "T-fast", email: "fast@example.com", formToken: t }), ip);
  check("te snel ingevuld wordt geweigerd (400 too_fast)", fast.status === 400 && fast.data.error === "too_fast", JSON.stringify(fast));
  check("… en er gaat niets naar Make", (await makeCount()) === before);

  await sleep(MIN_WAIT_MS);
  const later = await post(body({ propertyId: "T-fast", email: "fast@example.com", formToken: t }), ip);
  check("dezelfde token na de wachttijd werkt wel (200)", later.status === 200, JSON.stringify(later));

  const noToken = await post(body({ propertyId: "T-none", email: "none@example.com" }), newIp());
  check("zonder token: 400 session_invalid", noToken.status === 400 && noToken.data.error === "session_invalid", JSON.stringify(noToken));

  const forged = await post(body({ propertyId: "T-forged", email: "forged@example.com", formToken: `${Date.now() - 60000}.AAAA` }), newIp());
  check("vervalst token: 400 session_invalid", forged.status === 400 && forged.data.error === "session_invalid", JSON.stringify(forged));

  const other = await token("T-other-a", newIp());
  await sleep(MIN_WAIT_MS);
  const wrongProp = await post(body({ propertyId: "T-other-b", email: "wp@example.com", formToken: other }), newIp());
  check("token van een andere woning: 400 session_invalid", wrongProp.status === 400 && wrongProp.data.error === "session_invalid", JSON.stringify(wrongProp));
}

// 2. Spam en wegwerp-e-mail ------------------------------------------------
console.log("\nSpam en wegwerp-e-mail");
{
  const d = await submitWhenReady({ propertyId: "S-1", email: "iemand@mailinator.com" });
  check("wegwerp-e-mail geweigerd", d.status === 400 && d.data.errors?.["applicant.email"] === "email_not_allowed", JSON.stringify(d));
  const sub = await submitWhenReady({ propertyId: "S-2", email: "iemand@abc.yopmail.com" });
  check("subdomein van wegwerpdomein geweigerd", sub.status === 400 && sub.data.errors?.["applicant.email"] === "email_not_allowed", JSON.stringify(sub));
  const n = await submitWhenReady({ propertyId: "S-3", email: "naam@example.com", name: "Koop nu www.spam.nl" });
  check("naam met link geweigerd", n.status === 400 && n.data.errors?.["applicant.name"] === "invalid_name", JSON.stringify(n));
  const l = await submitWhenReady({ propertyId: "S-4", email: "links@example.com", extra: { motivation: "kijk http://a.nl en https://b.nl" } });
  check("toelichting met 2 links geweigerd", l.status === 400 && l.data.errors?.motivation === "links_not_allowed", JSON.stringify(l));
  const one = await submitWhenReady({ propertyId: "S-5", email: "een@example.com", extra: { motivation: "meer info: https://mijnwerk.nl" } });
  check("toelichting met 1 link is toegestaan", one.status === 200, JSON.stringify(one));
}

// 3. Honeypot, grootte -----------------------------------------------------
console.log("\nHoneypot en grootte");
{
  const before = await makeCount();
  const ip = newIp();
  const t = await token("H-1", ip);
  await sleep(MIN_WAIT_MS);
  const bot = await post(body({ propertyId: "H-1", email: "bot@example.com", formToken: t, extra: { website: "http://spam" } }), ip);
  check("honeypot: nep-succes (200)", bot.status === 200 && bot.data.ok === true);
  check("… maar er gaat niets naar Make", (await makeCount()) === before);

  const big = await fetch(`${APP}/api/aanvraag`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": newIp() },
    body: JSON.stringify({ tenantId: "rotsvast-test", propertyId: "B", pad: "x".repeat(30000) }),
  });
  check("te grote body: 413", big.status === 413, String(big.status));
}

// 4. Dubbele aanvraag en aflevering mislukt ---------------------------------
console.log("\nDubbele aanvragen");
{
  const a = await submitWhenReady({ propertyId: "D-1", email: "dubbel@example.com" });
  check("eerste aanvraag: 200", a.status === 200, JSON.stringify(a));
  const b = await submitWhenReady({ propertyId: "D-1", email: "DUBBEL@example.com" });
  check("zelfde e-mail (ook in hoofdletters) + zelfde woning: 409 duplicate", b.status === 409 && b.data.error === "duplicate", JSON.stringify(b));
  const c = await submitWhenReady({ propertyId: "D-2", email: "dubbel@example.com" });
  check("zelfde e-mail, andere woning: 200", c.status === 200, JSON.stringify(c));
}
console.log("\nAflevering mislukt geeft de plek terug");
{
  await fetch(`${MAKE}/__mode?fail=1`, { method: "POST" });
  const capBefore = (await keys("cap:"));
  const fail = await submitWhenReady({ propertyId: "R-1", email: "retry@example.com" });
  check("Make down: 502 delivery_failed", fail.status === 502 && fail.data.error === "delivery_failed", JSON.stringify(fail));
  await fetch(`${MAKE}/__mode?fail=0`, { method: "POST" });
  const ok = await submitWhenReady({ propertyId: "R-1", email: "retry@example.com" });
  check("daarna opnieuw proberen lukt (geen 409)", ok.status === 200, JSON.stringify(ok));
  const capAfter = await keys("cap:");
  const [k] = Object.keys(capAfter);
  const delta = Number(capAfter[k]) - Number(capBefore[k] ?? 0);
  check("dagteller telt de mislukte poging niet mee (+1 i.p.v. +2)", delta === 1, `verschil ${delta}`);
}

// 5. Rate limit per e-mailadres --------------------------------------------
console.log("\nRate limit per e-mailadres (max 3 per uur)");
{
  const email = "veelvoud@example.com";
  const r = [];
  for (const p of ["E-1", "E-2", "E-3", "E-4"]) r.push(await submitWhenReady({ propertyId: p, email }));
  check("eerste drie aanvragen: 200", r.slice(0, 3).every((x) => x.status === 200), JSON.stringify(r.map((x) => x.status)));
  check("vierde: 429 rate_limited", r[3].status === 429 && r[3].data.error === "rate_limited", JSON.stringify(r[3]));
}

// 6. Rate limit per IP ----------------------------------------------------
console.log("\nRate limit per IP (max 8 per venster)");
{
  const ip = newIp();
  const results = [];
  for (let i = 0; i < 10; i++) {
    results.push(await post(body({ propertyId: "I-1", email: `ip${i}@example.com`, formToken: "x" }), ip));
  }
  const codes = results.map((x) => x.status);
  check("eerste 8 verzoeken komen door de IP-limiet (400 vanwege token)", codes.slice(0, 8).every((c) => c === 400), codes.join(","));
  check("9e en 10e verzoek: 429", codes[8] === 429 && codes[9] === 429, codes.join(","));
  const other = await post(body({ propertyId: "I-1", email: "ander@example.com", formToken: "x" }), newIp());
  check("een ander IP wordt niet geraakt", other.status === 400, String(other.status));
}

// 7. Storing van de gedeelde teller -----------------------------------------
console.log("\nStoring van de gedeelde teller (Upstash)");
{
  await fetch(`${UP}/__fail?on=1`, { method: "POST" });
  const r = await submitWhenReady({ propertyId: "U-1", email: "storing@example.com" });
  check("Upstash down: app werkt door via geheugen (200)", r.status === 200, JSON.stringify(r));
  await fetch(`${UP}/__fail?on=0`, { method: "POST" });
}

// 8. Dagplafond ------------------------------------------------------------
console.log("\nDagplafond");
{
  const cap = Number(process.env.MAX_APPLICATIONS_PER_DAY ?? 14);
  const now = Object.values(await keys("cap:"))[0] ?? 0;
  let n = 0;
  for (let i = Number(now); i < cap; i++) {
    const r = await submitWhenReady({ propertyId: `C-${i}`, email: `cap${i}@example.com` });
    if (r.status === 200) n++;
  }
  const over = await submitWhenReady({ propertyId: "C-over", email: "over@example.com" });
  check(`plafond van ${cap} per dag bereikt, volgende: 503 busy`, over.status === 503 && over.data.error === "busy", `${JSON.stringify(over)} (opgevuld: ${n})`);
  // Was de dubbel-plek van de geweigerde aanvraag niet teruggegeven, dan zou dit 409 zijn.
  const again = await submitWhenReady({ propertyId: "C-over", email: "over@example.com" });
  check("… en de geweigerde aanvraag blokkeert zichzelf niet (503, geen 409)", again.status === 503, JSON.stringify(again));
}

console.log(`\n${passed} geslaagd, ${failed} mislukt`);
process.exit(failed ? 1 : 0);
