/**
 * Simple i18n implementation compatible with react-i18next JSON format
 * No external dependencies, designed for Deno Fresh v2 SSR
 */

// Import translation files
import en from "../locales/en.json" with { type: "json" };
import de from "../locales/de.json" with { type: "json" };

export type Locale = "en" | "de";
export type EnNTranslationKeys = typeof en;
export type DeNTranslationKeys = typeof de;
export type TranslationKeys = EnNTranslationKeys | DeNTranslationKeys;

const translations: Record<Locale, TranslationKeys> = {
  en,
  de,
};

const defaultLocale: Locale = "en";

/**
 * Get nested value from object using dot notation
 * e.g., "home.title" => translations.home.title
 * Returns string, array, or undefined
 */
function getNestedValue(
  obj: Record<string, unknown>,
  path: string,
): string | string[] | undefined {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (
      current && typeof current === "object" && key in current
    ) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  // Return strings and arrays, filter out other types
  if (typeof current === "string") {
    return current;
  } else if (Array.isArray(current)) {
    // Ensure all array elements are strings
    return current.every((item) => typeof item === "string")
      ? (current as string[])
      : undefined;
  }

  return undefined;
}

/**
 * Simple interpolation for variables in translations
 * Supports {{variable}} syntax like i18next
 */
function interpolate(
  text: string,
  variables?: Record<string, string | number>,
): string {
  if (!variables) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
  });
}

/**
 * Detect locale from Accept-Language header
 */
export function detectLocale(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  // Parse Accept-Language header
  // Example: "en-US,en;q=0.9,de;q=0.8"
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [locale, q = "q=1"] = lang.trim().split(";");
      const quality = parseFloat(q.split("=")[1] || "1");
      return { locale: locale.split("-")[0].toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first supported locale
  for (const { locale } of languages) {
    if (locale in translations) {
      return locale as Locale;
    }
  }

  return defaultLocale;
}

/**
 * Main translation class - can be instantiated per request
 */
export class I18n {
  private locale: Locale;
  private fallbackLocale: Locale;

  constructor(locale?: Locale, fallback: Locale = defaultLocale) {
    this.locale = locale || defaultLocale;
    this.fallbackLocale = fallback;
  }

  /**
   * Get current locale
   */
  getLocale(): Locale {
    return this.locale;
  }

  /**
   * Translate a key with optional interpolation variables
   * @param key - Translation key in dot notation (e.g., "home.title")
   * @param variables - Object with variables to interpolate
   * @returns Translated string or array of strings
   */
  t(
    key: string,
    variables?: Record<string, string | number>,
  ): string | string[] {
    // Try current locale
    const translation = getNestedValue(
      translations[this.locale] as unknown as Record<string, unknown>,
      key,
    );

    if (translation) {
      // Handle arrays
      if (Array.isArray(translation)) {
        return variables
          ? translation.map((item) => interpolate(item, variables))
          : translation;
      }
      // Handle strings
      return interpolate(translation, variables);
    }

    // Try fallback locale
    if (this.locale !== this.fallbackLocale) {
      const fallbackTranslation = getNestedValue(
        translations[this.fallbackLocale] as unknown as Record<string, unknown>,
        key,
      );

      if (fallbackTranslation) {
        // Handle arrays
        if (Array.isArray(fallbackTranslation)) {
          return variables
            ? fallbackTranslation.map((item) => interpolate(item, variables))
            : fallbackTranslation;
        }
        // Handle strings
        return interpolate(fallbackTranslation, variables);
      }
    }

    // Return key if no translation found (like i18next)
    return key;
  }

  /**
   * Translate a key and always return a string (for backwards compatibility)
   * If the translation is an array, returns the first element or the key
   * @param key - Translation key in dot notation (e.g., "home.title")
   * @param variables - Object with variables to interpolate
   * @returns Translated string
   */
  tString(key: string, variables?: Record<string, string | number>): string {
    const result = this.t(key, variables);
    if (Array.isArray(result)) {
      return result[0] || key;
    }
    return result;
  }

  /**
   * Check if a translation key exists
   */
  exists(key: string): boolean {
    return getNestedValue(
      translations[this.locale] as unknown as Record<string, unknown>,
      key,
    ) !== undefined;
  }
}

/**
 * Create an i18n instance from a Request object
 * Automatically detects locale from Accept-Language header
 */
export function createI18n(request: Request): I18n {
  const acceptLanguage = request.headers.get("Accept-Language");
  const locale = detectLocale(acceptLanguage);
  return new I18n(locale);
}

/**
 * Get available locales
 */
export function getAvailableLocales(): Locale[] {
  return Object.keys(translations) as Locale[];
}

/**
 * Export default instance for simple usage
 */
export const i18n = new I18n();
