import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PropertyList, { type PropertyListItem } from "@/components/dashboard/PropertyList";
import { PROPERTY_SELECT, rowToProperty, type PropertyRow } from "@/lib/properties/types";
import { createClient, getAuthedUser } from "@/lib/supabase/server";

type Office = { name: string; tenant_key: string };
type Membership = { organization_id: string; role: string; organizations: Office | Office[] | null };
const office = (m: Membership): Office | null => (Array.isArray(m.organizations) ? m.organizations[0] : m.organizations) ?? null;

export default async function PropertiesPage() {
  const user = await getAuthedUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [members, props, apps] = await Promise.all([
    supabase.from("members").select("organization_id, role, organizations(name, tenant_key)"),
    supabase.from("properties").select(PROPERTY_SELECT).order("address"),
    supabase.from("applications").select("organization_id, property_id").limit(5000),
  ]);
  const memberships = (members.data ?? []) as unknown as Membership[];
  const offices = new Map(memberships.map((m) => [m.organization_id, office(m)]));
  const counts = new Map<string, number>();
  for (const a of apps.data ?? []) {
    const key = `${a.organization_id}|${a.property_id}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const items: PropertyListItem[] = ((props.data ?? []) as unknown as PropertyRow[]).map((r) => {
    const dto = rowToProperty(r);
    const o = offices.get(dto.organizationId);
    return { ...dto, officeName: o?.name, tenantKey: o?.tenant_key, applicationCount: counts.get(`${dto.organizationId}|${dto.propertyId}`) ?? 0 };
  });
  const canCreate = memberships.some((m) => m.role === "owner");
  const failed = Boolean(props.error || members.error);
  if (failed) console.error("[woningen] laden mislukt:", props.error?.code ?? members.error?.code);

  return (
    <main>
      <DashboardHeader officeNames={[...offices.values()].map((o) => o?.name ?? "").filter(Boolean)} email={user.email} current="woningen" />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Woningen en eisen</h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-700">
              Per woning legt u vast welke eisen gelden en wat er gebeurt als iemand er niet aan voldoet. Het formulier voor woningzoekers volgt deze eisen.
            </p>
          </div>
          {canCreate && (
            <Link href="/dashboard/woningen/nieuw" className="inline-flex min-h-11 items-center rounded-md bg-brand-800 px-5 font-medium text-white hover:bg-brand-700">
              Woning toevoegen
            </Link>
          )}
        </div>
        {failed ? (
          <p role="alert" className="rounded-md bg-red-50 p-4 text-red-800">De woningen konden niet worden geladen. Ververs de pagina of probeer het later opnieuw.</p>
        ) : (
          <PropertyList items={items} basePath="/dashboard" canCreate={canCreate} showOffice={offices.size > 1} />
        )}
      </div>
    </main>
  );
}
