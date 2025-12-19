import type { ComponentChildren } from "preact";
import type { MatrixError } from "../lib/errors.ts";
import { getErrorSolution, hasDocumentation } from "../lib/error-solutions.ts";
import { getTechnicalDetails } from "../lib/errors.ts";
import type { I18n } from "../lib/i18n.ts";

/**
 * Converts URLs in text to clickable links
 */
function linkifyText(text: string): ComponentChildren {
  // Regex to match URLs
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const parts = text.split(urlRegex);

  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Reset regex lastIndex since we're reusing it
      urlRegex.lastIndex = 0;
      return (
        <a
          key={index}
          href={part}
          class="govuk-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

interface ErrorWithSolutionProps {
  error: MatrixError;
  context: "support" | "client-server" | "federation" | "wellknown";
  i18n: I18n;
  baseUrl?: string;
}

export function ErrorWithSolution(
  { error, context, i18n, baseUrl = "" }: ErrorWithSolutionProps,
) {
  const solution = getErrorSolution(error, context);
  const showDocsLink = hasDocumentation(solution.docsLink);
  const docsUrl = showDocsLink && solution.docsLink
    ? `${baseUrl}${solution.docsLink}`
    : null;

  // Get steps array from translation
  // The solution.steps is a translation key that resolves to an array
  const steps = i18n.t(solution.steps);
  const stepsArray = Array.isArray(steps) ? steps : [String(steps)];

  // Check if this is a warning (not an error)
  const isWarning = error.isWarning === true;

  // Use govuk-error-summary with modifier class for warnings
  const containerClass = isWarning
    ? "govuk-error-summary govuk-error-summary--warning"
    : "govuk-error-summary";

  return (
    <div class={containerClass} data-module="govuk-error-summary">
      <div role="alert">
        <h2 class="govuk-error-summary__title">
          {i18n.t(solution.title)}
        </h2>
        <div class="govuk-error-summary__body">
          <p class="govuk-body">{i18n.t(solution.description)}</p>

          <h3 class="govuk-heading-s">
            {i18n.t("error_solutions.what_to_do")}
          </h3>
          <ol class="govuk-list govuk-list--number govuk-error-summary__list">
            {stepsArray.map((step, index) => <li key={index}>{step}</li>)}
          </ol>

          {solution.technicalNote && (
            <div class="govuk-inset-text">
              <strong>
                {i18n.t("error_solutions.technical_note_label")}:
              </strong>{" "}
              {linkifyText(String(i18n.t(solution.technicalNote)))}
            </div>
          )}

          {docsUrl && solution.learnMoreKey && (
            <p class="govuk-body">
              <a class="govuk-link" href={docsUrl}>
                {i18n.t(solution.learnMoreKey)}
              </a>
            </p>
          )}

          {!showDocsLink && solution.docsLink && (
            <div class="govuk-warning-text">
              <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
              <strong class="govuk-warning-text__text">
                <span class="govuk-visually-hidden">
                  {i18n.t("error_solutions.note")}
                </span>
                {i18n.t("error_solutions.docs_coming_soon")}
              </strong>
            </div>
          )}

          <details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                {i18n.t("results.technical_details")}
              </span>
            </summary>
            <div class="govuk-details__text">
              <pre class="technical-details-pre">
              {getTechnicalDetails(error)}
              </pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
