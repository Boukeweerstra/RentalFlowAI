import Link from "next/link";
import { signOut } from "@/app/login/actions";
import Logo from "@/components/brand/Logo";

/** Bovenbalk van het dashboard: merk, navigatie, kantoor, wie is ingelogd en uitloggen. */
export default function DashboardHeader({
  officeNames,
  email,
  preview = false,
  current = "aanvragen",
}: {
  officeNames: string[];
  email: string;
  preview?: boolean;
  current?: "aanvragen" | "woningen";
}) {
  const base = preview ? "/dashboard/preview" : "/dashboard";
  const link = (key: "aanvragen" | "woningen", href: string, label: string) => (
    <Link href={href} aria-current={current === key ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium ${current === key ? "bg-brand-700 text-white" : "text-brand-100 hover:bg-brand-800"}`}>
      {label}
    </Link>
  );
  return (
    <header className="bg-brand-900 text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" aria-label="RentalFlowAI, naar de uitlegpagina"><Logo light className="text-white" /></Link>
          <span aria-hidden="true" className="hidden h-6 w-px bg-brand-700 sm:block" />
          <p className="hidden min-w-0 truncate text-sm text-brand-100 md:block">
            <span className="sr-only">Kantoor: </span>{officeNames.join(", ") || "Geen kantoor gekoppeld"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden truncate text-brand-100 lg:inline">{email}</span>
          {preview ? (
            <span className="rounded bg-amber-200 px-2 py-1 font-medium text-amber-950">Voorbeeld, verzonnen gegevens</span>
          ) : (
            <form action={signOut}>
              <button type="submit"
                className="min-h-11 rounded-md border border-brand-600 px-3 font-medium text-white hover:bg-brand-800">
                Uitloggen
              </button>
            </form>
          )}
        </div>
      </div>
      <nav aria-label="Hoofdmenu" className="mx-auto flex max-w-5xl gap-1 px-4 pb-2 sm:px-6">
        {link("aanvragen", base, "Aanvragen")}
        {link("woningen", `${base}/woningen`, "Woningen")}
      </nav>
    </header>
  );
}
