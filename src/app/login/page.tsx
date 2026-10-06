import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";
import { supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inloggen – RentalFlowAI" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ fout?: string }> }) {
  const { fout } = await searchParams;
  return (
    <main lang="nl" className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Inloggen</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-700">
        Aanvragen voor makelaars. Dit gedeelte is alleen toegankelijk met een account.
      </p>
      {!supabaseConfigured() && (
        <p role="alert" className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-950">
          Inloggen is nog niet ingesteld op deze omgeving.
        </p>
      )}
      {fout === "link" && (
        <p role="alert" className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-950">
          Deze link is verlopen of al gebruikt. Vraag via &lsquo;Wachtwoord vergeten&rsquo; een nieuwe aan.
        </p>
      )}
      <LoginForm />
      <p className="mt-6 text-sm">
        <Link href="/wachtwoord-vergeten" className="underline">Wachtwoord vergeten?</Link>
      </p>
    </main>
  );
}
