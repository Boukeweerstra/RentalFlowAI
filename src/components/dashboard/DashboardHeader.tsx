import { signOut } from "@/app/login/actions";

/** Kop van het dashboard: titel, kantoor, wie is ingelogd en uitloggen. */
export default function DashboardHeader({
  officeNames,
  email,
  preview = false,
}: {
  officeNames: string[];
  email: string;
  preview?: boolean;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aanvragen</h1>
        <p className="text-sm text-zinc-700">{officeNames.join(", ") || "Geen kantoor gekoppeld"}</p>
      </div>
      <div className="flex items-center gap-3 text-sm text-zinc-700">
        <span className="truncate">{email}</span>
        {preview ? (
          <span className="rounded bg-amber-100 px-2 py-1 font-medium text-amber-950">Voorbeeld, verzonnen gegevens</span>
        ) : (
          <form action={signOut}>
            <button type="submit"
              className="min-h-11 rounded-md border border-zinc-500 px-3 font-medium text-zinc-900 hover:bg-zinc-50">
              Uitloggen
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
