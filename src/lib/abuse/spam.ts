import "server-only";

/** Bekende wegwerp-e-maildomeinen. Een bewuste, korte lijst; uitbreiden kan door regels toe te voegen. */
const DISPOSABLE_DOMAINS = [
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamail.biz",
  "guerrillamail.de", "guerrillamailblock.com", "sharklasers.com", "grr.la", "pokemail.net", "spam4.me",
  "10minutemail.com", "10minutemail.net", "20minutemail.com", "tempmail.com", "temp-mail.org",
  "temp-mail.io", "tempmailo.com", "tempail.com", "tmpmail.org", "tmpmail.net", "yopmail.com",
  "yopmail.net", "yopmail.fr", "trashmail.com", "trashmail.net", "throwawaymail.com", "getnada.com",
  "nada.email", "maildrop.cc", "dispostable.com", "fakeinbox.com", "mintemail.com", "mohmal.com",
  "emailondeck.com", "mail.tm", "mailnesia.com", "mytemp.email", "burnermail.io", "discard.email",
  "spambox.us", "trbvm.com", "inboxkitten.com", "moakt.com", "throwam.com", "harakirimail.com",
];

export function emailDomain(email: string): string {
  return email.split("@").pop()?.toLowerCase().trim() ?? "";
}

export function isDisposableEmail(email: string): boolean {
  const domain = emailDomain(email);
  return DISPOSABLE_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

const URL_RE = /(https?:\/\/|www\.)/gi;

export const countLinks = (text: string): number => (text.match(URL_RE) ?? []).length;

/** Een naam bevat letters en geen links of e-mailtekens. */
export function looksLikeRealName(name: string): boolean {
  return /\p{L}/u.test(name) && countLinks(name) === 0 && !name.includes("@");
}
