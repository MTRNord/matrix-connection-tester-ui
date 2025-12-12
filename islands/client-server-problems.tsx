import { useEffect, useMemo } from "preact/hooks";
import { ErrorWithSolution } from "../components/ErrorWithSolution.tsx";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  clientServerErrors,
  clientServerHasErrors,
  clientServerLoading,
  fetchClientServerInfo,
} from "../lib/client-server-state.ts";

interface ClientServerProblemsProps {
  serverName: string;
  locale: Locale;
  baseUrl?: string;
}

export default function ClientServerProblems(
  { serverName, locale, baseUrl }: ClientServerProblemsProps,
) {
  const i18n = useMemo(() => new I18n(locale), [locale]);

  useEffect(() => {
    fetchClientServerInfo(serverName);
  }, [serverName]);

  // Show problems section when error exists
  useEffect(() => {
    if (!clientServerLoading.value && clientServerHasErrors.value) {
      const problemsSection = document.getElementById("problems-section");
      if (problemsSection) {
        problemsSection.style.display = "block";
      }
    }
  }, [clientServerLoading.value, clientServerHasErrors.value]);

  if (clientServerLoading.value) {
    return null;
  }

  // If no errors, don't render anything
  if (!clientServerHasErrors.value) {
    return null;
  }

  const errors = clientServerErrors.value;

  return (
    <div>
      <h3 class="govuk-heading-m">
        {i18n.t("results.client_server_problems_title")}
      </h3>
      <p class="govuk-body">
        {i18n.t("results.client_server_problems_description")}
      </p>

      {errors.clientWellKnown && (
        <>
          <h4 class="govuk-heading-s">
            {i18n.t("results.client_well_known_endpoint")}
          </h4>
          <ErrorWithSolution
            error={errors.clientWellKnown}
            context="client-server"
            i18n={i18n}
            baseUrl={baseUrl}
          />
        </>
      )}

      {errors.versions && (
        <>
          <h4 class="govuk-heading-s">
            {i18n.t("results.client_versions_endpoint")}
          </h4>
          <ErrorWithSolution
            error={errors.versions}
            context="client-server"
            i18n={i18n}
            baseUrl={baseUrl}
          />
        </>
      )}
    </div>
  );
}
