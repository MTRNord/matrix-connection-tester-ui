import { useEffect, useMemo } from "preact/hooks";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  fetchSupportInfo,
  supportError,
  supportHasAnyInfo,
  supportHasContacts,
  supportHasSupportPage,
  supportInfo,
  supportLoading,
} from "../lib/support-state.ts";

interface SupportInfoProps {
  serverName: string;
  locale: Locale;
}

export default function SupportInfo(
  { serverName, locale }: SupportInfoProps,
) {
  const i18n = useMemo(() => new I18n(locale), [locale]);

  useEffect(() => {
    fetchSupportInfo(serverName);
  }, [serverName]);

  if (supportLoading.value) {
    return (
      <div
        class="govuk-body loading-container"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p>{i18n.t("results.loading")}</p>
        <span class="loading-spinner" aria-hidden="true"></span>
      </div>
    );
  }

  // Don't show errors inline - they appear in the Problems section
  if (supportError.value) {
    return null;
  }

  if (!supportHasAnyInfo.value) {
    return (
      <div class="govuk-body">
        <p>{i18n.t("results.no_support_contacts")}</p>
      </div>
    );
  }

  return (
    <>
      <h2 class="govuk-heading-m">{i18n.t("results.support_info_title")}</h2>
      <p class="govuk-body">{i18n.t("results.support_info_description")}</p>

      {supportHasContacts.value && supportInfo.value && (
        <ul class="govuk-list govuk-list--bullet">
          {supportInfo.value.contacts!.map((contact, index) => (
            <li key={index}>
              <span class="support-contact-role">
                {getRoleLabel(contact.role, i18n)}:&nbsp;
              </span>
              <span class="support-contact-details">
                {contact.email_address && (
                  <>
                    <a
                      class="govuk-link"
                      href={`mailto:${contact.email_address}`}
                    >
                      {contact.email_address}
                    </a>
                    {contact.matrix_id && <br />}
                  </>
                )}
                {contact.matrix_id && (
                  <a
                    class="govuk-link"
                    href={`https://matrix.to/#/${
                      encodeURIComponent(contact.matrix_id)
                    }`}
                    rel="noopener noreferrer"
                  >
                    {contact.matrix_id}
                  </a>
                )}
                {!contact.email_address && !contact.matrix_id && (
                  <span>{contact.role}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {supportHasSupportPage.value && supportInfo.value && (
        <p class="govuk-body">
          {i18n.t("results.support_page_link")}{" "}
          <a
            class="govuk-link"
            href={supportInfo.value.support_page}
            rel="noopener noreferrer"
          >
            {i18n.t("results.support_page")}
          </a>
          .
        </p>
      )}
    </>
  );
}

function getRoleLabel(
  role: string,
  i18n: I18n,
): string {
  const roleLower = role.toLowerCase();

  if (roleLower.includes("admin")) {
    return i18n.tString("results.role_admin");
  } else if (roleLower.includes("security")) {
    return i18n.tString("results.role_security");
  } else if (roleLower.includes("support")) {
    return i18n.tString("results.role_support");
  }

  return role;
}
