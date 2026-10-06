import "server-only";
import { getStore } from "@/lib/abuse/store";
import { dailyLimit } from "./providers";

/** Telt één AI-aanroep mee op het dagplafond (UTC-dag). false = plafond bereikt, dan geen aanroep. */
export async function claimAiBudget(): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const used = await getStore().incr(`ai:day:${day}`, 2 * 24 * 3600);
  return used <= dailyLimit();
}
