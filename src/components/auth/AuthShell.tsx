import Link from "next/link";
import Logo from "@/components/brand/Logo";

/** Gedeeld kader voor inloggen, wachtwoord vergeten en nieuw wachtwoord: merk, kaart en een terugkoppeling naar de uitleg. */
export default function AuthShell({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main lang="nl" className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-10">
      <Link href="/" aria-label="RentalFlowAI, naar de uitlegpagina" className="mb-6 text-brand-900"><Logo className="text-xl" /></Link>
      <div className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">{title}</h1>
        {intro && <p className="mt-1 mb-5 text-sm text-zinc-700">{intro}</p>}
        {!intro && <div className="mb-5" />}
        {children}
      </div>
      {footer && <div className="mt-5 text-sm text-zinc-700">{footer}</div>}
    </main>
  );
}
