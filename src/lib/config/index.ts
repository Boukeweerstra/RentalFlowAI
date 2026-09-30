import { JsonConfigProvider } from "./json-provider";
import type { ConfigProvider } from "./provider";

/** Wissel hier later naar een Google Sheet- of Supabase-provider. */
export const configProvider: ConfigProvider = new JsonConfigProvider();
