import dotenv from "dotenv";
import { locales, Locale, LocaleKey } from "./locales";

dotenv.config();

const defaultLocale = "en";
const currentLocale = process.env.LOCALE || process.env.LANG?.split("_")[0] || defaultLocale;

// Get the locale object, fallback to English if not found
const locale: Locale = locales[currentLocale] || locales[defaultLocale];

console.log(`Using locale: ${currentLocale}`);

// Translation function
export function t(key: LocaleKey): string {
  return locale[key] || locales[defaultLocale][key] || key;
}

// Export the current locale name
export const localeName = currentLocale;

// Export all translations for the current locale
export { locale };
