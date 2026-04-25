import { useEffect, useMemo, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  buildAuthorizeUrl,
  clearTokens,
  fetchOidcConfig,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  getAccessToken,
  getRefreshToken,
  isAuthenticated,
  isTokenExpiringSoon,
  refreshAccessToken,
  revokeToken,
  storePkceSession,
  storeTokens,
} from "../lib/auth.ts";

interface AlertDto {
  id: number;
  server_name: string;
  verified: boolean;
  created_at: string;
  last_check_at?: string | null;
  is_currently_failing: boolean;
  notify_emails: string[];
}

type AppState =
  | { type: "loading" }
  | { type: "unauthenticated" }
  | { type: "redirecting" }
  | { type: "authenticated"; alerts: AlertDto[] }
  | { type: "error"; message: string };

interface AlertsAppProps {
  apiUrl: string;
  clientId: string;
  locale: Locale;
}

export default function AlertsApp(
  { apiUrl, clientId, locale }: AlertsAppProps,
) {
  const i18n = useMemo(() => new I18n(locale), [locale]);
  const state = useSignal<AppState>({ type: "loading" });
  const addServerName = useSignal("");
  const addError = useSignal<string | null>(null);
  const addSuccess = useSignal<string | null>(null);
  const isAdding = useSignal(false);
  const deletingAlert = useSignal<AlertDto | null>(null);
  const isDeleting = useSignal(false);
  const deleteError = useSignal<string | null>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);

  // Per-alert notification email management state
  const userEmails = useSignal<string[]>([]);
  const managingAlertId = useSignal<number | null>(null);
  const notifyEmailError = useSignal<string | null>(null);

  async function redirectToLogin() {
    state.value = { type: "redirecting" };
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const oauthState = generateState();
    storePkceSession(oauthState, verifier);

    const oidc = await fetchOidcConfig(apiUrl);
    const redirectUri = `${globalThis.location.origin}/oauth2/callback`;
    const url = buildAuthorizeUrl(
      oidc.authorizationEndpoint,
      clientId,
      redirectUri,
      oauthState,
      challenge,
    );
    globalThis.location.href = url;
  }

  async function fetchAlerts(token: string): Promise<AlertDto[]> {
    const response = await fetch(`${apiUrl}/api/v2/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      clearTokens();
      await redirectToLogin();
      return [];
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch alerts: ${response.status}`);
    }
    const data = await response.json();
    return data.alerts ?? [];
  }

  async function fetchUserEmails(token: string): Promise<string[]> {
    try {
      const res = await fetch(`${apiUrl}/oauth2/account/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const me = await res.json();
      const emails: string[] = [];
      if (me.email_verified && me.email) emails.push(me.email);
      for (const e of me.additional_emails ?? []) {
        if (e.verified && e.email) emails.push(e.email);
      }
      return emails;
    } catch {
      return [];
    }
  }

  useEffect(() => {
    (async () => {
      try {
        if (isTokenExpiringSoon() && getRefreshToken()) {
          const oidc = await fetchOidcConfig(apiUrl);
          const tokens = await refreshAccessToken(oidc.tokenEndpoint, {
            refreshToken: getRefreshToken()!,
            clientId,
          });
          storeTokens(tokens);
        }

        if (!isAuthenticated()) {
          state.value = { type: "unauthenticated" };
          return;
        }

        const token = getAccessToken()!;
        const [alerts, emails] = await Promise.all([
          fetchAlerts(token),
          fetchUserEmails(token),
        ]);
        userEmails.value = emails;
        state.value = { type: "authenticated", alerts };
      } catch (err) {
        console.error("AlertsApp init error:", err);
        state.value = {
          type: "error",
          message: String(err instanceof Error ? err.message : err),
        };
      }
    })();
  }, []);

  async function handleAddAlert(e: Event) {
    e.preventDefault();
    const serverName = addServerName.value.trim();
    if (!serverName) return;

    isAdding.value = true;
    addError.value = null;
    addSuccess.value = null;

    try {
      const token = getAccessToken()!;
      const response = await fetch(`${apiUrl}/api/v2/alerts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ server_name: serverName }),
      });

      if (response.status === 401) {
        clearTokens();
        await redirectToLogin();
        return;
      }

      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        if (data.error === "alert_exists") {
          addError.value = i18n.tString("auth.add_alert_exists");
        } else {
          addError.value = i18n.tString("auth.add_alert_failed");
        }
        return;
      }

      if (!response.ok) {
        addError.value = i18n.tString("auth.add_alert_failed");
        return;
      }

      addSuccess.value = i18n.tString("auth.add_alert_success");
      addServerName.value = "";

      const alerts = await fetchAlerts(token);
      state.value = { type: "authenticated", alerts };
    } catch {
      addError.value = i18n.tString("auth.add_alert_failed");
    } finally {
      isAdding.value = false;
    }
  }

  function openDeleteDialog(alert: AlertDto) {
    deletingAlert.value = alert;
    deleteError.value = null;
    confirmDialogRef.current?.showModal();
  }

  function closeDeleteDialog() {
    confirmDialogRef.current?.close();
    deletingAlert.value = null;
    deleteError.value = null;
  }

  async function handleDelete() {
    const alert = deletingAlert.value;
    if (!alert) return;

    isDeleting.value = true;
    deleteError.value = null;

    try {
      const token = getAccessToken()!;
      const response = await fetch(`${apiUrl}/api/v2/alerts/${alert.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        clearTokens();
        closeDeleteDialog();
        await redirectToLogin();
        return;
      }

      if (!response.ok && response.status !== 204) {
        deleteError.value = i18n.tString("auth.delete_failed");
        return;
      }

      closeDeleteDialog();

      if (state.value.type === "authenticated") {
        state.value = {
          type: "authenticated",
          alerts: state.value.alerts.filter((a) => a.id !== alert.id),
        };
      }
    } catch {
      deleteError.value = i18n.tString("auth.delete_failed");
    } finally {
      isDeleting.value = false;
    }
  }

  async function updateNotifyEmails(alertId: number, emails: string[]) {
    notifyEmailError.value = null;
    const token = getAccessToken()!;
    const response = await fetch(
      `${apiUrl}/api/v2/alerts/${alertId}/notify-emails`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails }),
      },
    );
    if (!response.ok) {
      notifyEmailError.value = i18n.tString("auth.notify_emails_update_failed");
      return;
    }
    const updated: AlertDto = await response.json();
    if (state.value.type === "authenticated") {
      state.value = {
        type: "authenticated",
        alerts: state.value.alerts.map((a) => a.id === alertId ? updated : a),
      };
    }
  }

  async function handleSignOut() {
    const token = getAccessToken();
    if (token) {
      try {
        const oidc = await fetchOidcConfig(apiUrl);
        await revokeToken(oidc.revocationEndpoint, token, clientId);
      } catch {
        // Best-effort
      }
    }
    clearTokens();
    globalThis.location.href = "/";
  }

  const handleConfirmBackdropClick = (e: MouseEvent) => {
    if (!isDeleting.value && e.target === confirmDialogRef.current) {
      closeDeleteDialog();
    }
  };

  if (state.value.type === "loading" || state.value.type === "redirecting") {
    return (
      <p class="govuk-body" aria-live="polite">
        {i18n.tString(
          state.value.type === "redirecting"
            ? "auth.redirecting"
            : "auth.loading_alerts",
        )}
      </p>
    );
  }

  if (state.value.type === "unauthenticated") {
    return (
      <>
        <p class="govuk-body">{i18n.tString("auth.sign_in_description")}</p>
        <button
          type="button"
          class="govuk-button"
          data-module="govuk-button"
          onClick={redirectToLogin}
        >
          {i18n.tString("auth.sign_in_button")}
        </button>
      </>
    );
  }

  if (state.value.type === "error") {
    return (
      <div
        class="govuk-notification-banner govuk-notification-banner--error"
        role="alert"
        aria-labelledby="alerts-error-title"
        data-module="govuk-notification-banner"
      >
        <div class="govuk-notification-banner__header">
          <h2
            class="govuk-notification-banner__title"
            id="alerts-error-title"
          >
            {i18n.tString("common.error")}
          </h2>
        </div>
        <div class="govuk-notification-banner__content">
          <p class="govuk-notification-banner__heading">
            {state.value.message}
          </p>
        </div>
      </div>
    );
  }

  if (state.value.type !== "authenticated") return null;

  const { alerts } = state.value;
  const hasPendingAlerts = alerts.some((a) => !a.verified);

  return (
    <>
      {hasPendingAlerts && (
        <div
          class="govuk-notification-banner"
          role="region"
          aria-labelledby="migration-notice-title"
          data-module="govuk-notification-banner"
        >
          <div class="govuk-notification-banner__header">
            <h2
              class="govuk-notification-banner__title"
              id="migration-notice-title"
            >
              {i18n.tString("common.note")}
            </h2>
          </div>
          <div class="govuk-notification-banner__content">
            <p class="govuk-body">{i18n.tString("auth.migration_notice")}</p>
          </div>
        </div>
      )}

      {/* Add alert form */}
      <h2 class="govuk-heading-m">{i18n.tString("auth.add_alert_title")}</h2>
      <p class="govuk-body">{i18n.tString("auth.add_alert_description")}</p>

      {addError.value && (
        <div
          class="govuk-notification-banner govuk-notification-banner--error"
          role="alert"
          aria-labelledby="add-error-title"
          data-module="govuk-notification-banner"
        >
          <div class="govuk-notification-banner__header">
            <h2
              class="govuk-notification-banner__title"
              id="add-error-title"
            >
              {i18n.tString("common.error")}
            </h2>
          </div>
          <div class="govuk-notification-banner__content">
            <p class="govuk-notification-banner__heading">{addError.value}</p>
          </div>
        </div>
      )}

      {addSuccess.value && (
        <div
          class="govuk-notification-banner govuk-notification-banner--success"
          role="alert"
          aria-labelledby="add-success-title"
          data-module="govuk-notification-banner"
        >
          <div class="govuk-notification-banner__header">
            <h2
              class="govuk-notification-banner__title"
              id="add-success-title"
            >
              {i18n.tString("common.success")}
            </h2>
          </div>
          <div class="govuk-notification-banner__content">
            <p class="govuk-notification-banner__heading">
              {addSuccess.value}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleAddAlert}>
        <div class="govuk-form-group">
          <label class="govuk-label" for="add-server-name">
            {i18n.tString("auth.add_alert_server_label")}
          </label>
          <div id="add-server-name-hint" class="govuk-hint">
            {i18n.tString("auth.add_alert_server_hint")}
          </div>
          <input
            class="govuk-input govuk-input--width-20"
            id="add-server-name"
            name="serverName"
            type="text"
            required
            aria-describedby="add-server-name-hint"
            pattern="^(?:\[([0-9A-Fa-f:.]{2,45})]|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([0-9A-Za-z.-]{1,255}))(?::(\d{1,5}))?$"
            value={addServerName.value}
            onInput={(e) =>
              addServerName.value = (e.target as HTMLInputElement).value}
            disabled={isAdding.value}
          />
        </div>
        <button
          type="submit"
          class="govuk-button"
          data-module="govuk-button"
          disabled={isAdding.value}
        >
          {i18n.tString("auth.add_alert_button")}
        </button>
      </form>

      {/* Alerts list */}
      <h2 class="govuk-heading-m">{i18n.tString("auth.your_alerts")}</h2>

      {notifyEmailError.value && (
        <p class="govuk-error-message" role="alert">
          {notifyEmailError.value}
        </p>
      )}

      {alerts.length === 0
        ? (
          <div class="govuk-inset-text">
            {i18n.tString("auth.no_alerts")}
          </div>
        )
        : (
          <div class="table-wrapper">
            <div class="table-scroll">
              <table class="govuk-table">
                <thead class="govuk-table__head">
                  <tr class="govuk-table__row">
                    <th scope="col" class="govuk-table__header">
                      {i18n.tString("auth.server_name")}
                    </th>
                    <th scope="col" class="govuk-table__header">
                      {i18n.tString("auth.status")}
                    </th>
                    <th scope="col" class="govuk-table__header">
                      {i18n.tString("auth.notify_emails_column")}
                    </th>
                    <th scope="col" class="govuk-table__header">
                      {i18n.tString("auth.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody class="govuk-table__body">
                  {alerts.map((alert) => {
                    const isManaging = managingAlertId.value === alert.id;
                    // Emails the user can still add (not already in the list)
                    const addableEmails = userEmails.value.filter(
                      (e) => !alert.notify_emails.includes(e),
                    );

                    return (
                      <tr class="govuk-table__row" key={alert.id}>
                        <td class="govuk-table__cell">
                          <code>{alert.server_name}</code>
                          {alert.is_currently_failing && (
                            <strong
                              class="govuk-tag govuk-tag--red"
                              style="margin-left: 0.5rem"
                            >
                              {i18n.tString("auth.currently_failing")}
                            </strong>
                          )}
                        </td>
                        <td class="govuk-table__cell">
                          {alert.verified
                            ? (
                              <strong class="govuk-tag govuk-tag--green">
                                {i18n.tString("auth.verified")}
                              </strong>
                            )
                            : (
                              <strong class="govuk-tag govuk-tag--yellow">
                                {i18n.tString("auth.unverified")}
                              </strong>
                            )}
                        </td>
                        <td class="govuk-table__cell">
                          <div style="display:flex; flex-direction:column; gap:4px">
                            {/* Notification email chips — always populated (fallback to alert.email on backend) */}
                            <ul
                              style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:4px"
                              aria-label="Notification emails"
                            >
                              {alert.notify_emails.map((email) => (
                                <li
                                  key={email}
                                  style="display:flex; align-items:center; gap:0.25rem"
                                >
                                  <code style="font-size:0.875rem">{email}</code>
                                  {isManaging && (
                                    <button
                                      type="button"
                                      class="notify-link-btn notify-link-btn--danger"
                                      onClick={() =>
                                        updateNotifyEmails(
                                          alert.id,
                                          alert.notify_emails.filter((e) =>
                                            e !== email
                                          ),
                                        )}
                                    >
                                      {i18n.tString("auth.notify_emails_remove")}
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>

                            {/* Add email row (only when managing) */}
                            {isManaging && addableEmails.length > 0 && (
                              <div style="display:flex; align-items:center; gap:0.5rem">
                                <select
                                  id={`add-email-${alert.id}`}
                                  class="govuk-select"
                                  style="width:auto; margin:0"
                                >
                                  {addableEmails.map((e) => (
                                    <option key={e} value={e}>{e}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  class="govuk-button govuk-button--secondary"
                                  style="margin:0; padding:4px 8px; font-size:0.875rem; min-height:unset"
                                  onClick={() => {
                                    const sel = document.getElementById(
                                      `add-email-${alert.id}`,
                                    ) as HTMLSelectElement | null;
                                    if (sel?.value) {
                                      updateNotifyEmails(alert.id, [
                                        ...alert.notify_emails,
                                        sel.value,
                                      ]);
                                    }
                                  }}
                                >
                                  {i18n.tString("auth.notify_emails_add_button")}
                                </button>
                              </div>
                            )}

                            {/* Manage / Done — compact link to avoid disrupting table row height */}
                            <button
                              type="button"
                              class="notify-link-btn"
                              onClick={() =>
                                managingAlertId.value = isManaging
                                  ? null
                                  : alert.id}
                            >
                              {isManaging
                                ? i18n.tString("auth.notify_emails_done")
                                : i18n.tString("auth.notify_emails_manage")}
                            </button>
                          </div>
                        </td>
                        <td class="govuk-table__cell">
                          <button
                            type="button"
                            class="govuk-button govuk-button--warning govuk-button--secondary"
                            data-module="govuk-button"
                            onClick={() => openDeleteDialog(alert)}
                          >
                            {i18n.tString("common.delete")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Sign out */}
      <button
        type="button"
        class="govuk-button govuk-button--secondary"
        data-module="govuk-button"
        onClick={handleSignOut}
      >
        {i18n.tString("auth.sign_out")}
      </button>

      {/* Delete confirmation dialog */}
      <dialog
        ref={confirmDialogRef}
        class="alert-delete-dialog"
        onClick={handleConfirmBackdropClick}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <div class="govuk-notification-banner alert-delete-modal-dialog">
          <div class="govuk-notification-banner__header">
            <h2
              class="govuk-notification-banner__title"
              id="delete-dialog-title"
            >
              {i18n.tString("auth.delete_confirm_title")}
            </h2>
          </div>
          <div class="govuk-notification-banner__content">
            <div id="delete-dialog-description">
              <p class="govuk-body">
                {i18n.tString("auth.delete_confirm_message")}{" "}
                <strong>{deletingAlert.value?.server_name}</strong>?
              </p>
              {deleteError.value && (
                <p class="govuk-error-message">{deleteError.value}</p>
              )}
            </div>
            <div class="govuk-button-group">
              <button
                type="button"
                class="govuk-button govuk-button--warning"
                data-module="govuk-button"
                onClick={handleDelete}
                disabled={isDeleting.value}
              >
                {isDeleting.value
                  ? i18n.tString("auth.delete_deleting")
                  : i18n.tString("auth.delete_confirm_button")}
              </button>
              <button
                type="button"
                class="govuk-button govuk-button--secondary"
                data-module="govuk-button"
                onClick={closeDeleteDialog}
                disabled={isDeleting.value}
              >
                {i18n.tString("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
