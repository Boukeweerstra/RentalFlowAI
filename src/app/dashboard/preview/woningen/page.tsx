import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PropertyList from "@/components/dashboard/PropertyList";
import { fixtureProperties } from "@/lib/properties/fixtures";

/** Voorbeeld van het scherm Woningen met verzonnen gegevens, alleen lokaal. */
export default function PropertiesPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const counts = [2, 1, 0, 1, 0];
  const items = fixtureProperties.map((p, i) => ({ ...p, officeName: "Demo Makelaardij", tenantKey: "demo", applicationCount: counts[i] ?? 0 }));
  return (
    <main>
      <DashboardHeader officeNames={["Demo Makelaardij"]} email="demo@example.com" preview current="woningen" />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Woningen en eisen</h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-700">
              Per woning legt u vast welke eisen gelden en wat er gebeurt als iemand er niet aan voldoet. Het formulier voor woningzoekers volgt deze eisen.
            </p>
          </div>
          <Link href="/dashboard/preview/woningen/nieuw" className="inline-flex min-h-11 items-center rounded-md bg-brand-800 px-5 font-medium text-white hover:bg-brand-700">
            Woning toevoegen
          </Link>
        </div>
        <PropertyList items={items} basePath="/dashboard/preview" canCreate showOffice={false} />
      </div>
    </main>
  );
}
