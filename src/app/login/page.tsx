import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "./LoginForm";
import { safeNext } from "@/lib/safe-next";
import { supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inloggen – RentalFlowAI" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ fout?: string; next?: string }> }) {
  const { fout, next } = await searchParams;
  return (
    <AuthShell
      title="Inloggen"
      intro="Voor medewerkers van een verhuurkantoor. Hier ziet u de aanvragen voor uw woningen."
      footer={<Link href="/wachtwoord-vergeten" className="underline">Wachtwoord vergeten?</Link>}
    >
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
      <LoginForm next={safeNext(next)} />
    </AuthShell>
  );
}
