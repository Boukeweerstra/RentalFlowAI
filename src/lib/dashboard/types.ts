import type { PrecheckReason } from "@/lib/schema";

export type Group = "suitable" | "review" | "unsuitable";
export type Handling = "nieuw" | "benaderd" | "bezichtiging_gepland" | "afgerond";

export const GROUPS: Group[] = ["suitable", "review", "unsuitable"];
export const HANDLINGS: Handling[] = ["nieuw", "benaderd", "bezichtiging_gepland", "afgerond"];

export const GROUP_META: Record<Group, { title: string; subtitle: string }> = {
  suitable: { title: "Suitable", subtitle: "geschikt voor bezichtiging" },
  review: { title: "Review", subtitle: "zelf beoordelen" },
  unsuitable: { title: "Unsuitable", subtitle: "volgens de regels niet passend" },
};

export const HANDLING_LABEL: Record<Handling, string> = {
  nieuw: "Nieuw",
  benaderd: "Benaderd",
  bezichtiging_gepland: "Bezichtiging gepland",
  afgerond: "Afgerond",
};

/** Een aanvraag zoals het dashboard die toont. */
export type DashApplication = {
  id: string;
  organizationId: string;
  propertyId: string;
  propertyAddress: string;
  rent: number;
  name: string;
  email: string;
  phone: string;
  applicants: number;
  occupants: number;
  totalIncome: number;
  incomeRequired: number | null;
  precheckStatus: Group;
  precheckReasons: PrecheckReason[];
  group: Group;
  handling: Handling;
  contactedAt: string | null;
  note: string;
  createdAt: string;
  /** Uit de volledige aanvraag (payload). */
  startDate: string | null;
  leaseMonths: number | null;
  motivation: string | null;
  hasPets: boolean | null;
  hasHousemates: boolean | null;
  guarantorAvailable: boolean | null;
  primaryIncomeType: string | null;
};

export type DashEvent = {
  id: number;
  action: "created" | "group_changed" | "handling_status_changed" | "note_changed" | "contacted";
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  byMe: boolean;
  bySystem: boolean;
};

/** Rij uit `public.applications`. Het deel van de payload komt als losse stukken of als geheel (realtime). */
export type ApplicationRow = {
  id: string;
  organization_id: string;
  property_id: string;
  property_address: string;
  rent: number | string;
  name: string;
  email: string;
  phone: string;
  applicants: number;
  occupants: number;
  total_income: number | string;
  income_required: number | string | null;
  precheck_status: Group;
  precheck_reasons: string[] | null;
  group_current: Group;
  handling_status: Handling;
  contacted_at: string | null;
  note: string | null;
  created_at: string;
  payload?: PayloadLike | null;
  lease?: PayloadLike["lease"] | null;
  situation?: PayloadLike["situation"] | null;
  persons?: PayloadLike["persons"] | null;
  motivation?: string | null;
};

type PayloadLike = {
  lease?: { desiredStartDate?: string; desiredLeaseMonths?: number; guarantorAvailable?: boolean } | null;
  situation?: { hasPets?: boolean; hasHousemates?: boolean } | null;
  persons?: Array<{ incomeType?: string }> | null;
  motivation?: string | null;
};

/** Kolommen die het dashboard ophaalt; losse stukken van de payload in plaats van het geheel. */
export const APPLICATION_SELECT =
  "id, organization_id, property_id, property_address, rent, name, email, phone, applicants, occupants, " +
  "total_income, income_required, precheck_status, precheck_reasons, group_current, handling_status, " +
  "contacted_at, note, created_at, lease:payload->lease, situation:payload->situation, " +
  "persons:payload->persons, motivation:payload->>motivation";

const num = (v: number | string | null | undefined): number => (v == null ? 0 : Number(v));

export function rowToDash(row: ApplicationRow): DashApplication {
  const p = row.payload ?? {};
  const lease = row.lease ?? p.lease ?? null;
  const situation = row.situation ?? p.situation ?? null;
  const persons = row.persons ?? p.persons ?? null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyId: row.property_id,
    propertyAddress: row.property_address,
    rent: num(row.rent),
    name: row.name,
    email: row.email,
    phone: row.phone,
    applicants: row.applicants,
    occupants: row.occupants,
    totalIncome: num(row.total_income),
    incomeRequired: row.income_required == null ? null : Number(row.income_required),
    precheckStatus: row.precheck_status,
    precheckReasons: (row.precheck_reasons ?? []) as PrecheckReason[],
    group: row.group_current,
    handling: row.handling_status,
    contactedAt: row.contacted_at,
    note: row.note ?? "",
    createdAt: row.created_at,
    startDate: lease?.desiredStartDate ?? null,
    leaseMonths: lease?.desiredLeaseMonths ?? null,
    motivation: (row.motivation ?? p.motivation ?? null) || null,
    hasPets: situation?.hasPets ?? null,
    hasHousemates: situation?.hasHousemates ?? null,
    guarantorAvailable: lease?.guarantorAvailable ?? null,
    primaryIncomeType: persons?.[0]?.incomeType ?? null,
  };
}
