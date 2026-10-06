import type { Metadata } from "next";
import Link from "next/link";
import ResetRequestForm from "./ResetRequestForm";

export const metadata: Metadata = { title: "Wachtwoord vergeten – RentalFlowAI" };

export default function ForgotPasswordPage() {
  return (
    <main lang="nl" className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Wachtwoord vergeten</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-700">
        Vul je e-mailadres in. Je krijgt een link waarmee je een nieuw wachtwoord kiest.
      </p>
      <ResetRequestForm />
      <p className="mt-6 text-sm">
        <Link href="/login" className="underline">Terug naar inloggen</Link>
      </p>
    </main>
  );
}
