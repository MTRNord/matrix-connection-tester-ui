import { useEffect, useMemo } from "preact/hooks";
import { ErrorWithSolution } from "../components/ErrorWithSolution.tsx";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  clientServerState,
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
  const state = clientServerState.value;

  useEffect(() => {
    fetchClientServerInfo(serverName);
  }, [serverName]);

  const { errors, loading } = state;

  if (loading) {
    return null;
  }

  // If no errors, don't render anything
  if (!errors.clientWellKnown && !errors.versions) {
    return null;
  }

  return (
    <div>
      <h3 class="govuk-heading-m">
        {i18n.t("results.client_server_problems_title")}
      </h3>
      <p class="govuk-body">
        {i18n.t("results.client_server_problems_description")}
      </p>

      {errors.clientWellKnown && (
        <ErrorWithSolution
          error={errors.clientWellKnown}
          context="client-server"
          i18n={i18n}
          baseUrl={baseUrl}
        />
      )}

      {errors.versions && (
        <ErrorWithSolution
          error={errors.versions}
          context="client-server"
          i18n={i18n}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
}
