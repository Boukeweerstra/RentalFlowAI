import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import ResetRequestForm from "./ResetRequestForm";

export const metadata: Metadata = { title: "Wachtwoord vergeten – RentalFlowAI" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Wachtwoord vergeten"
      intro="Vul uw e-mailadres in. U krijgt een link waarmee u een nieuw wachtwoord kiest."
      footer={<Link href="/login" className="underline">Terug naar inloggen</Link>}
    >
      <ResetRequestForm />
    </AuthShell>
  );
}
