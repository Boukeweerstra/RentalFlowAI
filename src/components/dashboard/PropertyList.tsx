import Link from "next/link";
import { requirementItems } from "@/lib/requirement-items";
import type { PropertyDto } from "@/lib/properties/types";

export type PropertyListItem = PropertyDto & { officeName?: string; tenantKey?: string; applicationCount: number };

const euro = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

/** Overzicht van de woningen van het kantoor, met de belangrijkste eisen in gewone taal. */
export default function PropertyList({
  items, basePath, canCreate, showOffice,
}: { items: PropertyListItem[]; basePath: string; canCreate: boolean; showOffice: boolean }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center">
        <h2 className="text-lg font-semibold text-zinc-900">Nog geen woningen</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-700">
          Voeg een woning toe met haar eisen. Daarna zet u één regel code op de woningpagina van uw site en komt de Aanvraag-knop erbij.
        </p>
        {canCreate && (
          <Link href={`${basePath}/woningen/nieuw`} className="mt-4 inline-flex min-h-11 items-center rounded-md bg-brand-800 px-5 font-medium text-white hover:bg-brand-700">
            Eerste woning toevoegen
          </Link>
        )}
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((p) => {
        const reqs = requirementItems({ criteria: p.criteria, rent: p.rent }, "nl");
        return (
          <li key={p.id} className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-sm ${p.active ? "" : "opacity-80"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-zinc-900">
                  <Link href={`${basePath}/woningen/${p.id}`} className="hover:underline">{p.address}</Link>
                </h2>
                <p className="text-sm text-zinc-700">
                  Woning-id <code>{p.propertyId}</code> · {euro(p.rent)} per maand
                  {showOffice && p.officeName ? ` · ${p.officeName}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`rounded-full px-2.5 py-0.5 font-medium ${p.active ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-800"}`}>
                  {p.active ? "Actief" : "Niet actief"}
                </span>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-medium text-brand-800">
                  {p.applicationCount} {p.applicationCount === 1 ? "aanvraag" : "aanvragen"}
                </span>
              </div>
            </div>
            {reqs.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-800">
                {reqs.slice(0, 5).map((r) => (<li key={r} className="rounded-md bg-slate-100 px-2 py-1">{r}</li>))}
                {reqs.length > 5 && <li className="px-1 py-1 text-zinc-600">en {reqs.length - 5} andere</li>}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`${basePath}/woningen/${p.id}`} className="inline-flex min-h-11 items-center rounded-md border border-zinc-500 px-4 text-sm font-medium hover:bg-zinc-50">
                Eisen bekijken of wijzigen
              </Link>
              {p.active && p.tenantKey && (
                <a href={`/embed/aanvraag/${p.tenantKey}/${p.propertyId}?lang=nl`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-md px-3 text-sm underline">
                  Open het formulier
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
