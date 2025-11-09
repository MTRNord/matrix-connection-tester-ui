import { useEffect, useMemo, useState } from "preact/hooks";
import type { MatrixError } from "../lib/errors.ts";
import {
  createHTTPError,
  createJSONParseError,
  ErrorType,
  fetchWithTimeout,
  validateContentType,
} from "../lib/errors.ts";
import { ErrorWithSolution } from "../components/ErrorWithSolution.tsx";
import { I18n, type Locale } from "../lib/i18n.ts";

interface SupportProblemsProps {
  serverName: string;
  locale: Locale;
  baseUrl?: string;
}

export default function SupportProblems(
  { serverName, locale, baseUrl }: SupportProblemsProps,
) {
  const i18n = useMemo(() => new I18n(locale), [locale]);
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

    // No error - support info is valid
    setLoading(false);
  };

  // Show problems section when error exists
  useEffect(() => {
    if (!loading && error) {
      const problemsSection = document.getElementById("problems-section");
      if (problemsSection) {
        problemsSection.style.display = "block";
      }
    }
  }, [loading, error]);

  if (loading) {
    return null;
  }

  // If no error, don't render anything
  if (!error) {
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
        error={error}
        context="support"
        i18n={i18n}
        baseUrl={baseUrl}
      />
    </div>
  );
}
