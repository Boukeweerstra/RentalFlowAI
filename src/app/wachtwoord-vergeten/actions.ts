"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { appBaseUrl } from "@/lib/app-url";
import { ipFromHeaders } from "@/lib/abuse/client-ip";
import { getStore } from "@/lib/abuse/store";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export type ResetRequestState = { error?: string; sent?: boolean };

const RESET_MAX = 5;
const RESET_WINDOW_SECONDS = 15 * 60;

/**
 * Vraagt een herstelmail aan. Het antwoord is altijd hetzelfde, ook bij een onbekend adres,
 * zodat niemand kan nagaan wie er een account heeft.
 */
export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  if (!supabaseConfigured()) return { error: "Dit is nog niet ingesteld. Neem contact op met de beheerder." };

  const ip = ipFromHeaders(await headers());
  const attempts = await getStore().incr(`rl:reset:${ip}`, RESET_WINDOW_SECONDS);
  if (attempts > RESET_MAX) return { error: "Te veel aanvragen. Wacht een kwartier en probeer het opnieuw." };

  const parsed = z.string().trim().email().max(200).safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Vul een geldig e-mailadres in." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appBaseUrl()}/auth/callback?next=/wachtwoord-nieuw`,
  });
  if (error) console.warn("[auth] herstelmail aanvragen mislukt");

  return { sent: true };
}
