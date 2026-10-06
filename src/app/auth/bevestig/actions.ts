"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

const tokenHash = z.string().regex(/^[A-Za-z0-9_-]{10,300}$/);

/**
 * Wisselt de eenmalige code uit de herstelmail in. Dit gebeurt pas na een klik op "Doorgaan" (POST), en niet al bij het openen
 * van de link: mailprogramma's en virusscanners openen links automatisch en zouden anders de code verbruiken.
 */
export async function confirmRecovery(formData: FormData): Promise<void> {
  const parsed = tokenHash.safeParse(formData.get("token_hash"));
  if (!supabaseConfigured() || !parsed.success) redirect("/login?fout=link");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: parsed.data });
  if (error) {
    console.warn("[auth] herstelcode ongeldig of verlopen");
    redirect("/login?fout=link");
  }
  redirect("/wachtwoord-nieuw");
}
