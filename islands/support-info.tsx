import { useEffect, useMemo, useState } from "preact/hooks";
import type { MatrixError } from "../lib/errors.ts";
import {
  createHTTPError,
  createJSONParseError,
  ErrorType,
  fetchWithTimeout,
  validateContentType,
} from "../lib/errors.ts";
import { I18n, type Locale } from "../lib/i18n.ts";

interface SupportContact {
  matrix_id?: string;
  email_address?: string;
  role: string;
}

interface SupportInfo {
  contacts?: SupportContact[];
  support_page?: string;
}

interface SupportInfoProps {
  serverName: string;
  locale: Locale;
}

export default function SupportInfo(
  { serverName, locale }: SupportInfoProps,
) {
  const i18n = useMemo(() => new I18n(locale), [locale]);
  const [supportInfo, setSupportInfo] = useState<SupportInfo | null>(null);
  const [error, setError] = useState<MatrixError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupportInfo();
  }, [serverName]);

  const fetchSupportInfo = async () => {
    setLoading(true);
    setError(null);

    const url = `https://${serverName}/.well-known/matrix/support`;

    // Fetch with timeout
    const { response, error: fetchError } = await fetchWithTimeout(url, 10000);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    if (!response) {
      setError({
        type: ErrorType.UNKNOWN,
        message: "errors.unknown_error",
        endpoint: url,
      });
      setLoading(false);
      return;
    }

    // Check HTTP status
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      setError(createHTTPError(response, url, text));
      setLoading(false);
      return;
    }

    // Validate Content-Type
    const contentTypeError = validateContentType(response);
    if (contentTypeError) {
      contentTypeError.endpoint = url;
      setError(contentTypeError);
      setLoading(false);
      return;
    }

    // Parse JSON
    let data: unknown;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      setError(createJSONParseError(e, url, responseText));
      setLoading(false);
      return;
    }

    // Validate structure (support info can be empty, but should be an object)
    if (!data || typeof data !== "object") {
      setError({
        type: ErrorType.INVALID_RESPONSE,
        message: "errors.invalid_response",
        technicalDetails: "Response is not a valid JSON object",
        endpoint: url,
      });
      setLoading(false);
      return;
    }

    setSupportInfo(data as SupportInfo);
    setLoading(false);
  };

  if (loading) {
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
  if (error) {
    return null;
  }

  const hasContacts = supportInfo?.contacts && supportInfo.contacts.length > 0;
  const hasSupportPage = supportInfo?.support_page &&
    supportInfo.support_page.length > 0;

  if (!hasContacts && !hasSupportPage) {
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

      {hasContacts && (
        <ul class="govuk-list govuk-list--bullet">
          {supportInfo!.contacts!.map((contact, index) => (
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

      {hasSupportPage && (
        <p class="govuk-body">
          {i18n.t("results.support_page_link")}{" "}
          <a
            class="govuk-link"
            href={supportInfo!.support_page}
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
    return i18n.t("results.role_admin");
  } else if (roleLower.includes("security")) {
    return i18n.t("results.role_security");
  } else if (roleLower.includes("support")) {
    return i18n.t("results.role_support");
  }

  return role;
}
