import type { Locale } from "@/i18n/config";

import de from "./messages/de.json";
import en from "./messages/en.json";
import es from "./messages/es.json";

const dictionaries = {
  de,
  en,
  es,
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export async function getDictionary(locale: Locale | string): Promise<Dictionary> {
  return dictionaries[(locale as Locale) ?? "es"] ?? dictionaries.es;
}
