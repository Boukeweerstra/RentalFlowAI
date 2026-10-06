import type { Metadata } from "next";
import { redirect } from "next/navigation";
import NewPasswordForm from "./NewPasswordForm";
import { getAuthedUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nieuw wachtwoord – RentalFlowAI" };

export default async function NewPasswordPage() {
  const user = await getAuthedUser();
  if (!user) redirect("/login");
  return (
    <main lang="nl" className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Nieuw wachtwoord kiezen</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-700">Voor {user.email}.</p>
      <NewPasswordForm />
    </main>
  );
}
