import { useEffect, useMemo } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  clearPkceSession,
  exchangeCode,
  fetchOidcConfig,
  getPkceSession,
  storeTokens,
} from "../lib/auth.ts";

interface OAuthCallbackProps {
  apiUrl: string;
  clientId: string;
  locale: Locale;
}

export default function OAuthCallback(
  { apiUrl, clientId, locale }: OAuthCallbackProps,
) {
  const i18n = useMemo(() => new I18n(locale), [locale]);
  const error = useSignal<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (params.get("error")) {
      error.value = i18n.tString("auth.oauth2_error_description");
      return;
    }

    if (!code || !state) {
      error.value = i18n.tString("auth.oauth2_error_description");
      return;
    }

    const session = getPkceSession();
    if (!session || session.state !== state) {
      error.value = i18n.tString("auth.oauth2_state_error");
      return;
    }

    const redirectUri = `${globalThis.location.origin}/oauth2/callback`;

    fetchOidcConfig(apiUrl)
      .then((oidc) =>
        exchangeCode(oidc.tokenEndpoint, {
          code,
          codeVerifier: session.verifier,
          clientId,
          redirectUri,
        })
      )
      .then((tokens) => {
        storeTokens(tokens);
        clearPkceSession();
        globalThis.location.href = "/alerts";
      })
      .catch((err) => {
        console.error("OAuth2 code exchange failed:", err);
        clearPkceSession();
        error.value = i18n.tString("auth.oauth2_error_description");
      });
  }, []);

  if (error.value) {
    return (
      <div>
        <div
          class="govuk-notification-banner govuk-notification-banner--error"
          role="alert"
          aria-labelledby="callback-error-title"
          data-module="govuk-notification-banner"
        >
          <div class="govuk-notification-banner__header">
            <h2
              class="govuk-notification-banner__title"
              id="callback-error-title"
            >
              {i18n.tString("auth.oauth2_error_title")}
            </h2>
          </div>
          <div class="govuk-notification-banner__content">
            <p class="govuk-notification-banner__heading">{error.value}</p>
          </div>
        </div>
        <a
          class="govuk-button"
          data-module="govuk-button"
          href="/alerts"
        >
          {i18n.tString("auth.oauth2_retry")}
        </a>
      </div>
    );
  }

  return (
    <p class="govuk-body" aria-live="polite">
      {i18n.tString("auth.redirecting")}
    </p>
  );
}
