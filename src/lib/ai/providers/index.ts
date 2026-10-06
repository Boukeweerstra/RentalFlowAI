import type { AiProvider } from "../types";
import { createFakeProvider } from "./fake";
import { createOpenAiProvider } from "./openai";

/** Standaardmodel voor OpenAI: klein en goedkoop. Pas aan met AI_MODEL; controleer de actuele modelnaam in het OpenAI-dashboard. */
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

/**
 * Kiest de aanbieder op basis van AI_PROVIDER: "off" (standaard), "openai" of "fake".
 * Zonder sleutel bij "openai" geldt "off": liever geen AI dan een halve configuratie.
 */
export function getProvider(env: NodeJS.ProcessEnv = process.env): AiProvider | null {
  const choice = (env.AI_PROVIDER ?? "off").trim().toLowerCase();
  if (choice === "fake") return createFakeProvider();
  if (choice === "openai") {
    const key = env.OPENAI_API_KEY?.trim();
    if (!key) return null;
    return createOpenAiProvider(key, env.AI_MODEL?.trim() || DEFAULT_OPENAI_MODEL);
  }
  return null;
}

/** Maximaal aantal AI-aanroepen per dag (UTC). Laag als standaard: dit is een kostenplafond, geen prestatiegrens. */
export function dailyLimit(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.AI_DAILY_LIMIT);
  return Number.isInteger(n) && n >= 0 && n <= 10_000 ? n : 20;
}
