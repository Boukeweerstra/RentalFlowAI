import { NextResponse } from "next/server";
import { clientIp } from "@/lib/abuse/client-ip";
import { hashForCounter, verifyFormToken } from "@/lib/abuse/form-token";
import { limits } from "@/lib/abuse/limits";
import { countLinks, isDisposableEmail, looksLikeRealName } from "@/lib/abuse/spam";
import { getStore } from "@/lib/abuse/store";
import { verifyTurnstile } from "@/lib/abuse/turnstile";
import { configProvider } from "@/lib/config";
import { deliverToMake } from "@/lib/make-client";
import { buildMakePayload } from "@/lib/make-payload";
import { validateApplication } from "@/lib/validate-application";

/**
 * POST /api/aanvraag: ontvangt een aanvraag en stuurt die naar Make.com.
 *
 * Lagen tegen misbruik, in volgorde (goedkoop en zonder opslag eerst):
 *  1. maximale grootte  2. same-origin  3. honeypot  4. rate limit per IP
 *  5. ondertekend formuliertoken met minimale invultijd  6. Turnstile (indien ingesteld)
 *  7. validatie tegen de woningconfig  8. spam-/wegwerp-e-mailcontrole
 *  9. rate limit per e-mailadres  10. dubbele aanvraag (zelfde persoon + woning)
 *  11. dagplafond voor de hele app (beschermt de Make-quota)
 * Plekken die in 10 en 11 gereserveerd zijn, worden teruggegeven als de aflevering mislukt.
 */
const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });

const blocked = (reason: string) => console.warn(`[abuse] geblokkeerd: ${reason}`);

export async function POST(request: Request) {
  // 1. Grootte
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > limits.maxBodyBytes) return json({ error: "too_large" }, 413);

  // 2. Alleen same-origin (het formulier draait in onze eigen iframe).
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: "forbidden" }, 403);
  }

  const text = await request.text();
  if (text.length > limits.maxBodyBytes) return json({ error: "too_large" }, 413);

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const ids = raw as {
    tenantId?: unknown;
    propertyId?: unknown;
    hints?: { rent?: unknown; address?: unknown };
    website?: unknown;
    formToken?: unknown;
    turnstileToken?: unknown;
  };
  if (typeof ids?.tenantId !== "string" || typeof ids?.propertyId !== "string") {
    return json({ error: "invalid_input" }, 400);
  }

  // 3. Honeypot: bots krijgen een nep-succes en er wordt niets verstuurd of geteld.
  if (typeof ids.website === "string" && ids.website.length > 0) {
    blocked("honeypot");
    return json({ ok: true });
  }

  const ip = clientIp(request);
  const store = getStore();

  // 4. Rate limit per IP
  const ipCount = await store.incr(`rl:ip:${ip}`, limits.ipWindowSeconds);
  if (ipCount > limits.ipMax) {
    blocked("rate limit ip");
    return json({ error: "rate_limited" }, 429, {
      "retry-after": String(limits.ipWindowSeconds),
    });
  }

  // 5. Formuliertoken (ondertekend) en minimale invultijd
  const tokenResult = verifyFormToken(ids.formToken, ids.tenantId, ids.propertyId);
  if (tokenResult !== "ok") {
    blocked(`formuliertoken ${tokenResult}`);
    const error = { invalid: "session_invalid", too_fast: "too_fast", expired: "session_expired" }[
      tokenResult
    ];
    return json({ error }, 400);
  }

  // 6. Turnstile (alleen als TURNSTILE_SECRET_KEY is ingesteld)
  const captcha = await verifyTurnstile(ids.turnstileToken, ip);
  if (captcha !== "ok") {
    blocked(`turnstile ${captcha}`);
    return captcha === "failed"
      ? json({ error: "captcha_failed" }, 400)
      : json({ error: "captcha_unavailable" }, 503);
  }

  // 7. Woning en validatie
  const rent = typeof ids.hints?.rent === "number" ? ids.hints.rent : undefined;
  const address =
    typeof ids.hints?.address === "string" ? ids.hints.address.slice(0, 200) : undefined;
  const config = await configProvider.getProperty(ids.tenantId, ids.propertyId, {
    rent: rent && rent > 0 && rent <= 100_000 ? rent : undefined,
    address,
  });
  if (!config) return json({ error: "property_not_found" }, 404);

  const result = validateApplication(raw, config);
  if (!result.ok) return json({ errors: result.errors }, 400);
  const application = result.application;

  // 8. Spam en wegwerp-e-mail
  const spamErrors: Record<string, string> = {};
  if (isDisposableEmail(application.applicant.email)) {
    spamErrors["applicant.email"] = "email_not_allowed";
  }
  if (!looksLikeRealName(application.applicant.name)) {
    spamErrors["applicant.name"] = "invalid_name";
  }
  if (application.motivation && countLinks(application.motivation) > 1) {
    spamErrors["motivation"] = "links_not_allowed";
  }
  if (Object.keys(spamErrors).length > 0) {
    blocked(`spamkenmerken (${Object.values(spamErrors).join(",")})`);
    return json({ errors: spamErrors }, 400);
  }

  const tenant = await configProvider.getTenant(config.tenantId);
  if (!tenant) return json({ error: "property_not_found" }, 404);

  // 9. Rate limit per e-mailadres (gehasht: er staan geen adressen in de teller)
  const emailKey = hashForCounter(application.applicant.email);
  const emailCount = await store.incr(`rl:email:${emailKey}`, limits.emailWindowSeconds);
  if (emailCount > limits.emailMax) {
    blocked("rate limit e-mail");
    return json({ error: "rate_limited" }, 429, {
      "retry-after": String(limits.emailWindowSeconds),
    });
  }

  // 10. Dubbele aanvraag: dezelfde persoon voor dezelfde woning
  const dupKey = `dup:${hashForCounter(`${application.applicant.email}|${config.tenantId}|${config.propertyId}`)}`;
  const isNew = await store.setIfAbsent(dupKey, limits.duplicateWindowSeconds);
  if (!isNew) {
    blocked("dubbele aanvraag");
    return json({ error: "duplicate" }, 409);
  }

  // 11. Dagplafond (beschermt de Make-quota)
  const capKey = `cap:${new Date().toISOString().slice(0, 10)}`;
  const capCount = await store.incr(capKey, 26 * 60 * 60);
  const release = async () => {
    // Plekken teruggeven zodat een mislukte aflevering de gebruiker niet blokkeert.
    await Promise.allSettled([store.del(dupKey), store.decr(capKey)]);
  };
  if (capCount > limits.dailyCap) {
    blocked("dagplafond bereikt");
    await release();
    return json({ error: "busy" }, 503, { "retry-after": "3600" });
  }

  const delivery = await deliverToMake(buildMakePayload(application, config, tenant));
  if (!delivery.ok) {
    await release();
    return json(
      { error: delivery.reason },
      delivery.reason === "not_configured" ? 500 : 502,
    );
  }
  return json({ ok: true, id: application.id, mode: delivery.mode });
}
