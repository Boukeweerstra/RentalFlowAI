import "server-only";

/**
 * Teller-opslag voor rate limiting, dubbele aanvragen en het dagplafond.
 *
 * - Met `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (of de `KV_REST_API_*`-namen van de
 *   Vercel-integratie) delen alle serverinstanties één teller: dit is de productie-opstelling.
 * - Zonder die variabelen valt de app terug op geheugen van één serverproces. Dat is prima voor
 *   lokaal testen, maar op serverless (Vercel) heeft elke instantie dan een eigen teller en is
 *   het dus géén echte bescherming.
 * - Bij een storing van Upstash valt een verzoek terug op het geheugen (met een logregel), zodat
 *   een storing het formulier niet platlegt.
 */
export interface Store {
  /** Verhoogt de teller met 1 en zet/verlengt de vervaltijd. Geeft de nieuwe waarde terug. */
  incr(key: string, ttlSeconds: number): Promise<number>;
  /** Verlaagt de teller met 1 (om een gereserveerde plek terug te geven). */
  decr(key: string): Promise<void>;
  /** Zet de sleutel alleen als die nog niet bestaat. `true` = gezet, `false` = bestond al. */
  setIfAbsent(key: string, ttlSeconds: number): Promise<boolean>;
  del(key: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Geheugen
// ---------------------------------------------------------------------------

type Entry = { n: number; exp: number };

export class MemoryStore implements Store {
  private m = new Map<string, Entry>();

  private live(key: string): Entry | undefined {
    const e = this.m.get(key);
    if (e && e.exp <= Date.now()) {
      this.m.delete(key);
      return undefined;
    }
    return e;
  }

  private gc() {
    if (this.m.size < 5000) return;
    const now = Date.now();
    for (const [k, e] of this.m) if (e.exp <= now) this.m.delete(k);
  }

  async incr(key: string, ttlSeconds: number) {
    const e = this.live(key) ?? { n: 0, exp: 0 };
    e.n += 1;
    e.exp = Date.now() + ttlSeconds * 1000;
    this.m.set(key, e);
    this.gc();
    return e.n;
  }

  async decr(key: string) {
    const e = this.live(key);
    if (e) e.n = Math.max(0, e.n - 1);
  }

  async setIfAbsent(key: string, ttlSeconds: number) {
    if (this.live(key)) return false;
    this.m.set(key, { n: 1, exp: Date.now() + ttlSeconds * 1000 });
    this.gc();
    return true;
  }

  async del(key: string) {
    this.m.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Upstash Redis (REST, zonder extra pakket)
// ---------------------------------------------------------------------------

type Cmd = (string | number)[];

export class UpstashStore implements Store {
  constructor(
    private url: string,
    private token: string,
  ) {}

  private async pipeline(cmds: Cmd[]): Promise<unknown[]> {
    const res = await fetch(`${this.url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
      body: JSON.stringify(cmds),
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`upstash status ${res.status}`);
    const out = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    const failed = out.find((o) => o.error);
    if (failed) throw new Error("upstash command failed");
    return out.map((o) => o.result);
  }

  async incr(key: string, ttlSeconds: number) {
    const [n] = await this.pipeline([
      ["INCR", key],
      ["EXPIRE", key, ttlSeconds],
    ]);
    return Number(n);
  }

  async decr(key: string) {
    await this.pipeline([["DECR", key]]);
  }

  async setIfAbsent(key: string, ttlSeconds: number) {
    const [r] = await this.pipeline([["SET", key, "1", "NX", "EX", ttlSeconds]]);
    return r === "OK";
  }

  async del(key: string) {
    await this.pipeline([["DEL", key]]);
  }
}

// ---------------------------------------------------------------------------
// Keuze en terugval
// ---------------------------------------------------------------------------

const g = globalThis as unknown as { __rfMemoryStore?: MemoryStore; __rfWarned?: Set<string> };
const memory = (g.__rfMemoryStore ??= new MemoryStore());
const warned = (g.__rfWarned ??= new Set<string>());

function warnOnce(id: string, message: string) {
  if (warned.has(id)) return;
  warned.add(id);
  console.warn(`[abuse] ${message}`);
}

/** Store met automatische terugval op geheugen als Upstash faalt. */
class ResilientStore implements Store {
  constructor(private primary: Store) {}

  private async run<T>(op: (s: Store) => Promise<T>): Promise<T> {
    try {
      return await op(this.primary);
    } catch (err) {
      console.error("[abuse] gedeelde teller niet bereikbaar, val terug op geheugen:", (err as Error).message);
      return op(memory);
    }
  }

  incr(key: string, ttl: number) { return this.run((s) => s.incr(key, ttl)); }
  decr(key: string) { return this.run((s) => s.decr(key)); }
  setIfAbsent(key: string, ttl: number) { return this.run((s) => s.setIfAbsent(key, ttl)); }
  del(key: string) { return this.run((s) => s.del(key)); }
}

export function getStore(): Store {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return new ResilientStore(new UpstashStore(url, token));

  if (process.env.NODE_ENV === "production") {
    warnOnce(
      "no-shared-store",
      "GEEN gedeelde teller ingesteld (UPSTASH_REDIS_REST_URL/TOKEN). Rate limiting, dubbele-aanvraagcontrole en dagplafond gelden per serverinstantie en zijn dus zwak. Stel Upstash in voordat de app openbaar wordt.",
    );
  }
  return memory;
}
