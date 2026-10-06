"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, getAuthedUser } from "@/lib/supabase/server";

export type NewPasswordState = { error?: string };

const schema = z
  .object({
    password: z.string().min(10, "Kies minimaal 10 tekens.").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "De twee wachtwoorden zijn niet gelijk.", path: ["confirm"] });

/** Stelt een nieuw wachtwoord in voor de ingelogde (herstel)sessie. */
export async function setNewPassword(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const user = await getAuthedUser();
  if (!user) redirect("/login");

  const parsed = schema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer het wachtwoord." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.warn("[auth] wachtwoord wijzigen mislukt");
    return { error: "Het wachtwoord kon niet worden gewijzigd. Probeer een ander, sterker wachtwoord." };
  }
  redirect("/dashboard");
}
