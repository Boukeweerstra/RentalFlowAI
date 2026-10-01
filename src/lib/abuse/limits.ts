import "server-only";

/**
 * Instelbare limieten tegen misbruik. Alle waarden zijn te overschrijven met een
 * omgevingsvariabele; zonder variabele gelden de standaardwaarden hieronder.
 *
 * Let op: elke aanvraag kost ±3-5 Make-operaties (webhook + Sheet + 1-2 mails). Het gratis
 * plan heeft 1.000 operaties per maand, dus het dagplafond beschermt je quota.
 */
const num = (name: string, fallback: number): number => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

export const limits = {
  /** Max. aanvragen per IP in het venster. */
  ipMax: num("RL_IP_MAX", 5),
  ipWindowSeconds: num("RL_IP_WINDOW_SECONDS", 10 * 60),
  /** Max. aanvragen per e-mailadres per uur (over alle woningen). */
  emailMax: num("RL_EMAIL_MAX", 3),
  emailWindowSeconds: num("RL_EMAIL_WINDOW_SECONDS", 60 * 60),
  /** Dezelfde persoon + dezelfde woning: zo lang geblokkeerd na een geslaagde aanvraag. */
  duplicateWindowSeconds: num("DUPLICATE_WINDOW_SECONDS", 24 * 60 * 60),
  /** Totaal aantal aanvragen per dag voor de hele app (beschermt de Make-quota). */
  dailyCap: num("MAX_APPLICATIONS_PER_DAY", 30),
  /** Formulier sneller dan dit ingevuld = bot. */
  formMinSeconds: num("FORM_MIN_SECONDS", 8),
  /** Een formuliertoken is zo lang geldig. */
  formMaxSeconds: num("FORM_MAX_SECONDS", 2 * 60 * 60),
  /** Maximale grootte van de request body in bytes. */
  maxBodyBytes: num("MAX_BODY_BYTES", 20_000),
} as const;
