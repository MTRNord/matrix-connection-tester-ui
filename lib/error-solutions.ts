/**
 * User-friendly error solutions for Matrix connectivity issues
 * Provides actionable steps for resolving common problems
 */

import { ErrorType, type MatrixError } from "./errors.ts";

export interface ErrorSolution {
  title: string;
  description: string;
  steps: string[];
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
      steps: [
        "error_solutions.cors_federation.step1",
        "error_solutions.cors_federation.step2",
      ],
      technicalNote: "error_solutions.cors_federation.technical_note",
      learnMoreKey: "error_solutions.cors_federation.learn_more",
    };
  }

  return {
    title: "error_solutions.cors.title",
    description: "error_solutions.cors.description",
    steps: [
      "error_solutions.cors.step1",
      "error_solutions.cors.step2",
      "error_solutions.cors.step3",
      "error_solutions.cors.step4",
    ],
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
    steps: [
      "error_solutions.cors_preflight.step1",
      "error_solutions.cors_preflight.step2",
      "error_solutions.cors_preflight.step3",
      "error_solutions.cors_preflight.step4",
      "error_solutions.cors_preflight.step5",
    ],
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
      steps: [
        "error_solutions.not_found_support.step1",
        "error_solutions.not_found_support.step2",
        "error_solutions.not_found_support.step3",
      ],
      technicalNote: "error_solutions.not_found_support.technical_note",
      docsLink: "/docs/support-endpoint",
      learnMoreKey: "error_solutions.not_found_support.learn_more",
    };
  } else if (context === "client-server") {
    return {
      title: "error_solutions.not_found_client.title",
      description: "error_solutions.not_found_client.description",
      steps: [
        "error_solutions.not_found_client.step1",
        "error_solutions.not_found_client.step2",
        "error_solutions.not_found_client.step3",
        "error_solutions.not_found_client.step4",
      ],
      technicalNote: "error_solutions.not_found_client.technical_note",
      docsLink: "/docs/client-server-api",
      learnMoreKey: "error_solutions.not_found_client.learn_more",
    };
  } else {
    return {
      title: "error_solutions.not_found_federation.title",
      description: "error_solutions.not_found_federation.description",
      steps: [
        "error_solutions.not_found_federation.step1",
        "error_solutions.not_found_federation.step2",
        "error_solutions.not_found_federation.step3",
      ],
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
    steps: [
      "error_solutions.content_type.step1",
      "error_solutions.content_type.step2",
      "error_solutions.content_type.step3",
      "error_solutions.content_type.step4",
    ],
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
    steps: [
      "error_solutions.json_parse.step1",
      "error_solutions.json_parse.step2",
      "error_solutions.json_parse.step3",
      "error_solutions.json_parse.step4",
    ],
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
    steps: [
      "error_solutions.server_error.step1",
      "error_solutions.server_error.step2",
      "error_solutions.server_error.step3",
      "error_solutions.server_error.step4",
    ],
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
    steps: [
      "error_solutions.timeout.step1",
      "error_solutions.timeout.step2",
      "error_solutions.timeout.step3",
      "error_solutions.timeout.step4",
      "error_solutions.timeout.step5",
    ],
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
      steps: [
        "error_solutions.tls_federation.step1",
        "error_solutions.tls_federation.step2",
        "error_solutions.tls_federation.step3",
        "error_solutions.tls_federation.step4",
        "error_solutions.tls_federation.step5",
      ],
      technicalNote: "error_solutions.tls_federation.technical_note",
      docsLink: "/docs/federation-tls",
      learnMoreKey: "error_solutions.tls_federation.learn_more",
    };
  }

  return {
    title: "error_solutions.tls.title",
    description: "error_solutions.tls.description",
    steps: [
      "error_solutions.tls.step1",
      "error_solutions.tls.step2",
      "error_solutions.tls.step3",
      "error_solutions.tls.step4",
    ],
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
      steps: [
        "error_solutions.network_federation.step1",
        "error_solutions.network_federation.step2",
        "error_solutions.network_federation.step3",
        "error_solutions.network_federation.step4",
        "error_solutions.network_federation.step5",
      ],
      docsLink: "/docs/federation-network",
      learnMoreKey: "error_solutions.network_federation.learn_more",
    };
  }

  return {
    title: "error_solutions.network.title",
    description: "error_solutions.network.description",
    steps: [
      "error_solutions.network.step1",
      "error_solutions.network.step2",
      "error_solutions.network.step3",
      "error_solutions.network.step4",
    ],
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
    steps: [
      "error_solutions.invalid_response.step1",
      "error_solutions.invalid_response.step2",
      "error_solutions.invalid_response.step3",
    ],
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
    steps: [
      "error_solutions.missing_field.step1",
      "error_solutions.missing_field.step2",
      "error_solutions.missing_field.step3",
    ],
    technicalNote: "error_solutions.missing_field.technical_note",
    docsLink: "/docs/matrix-spec-compliance",
    learnMoreKey: "error_solutions.missing_field.learn_more",
  };
}

function getWellKnownErrorSolution(): ErrorSolution {
  return {
    title: "error_solutions.wellknown_error.title",
    description: "error_solutions.wellknown_error.description",
    steps: [
      "error_solutions.wellknown_error.step1",
      "error_solutions.wellknown_error.step2",
      "error_solutions.wellknown_error.step3",
      "error_solutions.wellknown_error.step4",
      "error_solutions.wellknown_error.step5",
    ],
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
    steps: [
      "error_solutions.unknown.step1",
      "error_solutions.unknown.step2",
      "error_solutions.unknown.step3",
      "error_solutions.unknown.step4",
    ],
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
