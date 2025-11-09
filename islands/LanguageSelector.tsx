import type { Locale } from "../lib/i18n.ts";

interface LanguageSelectorProps {
  currentLocale: Locale;
  availableLocales: Locale[];
  translations: Record<Locale, string>;
  label: string;
  changeButtonText: string;
}

export default function LanguageSelector(
  { currentLocale, availableLocales, translations, label, changeButtonText }:
    LanguageSelectorProps,
) {
  // Get current query parameters to preserve them
  const searchParams = typeof globalThis.location !== "undefined"
    ? new URLSearchParams(globalThis.location.search)
    : new URLSearchParams();

  // Remove lang parameter as it will be set by the select
  searchParams.delete("lang");

  const otherParams = Array.from(searchParams.entries());

  return (
    <form method="get" class="language-selector-form">
      <label class="govuk-visually-hidden" for="language">
        {label}
      </label>
      {/* Preserve existing query parameters */}
      {otherParams.map(([key, value]) => (
        <input type="hidden" name={key} value={value} />
      ))}
      <select
        class="govuk-select language-selector"
        id="language"
        name="lang"
      >
        {availableLocales.map((lang) => (
          <option key={lang} value={lang} selected={lang === currentLocale}>
            {translations[lang]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        class="govuk-button govuk-button--secondary language-selector-button"
        data-module="govuk-button"
      >
        {changeButtonText}
      </button>
    </form>
  );
}
