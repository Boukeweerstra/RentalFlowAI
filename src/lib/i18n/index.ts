import type { Lang } from "@/lib/schema";
import { en } from "./en";
import { nl, type Dict } from "./nl";

const dictionaries: Record<Lang, Dict> = { nl, en };

export const getDict = (lang: Lang): Dict => dictionaries[lang];

/** Taal uit ?lang= (nl|en) of, bij "auto"/onbekend, uit Accept-Language. */
export function resolveLang(param: string | undefined, acceptLanguage: string | null): Lang {
  if (param === "nl" || param === "en") return param;
  return acceptLanguage?.toLowerCase().startsWith("nl") ? "nl" : "en";
}

export type { Dict };
