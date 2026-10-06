import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PropertyEditor, { type EditorInitial } from "@/components/dashboard/PropertyEditor";
import { fixtureOrgId, fixtureProperties } from "@/lib/properties/fixtures";
import { criteriaToForm, defaultCriteria } from "@/lib/properties/requirements";

/** Voorbeeld van het eisenscherm met verzonnen gegevens, alleen lokaal. Niets wordt opgeslagen. */
export default async function PropertyPreviewPage({ params }: PageProps<"/dashboard/preview/woningen/[id]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { id } = await params;
  const isNew = id === "nieuw";
  const found = fixtureProperties.find((p) => p.id === id);
  if (!isNew && !found) notFound();

  const initial: EditorInitial = found
    ? {
        id: found.id, organizationId: found.organizationId, propertyId: found.propertyId, address: found.address, rent: String(found.rent),
        availableFrom: found.availableFrom ?? "", active: found.active, form: criteriaToForm(found.criteria, found.documentsLater),
      }
    : { organizationId: fixtureOrgId, propertyId: "", address: "", rent: "", availableFrom: "", active: true, form: criteriaToForm(defaultCriteria()) };

  return (
    <main>
      <DashboardHeader officeNames={["Demo Makelaardij"]} email="demo@example.com" preview current="woningen" />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <p className="mb-2 text-sm"><Link href="/dashboard/preview/woningen" className="underline">Woningen</Link> <span aria-hidden="true">/</span> {isNew ? "Nieuwe woning" : initial.address}</p>
        <h1 className="mb-5 text-2xl font-semibold tracking-tight text-brand-900">{isNew ? "Woning toevoegen" : "Eisen per woning"}</h1>
        <PropertyEditor initial={initial} offices={[{ id: fixtureOrgId, name: "Demo Makelaardij", tenantKey: "demo" }]} canEdit preview basePath="/dashboard/preview" />
      </div>
    </main>
  );
}
