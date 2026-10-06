// Test: een tenant in productiemodus vertrouwt alleen zijn eigen config, nooit de hints uit het widget.
// Gebruik (app moet draaien op APP_URL, standaard http://localhost:3100):  node scripts/test-production-mode.mjs
const base = process.env.APP_URL ?? "http://localhost:3100";
let ok = 0, bad = 0;
const check = (name, cond, extra = "") => { if (cond) { ok++; } else { bad++; console.log("FOUT:", name, extra); } };

async function page(path) {
  const res = await fetch(base + path, { redirect: "manual" });
  // Alleen de zichtbare inhoud: Next.js stuurt in <script> ook de opgevraagde URL mee; dat is geen weergave.
  const html = await res.text();
  const text = html.replace(/<script[\s\S]*?<\/script>/g, "");
  return { status: res.status, text, headers: res.headers };
}

try {
  // 1. Bekende woning toont de config, ook als de bezoeker een andere huur/adres meegeeft.
  const known = await page("/embed/aanvraag/voorbeeld-productie/P-1?lang=nl&rent=1&address=HACK%20STRAAT%209");
  check("bekende woning opent", known.status === 200);
  check("config-adres wordt getoond", known.text.includes("Voorbeeldlaan 1"));
  check("hint-adres wordt genegeerd", !known.text.includes("HACK STRAAT"));
  // Huur 1.500 uit de config, drie keer = € 4.500. Met de hint (huur 1) zou € 3 staan.
  check("config-huur telt (eis € 4.500)", /€[\s ]*4\.500/.test(known.text));

  // 2. Onbekende woning met hints levert geen formulier op (bij een test-tenant wel).
  const unknown = await page("/embed/aanvraag/voorbeeld-productie/ONBEKEND?lang=nl&rent=1500&address=Nepstraat%201");
  check("onbekende woning: niet gevonden", /niet gevonden|bestaat niet|not found/i.test(unknown.text));
  check("onbekende woning: geen formulier", !unknown.text.includes("Nepstraat") && !/name="applicant/.test(unknown.text));
  const testTenant = await page("/embed/aanvraag/rotsvast-test/ONBEKEND-TEST?lang=nl&rent=1500&address=Nepstraat%201");
  check("controle: test-tenant gebruikt hints wel", testTenant.text.includes("Nepstraat"));

  // 3. Onbekende tenant.
  const noTenant = await page("/embed/aanvraag/bestaat-niet/P-1?lang=nl");
  check("onbekende tenant: niet gevonden", /niet gevonden|bestaat niet|not found/i.test(noTenant.text));

  // 4. Alleen het eigen domein mag het formulier insluiten.
  const csp = known.headers.get("content-security-policy") ?? "";
  check("frame-ancestors bevat eigen domein", csp.includes("https://www.voorbeeld-makelaar.example"), csp);
  check("frame-ancestors bevat geen localhost voor deze tenant", !csp.includes("localhost:3000"), csp);

  // 5. Privacyverklaring bestaat voor deze tenant.
  const privacy = await page("/privacy/voorbeeld-productie?lang=nl");
  check("privacyverklaring opent", privacy.status === 200 && privacy.text.includes("Voorbeeld Productie"));
} catch (e) {
  console.error("Test kon niet draaien (draait de app?):", e.cause?.code ?? e.message);
  process.exitCode = 1;
}
console.log(bad ? `${bad} fout, ${ok} goed` : `${ok}/${ok} goed`);
if (bad) process.exitCode = 1;
