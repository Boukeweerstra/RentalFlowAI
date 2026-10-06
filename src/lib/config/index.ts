import { DbBackedConfigProvider } from "./db-provider";
import { JsonConfigProvider } from "./json-provider";
import type { ConfigProvider } from "./provider";

/** Tenants uit bestanden; woningen eerst uit de database (scherm "Woningen"), daarna uit de bestanden. */
export const configProvider: ConfigProvider = new DbBackedConfigProvider(new JsonConfigProvider());
