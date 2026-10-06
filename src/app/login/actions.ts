"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { ipFromHeaders } from "@/lib/abuse/client-ip";
import { getStore } from "@/lib/abuse/store";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export type LoginState = { error?: string };

const credentials = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

// Extra rem op raden: max. 10 pogingen per 10 minuten per IP (Supabase heeft daarnaast eigen limieten).
const LOGIN_MAX = 10;
const LOGIN_WINDOW_SECONDS = 10 * 60;

/** Meldt in, of geeft een algemene foutmelding. Geen onderscheid tussen "onbekend adres" en "fout wachtwoord". */
export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!supabaseConfigured()) {
    return { error: "Inloggen is nog niet ingesteld. Neem contact op met de beheerder." };
  }

  const ip = ipFromHeaders(await headers());
  const attempts = await getStore().incr(`rl:login:${ip}`, LOGIN_WINDOW_SECONDS);
  if (attempts > LOGIN_MAX) {
    return { error: "Te veel pogingen. Wacht een paar minuten en probeer het opnieuw." };
  }

  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Vul een geldig e-mailadres en wachtwoord in." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    console.warn("[auth] inloggen mislukt");
    return { error: "Het e-mailadres of wachtwoord klopt niet." };
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  if (supabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
