import Link from "next/link";
import Logo from "@/components/brand/Logo";

const LINKS = [
  { href: "#hoe", label: "Hoe het werkt" },
  { href: "#groepen", label: "De drie groepen" },
  { href: "#ai", label: "AI" },
  { href: "#privacy", label: "Privacy" },
  { href: "#vragen", label: "Vragen" },
];

/** Kop van de uitlegpagina: logo, snelle links naar de onderdelen, en knoppen naar de demo en het inloggen. */
export default function SiteHeader({ showPreviewLink = false }: { showPreviewLink?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-brand-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="RentalFlowAI, naar het begin" className="text-brand-900">
          <Logo />
        </Link>
        <nav aria-label="Onderdelen van deze pagina" className="hidden items-center gap-6 whitespace-nowrap text-sm font-medium text-zinc-700 xl:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-brand-700">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {showPreviewLink && (
            <Link href="/dashboard/preview"
              className="hidden min-h-11 items-center whitespace-nowrap rounded-md px-3 text-sm font-medium text-brand-700 hover:bg-brand-50 md:inline-flex">
              Voorbeeld-dashboard
            </Link>
          )}
          <Link href="/demo-host.html"
            className="inline-flex min-h-11 items-center whitespace-nowrap rounded-md bg-brand-800 px-4 text-sm font-medium text-white hover:bg-brand-700">
            Bekijk de demo
          </Link>
          <Link href="/login"
            className="hidden min-h-11 items-center whitespace-nowrap rounded-md border border-brand-200 px-4 text-sm font-medium text-brand-800 hover:bg-brand-50 sm:inline-flex">
            Inloggen
          </Link>
        </div>
      </div>
    </header>
  );
}
