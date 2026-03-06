import { I18n } from "../lib/i18n.ts";
import type { APIResponseType, ConnectionReport } from "../routes/results.tsx";
import { ErrorType, isTLSError, MatrixError } from "../lib/errors.ts";
import { ErrorWithSolution } from "./ErrorWithSolution.tsx";
import { getSplitBrainSolution } from "../lib/error-solutions.ts";

interface FederationProblemsProps {
  i18n: I18n;
  apiData: APIResponseType;
  baseUrl?: string;
}

export function FederationProblems(
  { i18n, apiData, baseUrl }: FederationProblemsProps,
) {
  const reports = apiData.ConnectionReports;
  const connectionErrors = apiData.ConnectionErrors;
  const wellKnownResults = apiData.WellKnownResult;

  // Extract errors from connection reports and connection errors
  const errors: Array<{ ip: string; error: MatrixError }> = [];
  const wellKnownErrors: Array<{ ip: string; error: MatrixError }> = [];

  // Handle WellKnownResult errors (timeouts, 400 Bad Request, etc.)
  if (wellKnownResults && Object.keys(wellKnownResults).length > 0) {
    Object.entries(wellKnownResults).forEach(([ip, result]) => {
      if (result.Error?.Error) {
        const errText = result.Error.Error.toLowerCase();
        const isTimeout = errText.includes("timeout");
        const isNetwork = errText.includes("network") ||
          errText.includes("connection refused") ||
          errText.includes("connection reset");
        wellKnownErrors.push({
          ip,
          error: {
            type: isTimeout
              ? ErrorType.TIMEOUT
              : isNetwork
              ? ErrorType.NETWORK
              : ErrorType.INVALID_RESPONSE,
            message: isTimeout
              ? "errors.timeout_error"
              : isNetwork
              ? "errors.network_error"
              : "errors.wellknown_error",
            technicalDetails: result.Error.Error,
            endpoint: `https://${ip}/.well-known/matrix/server`,
          },
        });
      }
    });
  }

  // Handle ConnectionErrors (network timeouts, connection failures, etc.)
  if (connectionErrors && Object.keys(connectionErrors).length > 0) {
    Object.entries(connectionErrors).forEach(([ip, errorInfo]) => {
      // Detect TLS/certificate errors
      const isTLS = isTLSError(new Error(errorInfo.Error));

      errors.push({
        ip,
        error: {
          type: isTLS ? ErrorType.TLS_ERROR : ErrorType.NETWORK,
          message: isTLS ? "errors.tls_error" : "errors.network_error",
          technicalDetails: errorInfo.Error,
          endpoint: `https://${ip}`,
        },
      });
    });
  }

  // Handle ConnectionReports (detailed check failures)
  if (reports && Object.keys(reports).length > 0) {
    Object.entries(reports).forEach(
      ([ip, report]: [string, ConnectionReport]) => {
        const checks = report.Checks;

        // Check for various federation issues
        if (!checks.AllChecksOK) {
          // Certificate validation issues
          if (!checks.ValidCertificates) {
            errors.push({
              ip,
              error: {
                type: ErrorType.TLS_ERROR,
                message: "errors.invalid_certificates",
                technicalDetails:
                  `The TLS certificates for ${ip} are not valid. This could be due to expired certificates, self-signed certificates, or certificate chain issues.`,
                endpoint: `https://${ip}`,
              },
            });
          }

          // Server name mismatch
          if (!checks.MatchingServerName) {
            errors.push({
              ip,
              error: {
                type: ErrorType.INVALID_RESPONSE,
                message: "errors.server_name_mismatch",
                technicalDetails:
                  `The server name in the response does not match the expected server name for ${ip}.`,
                endpoint: `https://${ip}`,
              },
            });
          }

          // Ed25519 key issues
          if (!checks.HasEd25519Key) {
            errors.push({
              ip,
              error: {
                type: ErrorType.MISSING_FIELD,
                message: "errors.missing_ed25519_key",
                technicalDetails:
                  `The server at ${ip} does not have an Ed25519 signing key configured.`,
                endpoint: `https://${ip}`,
              },
            });
          }

          // Ed25519 signature validation
          if (!checks.AllEd25519ChecksOK) {
            errors.push({
              ip,
              error: {
                type: ErrorType.INVALID_RESPONSE,
                message: "errors.invalid_ed25519_signature",
                technicalDetails:
                  `The Ed25519 signatures for ${ip} could not be validated. This indicates the server's signing keys may not match the signatures in the response.`,
                endpoint: `https://${ip}`,
              },
            });
          }

          // Valid until timestamp issues
          if (!checks.FutureValidUntilTS) {
            errors.push({
              ip,
              error: {
                type: ErrorType.INVALID_RESPONSE,
                message: "errors.expired_keys",
                technicalDetails:
                  `The signing keys for ${ip} have expired or the valid_until_ts is in the past.`,
                endpoint: `https://${ip}`,
              },
            });
          }

          // Server version parsing issues
          if (!checks.ServerVersionParses) {
            errors.push({
              ip,
              error: {
                type: ErrorType.INVALID_RESPONSE,
                message: "errors.invalid_server_version",
                technicalDetails:
                  `The server version for ${ip} could not be parsed. The server may not be returning proper version information.`,
                endpoint: `https://${ip}`,
              },
            });
          }
        }
      },
    );
  }

  return (
    <div>
      <h3 class="govuk-heading-m">
        {i18n.t("results.federation_problems_title")}
      </h3>
      <p class="govuk-body">
        {i18n.t("results.federation_problems_description")}
      </p>

      {/* Split-brain warning */}
      {apiData.Error?.ErrorCode === "SplitBrain" && (() => {
        const solution = getSplitBrainSolution();
        const steps = i18n.t(solution.steps);
        const stepsArray = Array.isArray(steps) ? steps : [String(steps)];
        return (
          <div class="govuk-error-summary govuk-error-summary--warning" data-module="govuk-error-summary">
            <div role="alert">
              <h2 class="govuk-error-summary__title">
                {i18n.t(solution.title)}
              </h2>
              <div class="govuk-error-summary__body">
                <p class="govuk-body">{i18n.t(solution.description)}</p>
                <h3 class="govuk-heading-s">{i18n.t("error_solutions.what_to_do")}</h3>
                <ol class="govuk-list govuk-list--number govuk-error-summary__list">
                  {stepsArray.map((step, index) => <li key={index}>{step}</li>)}
                </ol>
                {solution.technicalNote && (
                  <div class="govuk-inset-text">
                    <strong>{i18n.t("error_solutions.technical_note_label")}:</strong>{" "}
                    {i18n.t(solution.technicalNote)}
                  </div>
                )}
                {apiData.Error?.Error && (
                  <details class="govuk-details">
                    <summary class="govuk-details__summary">
                      <span class="govuk-details__summary-text">
                        {i18n.t("results.technical_details")}
                      </span>
                    </summary>
                    <div class="govuk-details__text">
                      <pre class="technical-details-pre">{apiData.Error.Error}</pre>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Well-Known errors (shown even if federation works via other means) */}
      {wellKnownErrors.length > 0 && (
        <>
          <div class="govuk-warning-text">
            <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
            <strong class="govuk-warning-text__text">
              <span class="govuk-visually-hidden">
                {i18n.t("common.warning")}
              </span>
              {i18n.t("results.wellknown_warning_title")}
            </strong>
            <p class="govuk-body">
              {i18n.t("results.wellknown_warning_description")}
            </p>
          </div>

          {wellKnownErrors.map(({ ip, error }, index) => (
            <div key={`wellknown-${index}`}>
              <h4 class="govuk-heading-s">
                {i18n.t("results.wellknown_problem_for_ip")}:{" "}
                <code aria-label="IP address">{ip}</code>
              </h4>
              <ErrorWithSolution
                error={error}
                context="wellknown"
                i18n={i18n}
                baseUrl={baseUrl}
              />
            </div>
          ))}
        </>
      )}

      {/* Federation errors (connection and check failures) */}
      {errors.length === 0 && wellKnownErrors.length === 0
        ? (
          <p class="govuk-body">
            {i18n.t("results.federation_generic_error")}
          </p>
        )
        : (
          errors.map(({ ip, error }, index) => (
            <div key={index}>
              <h4 class="govuk-heading-s">
                {i18n.t("results.federation_problem_for_ip")}:{" "}
                <code aria-label="IP address">{ip}</code>
              </h4>
              <ErrorWithSolution
                error={error}
                context="federation"
                i18n={i18n}
                baseUrl={baseUrl}
              />
            </div>
          ))
        )}
    </div>
  );
}
