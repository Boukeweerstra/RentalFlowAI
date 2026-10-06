import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import NewPasswordForm from "./NewPasswordForm";
import { getAuthedUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nieuw wachtwoord – RentalFlowAI" };

export default async function NewPasswordPage() {
  const user = await getAuthedUser();
  if (!user) redirect("/login");
  return (
    <AuthShell title="Nieuw wachtwoord kiezen" intro={`Voor ${user.email}.`}>
      <NewPasswordForm />
    </AuthShell>
  );
}
