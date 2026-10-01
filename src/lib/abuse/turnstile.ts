import "server-only";

/**
 * Cloudflare Turnstile (botcontrole). Optioneel: alleen actief als `TURNSTILE_SECRET_KEY` is
 * ingesteld. Het formulier toont het vakje alleen als ook `TURNSTILE_SITE_KEY` is ingesteld.
 *
 * Testsleutels van Cloudflare (altijd geslaagd / altijd mislukt) voor lokaal testen:
 *   site key  1x00000000000000000000AA   secret 1x0000000000000000000000000000000AA
 *   site key  2x00000000000000000000AB   secret 2x0000000000000000000000000000000AA
 */
export const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

export type TurnstileResult = "ok" | "failed" | "unavailable";

export async function verifyTurnstile(token: unknown, ip: string): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return "ok"; // niet geconfigureerd = niet vereist
  if (typeof token !== "string" || token.length === 0 || token.length > 4096) return "failed";

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) return "unavailable";
    const data = (await res.json()) as { success?: boolean };
    return data.success ? "ok" : "failed";
  } catch (err) {
    // Fail closed: zonder verificatie laten we het verzoek niet door.
    console.error("[abuse] Turnstile-verificatie niet bereikbaar:", (err as Error).name);
    return "unavailable";
  }
}
