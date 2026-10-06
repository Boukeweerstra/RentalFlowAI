// Integratietest: woningen uit de database in het formulier voor woningzoekers.
//   node --env-file=.env.local scripts/test-properties-db.mjs        (app moet draaien op APP_URL, standaard http://localhost:3100)
// Maakt tijdelijk een woning T-DB-1 bij kantoor "demo" in de database, wijzigt en verwijdert die weer. Wacht tussendoor
// 11 seconden omdat de app woningen 10 seconden onthoudt. Raakt de andere woningen niet.
import { createClient } from "@supabase/supabase-js";

const base = process.env.APP_URL ?? "http://localhost:3100";
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) { console.error("SUPABASE_SECRET_KEY ontbreekt: start met --env-file=.env.local"); process.exitCode = 1; }
else {
  const db = createClient(url, key, { auth: { persistSession: false } });
  let ok = 0, bad = 0;
  const check = (n, c, x = "") => { if (c) ok++; else { bad++; console.log("FOUT:", n, x); } };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = async (path) => {
    const res = await fetch(base + path, { redirect: "manual" });
    const html = await res.text();
    return { status: res.status, text: html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") };
  };
  const criteria = (factor) => ({
    minAge: 18, allowedIncomeTypes: ["employment"], minIncomeFactor: factor, incomeBasis: "household", maxApplicants: 2,
    probationAllowed: true, guarantor: "allowed", guarantorCompensatesIncome: true, housematesAllowed: true, studentsAllowed: true,
    depositGuarantee: "not_needed", residencePermitRequired: false,
  });

  try {
    const { data: org } = await db.from("organizations").select("id").eq("tenant_key", "demo").single();
    await db.from("properties").delete().eq("organization_id", org.id).eq("property_id", "T-DB-1");

    // 1. Een woning uit de database verschijnt in het formulier.
    const ins = await db.from("properties").insert({ organization_id: org.id, property_id: "T-DB-1", address: "Databaselaan 7, Testdorp", rent: 1000, criteria: criteria(3), documents_later: ["payslip"] }).select("id").single();
    check("woning aangemaakt", !ins.error, ins.error?.message);
    let p = await visible("/embed/aanvraag/demo/T-DB-1?lang=nl");
    check("formulier opent voor databasewoning", p.status === 200 && p.text.includes("Databaselaan 7"));
    check("eis uit database (3x huur = 3.000)", /€\s*3\.000/.test(p.text), p.text.slice(0, 300));
    const token = await fetch(`${base}/api/form-token?tenantId=demo&propertyId=T-DB-1`);
    check("formuliertoken voor databasewoning", token.status === 200, String(token.status));

    // 2. Een wijziging komt door.
    await db.from("properties").update({ criteria: criteria(4), address: "Databaselaan 7a, Testdorp" }).eq("id", ins.data.id);
    await sleep(11000);
    p = await visible("/embed/aanvraag/demo/T-DB-1?lang=nl");
    check("nieuw adres getoond", p.text.includes("Databaselaan 7a"));
    check("nieuwe eis (4x huur = 4.000)", /€\s*4\.000/.test(p.text));

    // 3. Uitzetten sluit het formulier, ook al bestaat er een JSON-terugval niet voor deze woning.
    await db.from("properties").update({ active: false }).eq("id", ins.data.id);
    // Een token halen vóór het wachten, zodat de minimale invultijd van de app al voorbij is als we versturen.
    const tokenOff = await (await fetch(`${base}/api/form-token?tenantId=demo&propertyId=T-DB-1`)).json();
    await sleep(11000);
    p = await visible("/embed/aanvraag/demo/T-DB-1?lang=nl");
    check("niet-actieve woning: formulier gesloten", /niet gevonden|bestaat niet|not found/i.test(p.text) && !p.text.includes("Databaselaan"), p.text.slice(0, 200));
    const post = await fetch(`${base}/api/aanvraag`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ tenantId: "demo", propertyId: "T-DB-1", formToken: tokenOff.formToken, lang: "nl" }),
    });
    const postBody = await post.text();
    check("niet-actieve woning: versturen geweigerd (property_not_found)", post.status === 404 && postBody.includes("property_not_found"), `${post.status} ${postBody.slice(0, 100)}`);

    // 4. Een niet-actieve databasewoning valt NIET terug op het JSON-bestand: zet 1001 tijdelijk uit en terug.
    const { data: w1001 } = await db.from("properties").select("id, active").eq("organization_id", org.id).eq("property_id", "1001").single();
    await db.from("properties").update({ active: false }).eq("id", w1001.id);
    await sleep(11000);
    p = await visible("/embed/aanvraag/demo/1001?lang=nl");
    check("1001 uitgezet in database: geen formulier (geen terugval op bestand)", /niet gevonden|bestaat niet|not found/i.test(p.text), p.text.slice(0, 160));
    await db.from("properties").update({ active: w1001.active }).eq("id", w1001.id);

    // 5. Opruimen, en een niet bestaande woning blijft niet gevonden.
    await db.from("properties").delete().eq("id", ins.data.id);
    await sleep(11000);
    p = await visible("/embed/aanvraag/demo/T-DB-1?lang=nl");
    check("verwijderde woning: niet gevonden", /niet gevonden|bestaat niet|not found/i.test(p.text));
    p = await visible("/embed/aanvraag/demo/1001?lang=nl");
    check("1001 weer beschikbaar", p.status === 200 && p.text.includes("Keizersgracht 100"), p.text.slice(0, 160));
  } catch (e) {
    console.error("Test kon niet draaien:", e.message);
    bad++;
  }
  console.log(bad ? `${bad} fout, ${ok} goed` : `${ok}/${ok} goed`);
  if (bad) process.exitCode = 1;
}
