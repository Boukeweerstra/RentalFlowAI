import "server-only";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { limits } from "./limits";

/**
 * Ondertekend formuliertoken: de server zet bij het tonen van het formulier een tijdstip vast,
 * ondertekend met een geheim. Bij het versturen controleren we de handtekening en hoe lang het
 * invullen duurde. Een bot die het formulier in een fractie van een seconde "invult" wordt zo
 * geweigerd, en een client kan de tijd niet vervalsen omdat het token ondertekend is.
 *
 * Het geheim is `FORM_TOKEN_SECRET`, of anders afgeleid van `MAKE_WEBHOOK_SECRET` (zodat er geen
 * extra variabele nodig is). Zonder beide (alleen lokaal) gebruiken we een vaste ontwikkelsleutel.
 */
function key(): Buffer {
  const secret =
    process.env.FORM_TOKEN_SECRET || process.env.MAKE_WEBHOOK_SECRET || "dev-only-insecure-secret";
  return createHash("sha256").update(`rentalflowai-form-token:${secret}`).digest();
}

const sign = (issuedAt: number, tenantId: string, propertyId: string) =>
  createHmac("sha256", key())
    .update(`${issuedAt}|${tenantId}|${propertyId}`)
    .digest("base64url");

export function createFormToken(tenantId: string, propertyId: string, now = Date.now()): string {
  return `${now}.${sign(now, tenantId, propertyId)}`;
}

export type FormTokenResult = "ok" | "invalid" | "too_fast" | "expired";

export function verifyFormToken(
  token: unknown,
  tenantId: string,
  propertyId: string,
  now = Date.now(),
): FormTokenResult {
  if (typeof token !== "string") return "invalid";
  const [issued, mac] = token.split(".");
  const issuedAt = Number(issued);
  if (!Number.isInteger(issuedAt) || !mac) return "invalid";

  const expected = Buffer.from(sign(issuedAt, tenantId, propertyId));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "invalid";

  const ageSeconds = (now - issuedAt) / 1000;
  if (ageSeconds < limits.formMinSeconds) return "too_fast";
  if (ageSeconds > limits.formMaxSeconds) return "expired";
  return "ok";
}

/** Sleutel voor het hashen van e-mailadressen in tellers (we bewaren geen adressen in Redis). */
export function hashForCounter(value: string): string {
  return createHmac("sha256", key()).update(value.toLowerCase().trim()).digest("hex").slice(0, 32);
}
