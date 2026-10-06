import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import { supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inloggen – RentalFlowAI" };

export default function LoginPage() {
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
      <LoginForm />
    </main>
  );
}
