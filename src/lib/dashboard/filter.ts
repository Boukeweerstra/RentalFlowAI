import type { DashApplication, Handling } from "./types";

export type SortKey = "newest" | "oldest" | "income_desc" | "income_asc";
export type StatusFilter = "all" | "open" | Handling;

export const SORT_LABEL: Record<SortKey, string> = {
  newest: "Nieuwste eerst",
  oldest: "Oudste eerst",
  income_desc: "Hoogste inkomen eerst",
  income_asc: "Laagste inkomen eerst",
};

/** Per groep tonen we eerst dit aantal; "Toon meer" laadt de rest. */
export const PAGE_SIZE = 25;

/** Hoofdletter- en accentongevoelig, en cijfers-van-telefoon vergelijkbaar ("06 12 34" vindt "0612 34"). */
const norm = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const digits = (s: string): string => s.replace(/\D/g, "");

export function matchesQuery(a: DashApplication, query: string): boolean {
  const q = norm(query.trim());
  if (!q) return true;
  const haystack = norm(`${a.name} ${a.email} ${a.propertyAddress}`);
  if (haystack.includes(q)) return true;
  const qDigits = digits(q);
  return qDigits.length >= 3 && digits(a.phone).includes(qDigits);
}

export function matchesStatus(a: DashApplication, status: StatusFilter): boolean {
  if (status === "all") return true;
  if (status === "open") return a.handling === "nieuw" || a.handling === "benaderd" || a.handling === "bezichtiging_gepland";
  return a.handling === status;
}

export function sortApplications(list: DashApplication[], key: SortKey): DashApplication[] {
  const copy = [...list];
  const byDate = (x: DashApplication, y: DashApplication) => Date.parse(y.createdAt) - Date.parse(x.createdAt);
  switch (key) {
    case "oldest":
      return copy.sort((x, y) => -byDate(x, y));
    case "income_desc":
      return copy.sort((x, y) => y.totalIncome - x.totalIncome || byDate(x, y));
    case "income_asc":
      return copy.sort((x, y) => x.totalIncome - y.totalIncome || byDate(x, y));
    default:
      return copy.sort(byDate);
  }
}
