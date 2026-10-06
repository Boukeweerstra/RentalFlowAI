import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PropertyEditor, { type EditorInitial } from "@/components/dashboard/PropertyEditor";
import { criteriaToForm, defaultCriteria } from "@/lib/properties/requirements";
import { PROPERTY_SELECT, rowToProperty, type PropertyRow } from "@/lib/properties/types";
import { createClient, getAuthedUser } from "@/lib/supabase/server";

type Office = { name: string; tenant_key: string };
type Membership = { organization_id: string; role: string; organizations: Office | Office[] | null };
const office = (m: Membership): Office | null => (Array.isArray(m.organizations) ? m.organizations[0] : m.organizations) ?? null;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PropertyPage({ params }: PageProps<"/dashboard/woningen/[id]">) {
  const user = await getAuthedUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const isNew = id === "nieuw";
  if (!isNew && !UUID.test(id)) notFound();

  const supabase = await createClient();
  const [members, row] = await Promise.all([
    supabase.from("members").select("organization_id, role, organizations(name, tenant_key)"),
    isNew ? Promise.resolve(null) : supabase.from("properties").select(PROPERTY_SELECT).eq("id", id).maybeSingle(),
  ]);
  const memberships = (members.data ?? []) as unknown as Membership[];
  const offices = memberships.map((m) => ({ id: m.organization_id, name: office(m)?.name ?? "Kantoor", tenantKey: office(m)?.tenant_key ?? "", role: m.role }));

  let initial: EditorInitial;
  let applicationCount = 0;
  if (isNew) {
    const owned = offices.filter((o) => o.role === "owner");
    if (owned.length === 0) notFound();
    initial = {
      organizationId: owned[0].id, propertyId: "", address: "", rent: "", availableFrom: "", active: true,
      form: criteriaToForm(defaultCriteria()),
    };
  } else {
    if (!row || row.error || !row.data) notFound();
    const dto = rowToProperty(row.data as unknown as PropertyRow);
    initial = {
      id: dto.id, organizationId: dto.organizationId, propertyId: dto.propertyId, address: dto.address, rent: String(dto.rent),
      availableFrom: dto.availableFrom ?? "", active: dto.active, form: criteriaToForm(dto.criteria, dto.documentsLater),
    };
    const { count } = await supabase.from("applications").select("id", { count: "exact", head: true })
      .eq("organization_id", dto.organizationId).eq("property_id", dto.propertyId);
    applicationCount = count ?? 0;
  }
  const canEdit = offices.some((o) => o.id === initial.organizationId && o.role === "owner");

  return (
    <main>
      <DashboardHeader officeNames={offices.map((o) => o.name)} email={user.email} current="woningen" />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <p className="mb-2 text-sm"><Link href="/dashboard/woningen" className="underline">Woningen</Link> <span aria-hidden="true">/</span> {isNew ? "Nieuwe woning" : initial.address}</p>
        <h1 className="mb-5 text-2xl font-semibold tracking-tight text-brand-900">{isNew ? "Woning toevoegen" : "Eisen per woning"}</h1>
        <PropertyEditor initial={initial} offices={offices} canEdit={canEdit} basePath="/dashboard" applicationCount={applicationCount} />
      </div>
    </main>
  );
}
