import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pagina niet gevonden – RentalFlowAI" };

export default function NotFound() {
  return (
    <main lang="nl" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Deze pagina bestaat niet</h1>
      <p className="mt-2 text-zinc-700">
        De link klopt niet of de pagina is verplaatst. Controleer het adres of ga terug naar het begin.
      </p>
      <p className="mt-6">
        <Link href="/login" className="inline-flex min-h-11 items-center rounded-md bg-brand-800 px-4 py-3 font-medium text-white hover:bg-brand-700">
          Naar inloggen
        </Link>
      </p>
    </main>
  );
}
