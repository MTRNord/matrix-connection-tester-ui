/**
 * User-friendly error solutions for Matrix connectivity issues
 * Provides actionable steps for resolving common problems
 */

import { ErrorType, type MatrixError } from "./errors.ts";

export interface ErrorSolution {
  title: string;
  description: string;
  steps: string; // Translation key that resolves to an array
  technicalNote?: string;
  docsLink?: string;
  learnMoreKey?: string;
}

/**
 * Get user-friendly solution for a Matrix error
 */
export function getErrorSolution(
  error: MatrixError,
  context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  switch (error.type) {
    case ErrorType.CORS:
      return getCORSSolution(context);

    case ErrorType.CORS_PREFLIGHT:
      return getCORSPreflightSolution(context);

    case ErrorType.NOT_FOUND:
      return getNotFoundSolution(context);

    case ErrorType.CONTENT_TYPE:
      return getContentTypeSolution(context);

    case ErrorType.JSON_PARSE:
      return getJSONParseSolution(context);

    case ErrorType.SERVER_ERROR:
      return getServerErrorSolution(context);

    case ErrorType.TIMEOUT:
      return getTimeoutSolution(context);

    case ErrorType.TLS_ERROR:
      return getTLSErrorSolution(context);

    case ErrorType.NETWORK:
      return getNetworkErrorSolution(context);

    case ErrorType.INVALID_RESPONSE:
      return getInvalidResponseSolution(context);

    case ErrorType.MISSING_FIELD:
      return getMissingFieldSolution(context);

    default:
      // Special case for wellknown context with INVALID_RESPONSE
      if (context === "wellknown") {
        return getWellKnownErrorSolution();
      }
      return getUnknownErrorSolution(context);
  }
}

function getCORSSolution(
  context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  // CORS only applies to client-side fetches (support and client-server)
  // Federation checks are done by the backend API, so CORS there means
  // the connectivity tester API itself is misconfigured
  if (context === "federation") {
    return {
      title: "error_solutions.cors_federation.title",
      description: "error_solutions.cors_federation.description",
      steps: "error_solutions.cors_federation.steps",
      technicalNote: "error_solutions.cors_federation.technical_note",
      learnMoreKey: "error_solutions.cors_federation.learn_more",
    };
  }

  return {
    title: "error_solutions.cors.title",
    description: "error_solutions.cors.description",
    steps: "error_solutions.cors.steps",
    technicalNote: "error_solutions.cors.technical_note",
    docsLink: "/docs/cors-configuration",
    learnMoreKey: "error_solutions.cors.learn_more",
  };
}

function getCORSPreflightSolution(
  _context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  return {
    title: "error_solutions.cors_preflight.title",
    description: "error_solutions.cors_preflight.description",
    steps: "error_solutions.cors_preflight.steps",
    technicalNote: "error_solutions.cors_preflight.technical_note",
    docsLink: "/docs/cors-preflight",
    learnMoreKey: "error_solutions.cors_preflight.learn_more",
  };
}

function getNotFoundSolution(
  context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  if (context === "support") {
    return {
      title: "error_solutions.not_found_support.title",
      description: "error_solutions.not_found_support.description",
      steps: "error_solutions.not_found_support.steps",
      technicalNote: "error_solutions.not_found_support.technical_note",
      docsLink: "/docs/support-endpoint",
      learnMoreKey: "error_solutions.not_found_support.learn_more",
    };
  } else if (context === "client-server") {
    return {
      title: "error_solutions.not_found_client.title",
      description: "error_solutions.not_found_client.description",
      steps: "error_solutions.not_found_client.steps",
      technicalNote: "error_solutions.not_found_client.technical_note",
      docsLink: "/docs/client-server-api",
      learnMoreKey: "error_solutions.not_found_client.learn_more",
    };
  } else {
    return {
      title: "error_solutions.not_found_federation.title",
      description: "error_solutions.not_found_federation.description",
      steps: "error_solutions.not_found_federation.steps",
      docsLink: "/docs/federation-setup",
      learnMoreKey: "error_solutions.not_found_federation.learn_more",
    };
  }
}

function getContentTypeSolution(
  _context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  return {
    title: "error_solutions.content_type.title",
    description: "error_solutions.content_type.description",
    steps: "error_solutions.content_type.steps",
    technicalNote: "error_solutions.content_type.technical_note",
    docsLink: "/docs/server-configuration",
    learnMoreKey: "error_solutions.content_type.learn_more",
  };
}

function getJSONParseSolution(
  _context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  return {
    title: "error_solutions.json_parse.title",
    description: "error_solutions.json_parse.description",
    steps: "error_solutions.json_parse.steps",
    technicalNote: "error_solutions.json_parse.technical_note",
    docsLink: "/docs/troubleshooting",
    learnMoreKey: "error_solutions.json_parse.learn_more",
  };
}

function getServerErrorSolution(
  _context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  return {
    title: "error_solutions.server_error.title",
    description: "error_solutions.server_error.description",
    steps: "error_solutions.server_error.steps",
    docsLink: "/docs/server-logs",
    learnMoreKey: "error_solutions.server_error.learn_more",
  };
}

function getTimeoutSolution(
  _context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  return {
    title: "error_solutions.timeout.title",
    description: "error_solutions.timeout.description",
    steps: "error_solutions.timeout.steps",
    docsLink: "/docs/performance",
    learnMoreKey: "error_solutions.timeout.learn_more",
  };
}

function getTLSErrorSolution(
  context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  if (context === "federation") {
    return {
      title: "error_solutions.tls_federation.title",
      description: "error_solutions.tls_federation.description",
      steps: "error_solutions.tls_federation.steps",
      technicalNote: "error_solutions.tls_federation.technical_note",
      docsLink: "/docs/federation-tls",
      learnMoreKey: "error_solutions.tls_federation.learn_more",
    };
  }

  return {
    title: "error_solutions.tls.title",
    description: "error_solutions.tls.description",
    steps: "error_solutions.tls.steps",
    technicalNote: "error_solutions.tls.technical_note",
    docsLink: "/docs/tls-certificates",
    learnMoreKey: "error_solutions.tls.learn_more",
  };
}

function getNetworkErrorSolution(
  context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  if (context === "federation") {
    return {
      title: "error_solutions.network_federation.title",
      description: "error_solutions.network_federation.description",
      steps: "error_solutions.network_federation.steps",
      docsLink: "/docs/federation-network",
      learnMoreKey: "error_solutions.network_federation.learn_more",
    };
  }

  return {
    title: "error_solutions.network.title",
    description: "error_solutions.network.description",
    steps: "error_solutions.network.steps",
    docsLink: "/docs/network-troubleshooting",
    learnMoreKey: "error_solutions.network.learn_more",
  };
}

function getInvalidResponseSolution(
  _context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  return {
    title: "error_solutions.invalid_response.title",
    description: "error_solutions.invalid_response.description",
    steps: "error_solutions.invalid_response.steps",
    technicalNote: "error_solutions.invalid_response.technical_note",
    docsLink: "/docs/matrix-spec-compliance",
    learnMoreKey: "error_solutions.invalid_response.learn_more",
  };
}

function getMissingFieldSolution(
  _context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  return {
    title: "error_solutions.missing_field.title",
    description: "error_solutions.missing_field.description",
    steps: "error_solutions.missing_field.steps",
    technicalNote: "error_solutions.missing_field.technical_note",
    docsLink: "/docs/matrix-spec-compliance",
    learnMoreKey: "error_solutions.missing_field.learn_more",
  };
}

function getWellKnownErrorSolution(): ErrorSolution {
  return {
    title: "error_solutions.wellknown_error.title",
    description: "error_solutions.wellknown_error.description",
    steps: "error_solutions.wellknown_error.steps",
    technicalNote: "error_solutions.wellknown_error.technical_note",
    docsLink: "/docs/wellknown-delegation",
    learnMoreKey: "error_solutions.wellknown_error.learn_more",
  };
}

function getUnknownErrorSolution(
  _context: "support" | "client-server" | "federation" | "wellknown",
): ErrorSolution {
  return {
    title: "error_solutions.unknown.title",
    description: "error_solutions.unknown.description",
    steps: "error_solutions.unknown.steps",
    docsLink: "/docs/getting-help",
    learnMoreKey: "error_solutions.unknown.learn_more",
  };
}

/**
 * Check if documentation link exists (for future use)
 */
export function hasDocumentation(_docsLink?: string): boolean {
  // For now, return false as docs aren't written yet
  // In the future, this could check if the page exists
  return false;
}

/**
 * Get formatted documentation URL
 */
export function getDocumentationUrl(
  baseUrl: string,
  docsLink?: string,
): string | null {
  if (!docsLink || !hasDocumentation(docsLink)) {
    return null;
  }
  return `${baseUrl}${docsLink}`;
}
