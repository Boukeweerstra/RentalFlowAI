// Testset voor de eerste check: verzonnen aanvragen met een door een mens bepaalde verwachte uitkomst.
//
// BELANGRIJK over de labels:
//  - `expected` is wat een redelijke makelaar zou besluiten, bepaald op basis van de woningeisen (data/tenants/demo.json)
//    en gezond verstand, NIET door te kijken wat de regels uitrekenen.
//  - De labels zijn geschreven door de ontwikkelaar (met Claude) en moeten nog door een echte makelaar of door jou worden nagekeken.
//  - `kind: "clear"`: het oordeel volgt uit de eisen. `kind: "judgment"`: een mens zou redelijkerwijs anders kunnen kiezen of
//    gebruikt informatie die de regels niet zien (bijvoorbeeld in de toelichting). `needsText: true` = de vrije toelichting beslist.
//  - Alle gegevens zijn verzonnen. Geen echte personen.

const emp = (monthlyIncome, employmentMonths, extra = {}) => ({
  role: "primary", incomeType: "employment", monthlyIncome, employmentMonths, inProbation: false, isStudent: false, ...extra,
});
const partner = (monthlyIncome, employmentMonths = 24) => ({
  role: "partner", incomeType: "employment", monthlyIncome, employmentMonths, inProbation: false,
});
const solo = (type, monthlyIncome, extra = {}) => ({ role: "primary", incomeType: type, monthlyIncome, ...extra });

const sit = (occupants, extra = {}) => ({ hasHousemates: false, hasPets: false, occupants, ...extra });
const lease = (months = 12, extra = {}) => ({ desiredStartDate: "2026-12-01", desiredLeaseMonths: months, ...extra });

export const cases = [
  // ---- woning 1001: huur 1.850, gezamenlijk inkomen ≥ 5.550, geen huisdieren, max 3 bewoners, geen garantsteller ----
  { id: "c01", propertyId: "1001", kind: "clear", expected: "suitable", why: "Samen 6.100, vast dienstverband, geen bezwaren",
    persons: [emp(3200, 24), partner(2900, 36)], situation: sit(2), lease: lease() },
  { id: "c02", propertyId: "1001", kind: "clear", expected: "suitable", why: "Alleen 6.000, vast",
    persons: [emp(6000, 24)], situation: sit(1), lease: lease() },
  { id: "c03", propertyId: "1001", kind: "clear", expected: "review", why: "Inkomen prima maar proeftijd en kort dienstverband: zelf beoordelen",
    persons: [emp(6000, 2, { inProbation: true })], situation: sit(1), lease: lease() },
  { id: "c04", propertyId: "1001", kind: "clear", expected: "unsuitable", why: "Inkomen 2.000 en huisdier",
    persons: [emp(2000, 24)], situation: sit(1, { hasPets: true }), lease: lease() },
  { id: "c05", propertyId: "1001", kind: "judgment", expected: "review", why: "Samen 5.540, € 10 onder de grens: een mens kijkt even",
    persons: [emp(3000, 24), partner(2540)], situation: sit(2), lease: lease() },
  { id: "c06", propertyId: "1001", kind: "clear", expected: "suitable", why: "Precies 5.550",
    persons: [emp(3000, 24), partner(2550)], situation: sit(2), lease: lease() },
  { id: "c07", propertyId: "1001", kind: "clear", expected: "suitable", why: "Zelfstandige met 36 maanden en 7.000",
    persons: [solo("self_employed", 7000, { employmentMonths: 36 })], situation: sit(1), lease: lease() },
  { id: "c08", propertyId: "1001", kind: "judgment", expected: "review", why: "Zzp'er pas 8 maanden bezig: stabiliteit onzeker (de regels controleren dit alleen bij loondienst)",
    motivation: "Ik ben sinds acht maanden zzp'er, mijn omzet groeit snel.",
    persons: [solo("self_employed", 6000, { employmentMonths: 8 })], situation: sit(1), lease: lease() },
  { id: "c09", propertyId: "1001", kind: "clear", expected: "unsuitable", why: "4 bewoners, maximum 3",
    persons: [emp(6000, 24)], situation: sit(4), lease: lease() },
  { id: "c10", propertyId: "1001", kind: "judgment", expected: "review", why: "Student met een fulltime baan: de woning sluit studenten uit, maar het inkomen is stevig",
    motivation: "Ik studeer deeltijd en werk fulltime, vast contract sinds twee jaar.",
    persons: [emp(6000, 24, { isStudent: true })], situation: sit(1), lease: lease() },
  { id: "c11", propertyId: "1001", kind: "clear", expected: "unsuitable", why: "Woningdelers niet toegestaan",
    persons: [emp(6000, 24)], situation: sit(1, { hasHousemates: true }), lease: lease() },
  { id: "c12", propertyId: "1001", kind: "clear", expected: "unsuitable", why: "Inkomen 4.000 en een garantsteller is bij deze woning niet toegestaan",
    persons: [emp(4000, 24)], situation: sit(1), lease: lease(12, { guarantorAvailable: true }) },
  { id: "c13", propertyId: "1001", kind: "clear", expected: "review", why: "Huurperiode 6 maanden, minimum 12: afwijking om te bespreken",
    persons: [emp(6000, 24)], situation: sit(1), lease: lease(6) },
  { id: "c14", propertyId: "1001", kind: "clear", expected: "unsuitable", why: "Uitkering is bij deze woning geen toegestane inkomensbron",
    persons: [solo("benefits", 6000)], situation: sit(1), lease: lease() },
  { id: "c15", propertyId: "1001", kind: "judgment", expected: "review", why: "Pensioen 6.000: inkomen ruim voldoende, alleen de bronlijst sluit het uit",
    persons: [solo("pension", 6000)], situation: sit(1), lease: lease() },
  { id: "c16", propertyId: "1001", kind: "clear", expected: "review", why: "Alleen de proeftijd is een punt, rest klopt",
    persons: [emp(6000, 24, { inProbation: true })], situation: sit(1), lease: lease() },

  // ---- woning 1002: huur 795, inkomen hoofdaanvrager ≥ 2.385, garantsteller verplicht (review), studenten welkom ----
  { id: "c17", propertyId: "1002", kind: "clear", expected: "suitable", why: "Inkomen 2.500 en garantsteller aanwezig",
    persons: [emp(2500, 12)], situation: sit(1), lease: lease(12, { guarantorAvailable: true }) },
  { id: "c18", propertyId: "1002", kind: "clear", expected: "review", why: "Inkomen ruim genoeg, maar garantsteller ontbreekt: vragen of die er is",
    persons: [emp(2500, 12)], situation: sit(1), lease: lease(12, { guarantorAvailable: false }) },
  { id: "c19", propertyId: "1002", kind: "clear", expected: "review", why: "Student met 1.000 studiefinanciering en garantsteller: gebruikelijk, zelf beoordelen",
    persons: [solo("student_finance", 1000, { isStudent: true })], situation: sit(1), lease: lease(12, { guarantorAvailable: true }) },
  { id: "c20", propertyId: "1002", kind: "clear", expected: "unsuitable", why: "Inkomen 1.500 en geen garantsteller",
    persons: [emp(1500, 12)], situation: sit(1), lease: lease(12, { guarantorAvailable: false }) },
  { id: "c21", propertyId: "1002", kind: "judgment", expected: "review", why: "Formulier zegt geen garantsteller, de toelichting zegt dat ouders garant willen staan",
    needsText: true, motivation: "Mijn ouders willen garant staan, ze hebben dat al toegezegd en kunnen een verklaring sturen.",
    persons: [emp(1500, 12)], situation: sit(1), lease: lease(12, { guarantorAvailable: false }) },
  { id: "c22", propertyId: "1002", kind: "clear", expected: "unsuitable", why: "3 bewoners, maximum 2",
    persons: [emp(3000, 12)], situation: sit(3), lease: lease(12, { guarantorAvailable: true }) },
  { id: "c23", propertyId: "1002", kind: "judgment", expected: "review", why: "Zzp'er met 3.000 en 24 maanden: type staat niet op de lijst maar profiel is prima",
    persons: [solo("self_employed", 3000, { employmentMonths: 24 })], situation: sit(1), lease: lease(12, { guarantorAvailable: true }) },
  { id: "c24", propertyId: "1002", kind: "clear", expected: "suitable", why: "Proeftijd is hier toegestaan",
    persons: [emp(2600, 3, { inProbation: true })], situation: sit(1), lease: lease(12, { guarantorAvailable: true }) },

  // ---- woning 1003: huur 1.450, inkomen hoofdaanvrager ≥ 4.350, ≥ 12 mnd dienst, geen proeftijd, verblijfstitel vereist ----
  { id: "c25", propertyId: "1003", kind: "clear", expected: "suitable", why: "4.500, 36 maanden, geldige verblijfstitel",
    persons: [emp(4500, 36)], situation: sit(1), lease: lease(), residence: { hasValidPermit: true } },
  { id: "c26", propertyId: "1003", kind: "clear", expected: "unsuitable", why: "Geen geldige verblijfstitel",
    persons: [emp(4500, 36)], situation: sit(1), lease: lease(), residence: { hasValidPermit: false } },
  { id: "c27", propertyId: "1003", kind: "clear", expected: "unsuitable", why: "8 maanden dienst, minimum 12 (hard ingesteld)",
    persons: [emp(4500, 8)], situation: sit(1), lease: lease(), residence: { hasValidPermit: true } },
  { id: "c28", propertyId: "1003", kind: "clear", expected: "review", why: "Inkomen 3.500 maar garantsteller toegestaan en aanwezig",
    persons: [emp(3500, 36)], situation: sit(1), lease: lease(12, { guarantorAvailable: true, depositGuaranteeOk: true }), residence: { hasValidPermit: true } },
  { id: "c29", propertyId: "1003", kind: "judgment", expected: "review", why: "€ 50 onder de grens, maar de toelichting kondigt een loonsverhoging aan",
    needsText: true, motivation: "Per 1 november krijg ik loonsverhoging naar 4.600 bruto, de aanpassing staat in mijn contract.",
    persons: [emp(4300, 36)], situation: sit(1), lease: lease(), residence: { hasValidPermit: true } },
  { id: "c30", propertyId: "1003", kind: "clear", expected: "suitable", why: "Pensioen 4.500 is toegestaan en dienstverband speelt dan niet",
    persons: [solo("pension", 4500)], situation: sit(1), lease: lease(), residence: { hasValidPermit: true } },
  { id: "c31", propertyId: "1003", kind: "clear", expected: "unsuitable", why: "Huisdier niet toegestaan",
    persons: [emp(4500, 36)], situation: sit(1, { hasPets: true }), lease: lease(), residence: { hasValidPermit: true } },

  // ---- woning 1004: huur 1.100, gezamenlijk inkomen ≥ 2.750, ruim opgezet (huisdieren, studenten, proeftijd ok) ----
  { id: "c32", propertyId: "1004", kind: "clear", expected: "suitable", why: "3.000 uit overig inkomen, geen bezwaren",
    persons: [solo("other", 3000)], situation: sit(1, { hasPets: true }), lease: lease(12) },
  { id: "c33", propertyId: "1004", kind: "clear", expected: "suitable", why: "Gezin met samen 2.800 en 4 bewoners",
    persons: [emp(1500, 12), { role: "partner", incomeType: "benefits", monthlyIncome: 1300 }], situation: sit(4), lease: lease(12) },
  { id: "c34", propertyId: "1004", kind: "clear", expected: "unsuitable", why: "Inkomen 1.500 en geen garantsteller",
    persons: [solo("benefits", 1500)], situation: sit(2), lease: lease(12, { guarantorAvailable: false }) },
  { id: "c35", propertyId: "1004", kind: "clear", expected: "review", why: "Inkomen 1.500 maar garantsteller beschikbaar",
    persons: [solo("benefits", 1500)], situation: sit(2), lease: lease(12, { guarantorAvailable: true }) },
  { id: "c36", propertyId: "1004", kind: "clear", expected: "unsuitable", why: "7 bewoners, maximum 6",
    persons: [emp(4000, 12)], situation: sit(7), lease: lease(12) },
  { id: "c37", propertyId: "1004", kind: "judgment", expected: "review", why: "€ 10 onder de grens",
    persons: [emp(2740, 12)], situation: sit(1), lease: lease(12) },

  // ---- woning 1005: huur 1.200, inkomen hoofdaanvrager ≥ 3.600, garantsteller compenseert inkomen NIET ----
  { id: "c38", propertyId: "1005", kind: "clear", expected: "unsuitable", why: "3.000, en de verhuurder laat een garantsteller het tekort niet opvangen",
    persons: [emp(3000, 12)], situation: sit(1), lease: lease(12, { guarantorAvailable: true }) },
  { id: "c39", propertyId: "1005", kind: "clear", expected: "suitable", why: "3.600 en proeftijd toegestaan",
    persons: [emp(3600, 1, { inProbation: true })], situation: sit(1), lease: lease(12) },
  { id: "c40", propertyId: "1005", kind: "judgment", expected: "review", why: "Hoofdaanvrager 2.000, maar de toelichting noemt een partner met extra inkomen (beleid telt alleen de hoofdaanvrager)",
    needsText: true, motivation: "Mijn partner verdient 2.500 netto en woont bij mij; samen kunnen we de huur gemakkelijk betalen.",
    persons: [emp(2000, 12)], situation: sit(1), lease: lease(12) },
];
