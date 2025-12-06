import { useEffect, useMemo } from "preact/hooks";
import { ErrorWithSolution } from "../components/ErrorWithSolution.tsx";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  fetchSupportInfo,
  supportError,
  supportLoading,
} from "../lib/support-state.ts";

interface SupportProblemsProps {
  serverName: string;
  locale: Locale;
  baseUrl?: string;
}

export default function SupportProblems(
  { serverName, locale, baseUrl }: SupportProblemsProps,
) {
  const i18n = useMemo(() => new I18n(locale), [locale]);

  useEffect(() => {
    fetchSupportInfo(serverName);
  }, [serverName]);

  // Show problems section when error exists
  useEffect(() => {
    if (!supportLoading.value && supportError.value) {
      const problemsSection = document.getElementById("problems-section");
      if (problemsSection) {
        problemsSection.style.display = "block";
      }
    }
  }, [supportLoading.value, supportError.value]);

  if (supportLoading.value) {
    return null;
  }

  // If no error, don't render anything
  if (!supportError.value) {
    return null;
  }

  return (
    <div>
      <h3 class="govuk-heading-m">
        {i18n.t("results.support_problems_title")}
      </h3>
      <p class="govuk-body">
        {i18n.t("results.support_problems_description")}
      </p>

      <ErrorWithSolution
        error={supportError.value}
        context="support"
        i18n={i18n}
        baseUrl={baseUrl}
      />
    </div>
  );
}
