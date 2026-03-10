export const locales = ["es", "en", "de"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export function isSupportedLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
