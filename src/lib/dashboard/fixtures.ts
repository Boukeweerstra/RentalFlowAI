import type { DashApplication, DashEvent } from "./types";

/** Verzonnen gegevens voor de voorbeeldpagina (alleen lokaal). Geen echte personen. */
const base = {
  organizationId: "00000000-0000-4000-8000-000000000001",
  rent: 1850,
  hasPets: false,
  hasHousemates: false,
  note: "",
  contactedAt: null,
} as const;

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const fixtureApplications: DashApplication[] = [
  {
    ...base, id: "11111111-1111-4111-8111-111111111111", propertyId: "1001", propertyAddress: "Keizersgracht 100, Amsterdam",
    name: "Anna de Vries", email: "anna@example.com", phone: "06 1234 5678", applicants: 2, occupants: 2,
    totalIncome: 6100, incomeRequired: 5550, precheckStatus: "suitable", precheckReasons: [], group: "suitable",
    handling: "nieuw", createdAt: ago(12), startDate: "2026-12-01", leaseMonths: 12,
    motivation: "Wij zoeken een rustige woning. We werken allebei fulltime en hebben geen huisdieren.",
    guarantorAvailable: null, primaryIncomeType: "employment",
  },
  {
    ...base, id: "22222222-2222-4222-8222-222222222222", propertyId: "1004", propertyAddress: "Dorpsstraat 40, Zwolle", rent: 1100,
    name: "Mark Jansen", email: "mark@example.com", phone: "06 8765 4321", applicants: 1, occupants: 3,
    totalIncome: 3900, incomeRequired: 2750, precheckStatus: "suitable", precheckReasons: [], group: "suitable",
    handling: "benaderd", contactedAt: ago(40), note: "Teruggebeld, wil donderdag kijken.", createdAt: ago(95),
    startDate: "2027-01-15", leaseMonths: 24, motivation: null, hasPets: true, guarantorAvailable: true,
    primaryIncomeType: "self_employed",
  },
  {
    ...base, id: "33333333-3333-4333-8333-333333333333", propertyId: "1002", propertyAddress: "Universiteitsweg 12, Utrecht", rent: 795,
    name: "Sanne Bakker", email: "sanne@example.com", phone: "06 5555 1212", applicants: 1, occupants: 1,
    totalIncome: 1050, incomeRequired: 2385, precheckStatus: "review", precheckReasons: ["guarantor_required", "income_too_low"],
    group: "review", handling: "nieuw", createdAt: ago(190), startDate: "2026-11-01", leaseMonths: 6,
    motivation: "Mijn ouders willen garant staan.", guarantorAvailable: true, primaryIncomeType: "student_finance",
  },
  {
    ...base, id: "44444444-4444-4444-8444-444444444444", propertyId: "1001", propertyAddress: "Keizersgracht 100, Amsterdam",
    name: "Tom Visser", email: "tom@example.com", phone: "06 4444 3333", applicants: 2, occupants: 2,
    totalIncome: 6400, incomeRequired: 5550, precheckStatus: "review", precheckReasons: ["probation_not_allowed", "employment_too_short"],
    group: "review", handling: "nieuw", createdAt: ago(60 * 26), startDate: "2026-12-01", leaseMonths: 12,
    motivation: null, guarantorAvailable: null, primaryIncomeType: "employment",
  },
  {
    ...base, id: "55555555-5555-4555-8555-555555555555", propertyId: "1001", propertyAddress: "Keizersgracht 100, Amsterdam",
    name: "Lars Smit", email: "lars@example.com", phone: "06 2222 9999", applicants: 1, occupants: 1,
    totalIncome: 2000, incomeRequired: 5550, precheckStatus: "unsuitable", precheckReasons: ["income_too_low", "pets_not_allowed"],
    group: "unsuitable", handling: "nieuw", createdAt: ago(60 * 27), startDate: "2026-12-01", leaseMonths: 12,
    motivation: null, hasPets: true, guarantorAvailable: null, primaryIncomeType: "employment",
  },
];

export const fixtureEvents: Record<string, DashEvent[]> = {
  "22222222-2222-4222-8222-222222222222": [
    { id: 3, action: "note_changed", fromValue: null, toValue: null, createdAt: ago(38), byMe: true, bySystem: false },
    { id: 2, action: "contacted", fromValue: null, toValue: "ja", createdAt: ago(40), byMe: true, bySystem: false },
    { id: 1, action: "created", fromValue: null, toValue: "suitable", createdAt: ago(95), byMe: false, bySystem: true },
  ],
};
