import { Component, ComponentChildren } from "preact";
import { captureException } from "@/lib/sentry.ts";

interface ErrorBoundaryProps {
  children: ComponentChildren;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary component that catches errors and reports them to Sentry
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static override getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(
    error: Error,
    errorInfo: { componentStack?: string },
  ) {
    // Report error to Sentry
    captureException(error, {
      component: "ErrorBoundary",
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Also log to console for development
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    globalThis.location.href = "/";
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div class="govuk-width-container">
          <main class="govuk-main-wrapper" id="main-content" role="main">
            <div class="govuk-grid-row">
              <div class="govuk-grid-column-two-thirds">
                <div
                  class="govuk-notification-banner govuk-notification-banner--error"
                  role="alert"
                  aria-labelledby="error-banner-title"
                  data-module="govuk-notification-banner"
                >
                  <div class="govuk-notification-banner__header">
                    <h2
                      class="govuk-notification-banner__title"
                      id="error-banner-title"
                    >
                      Error
                    </h2>
                  </div>
                  <div class="govuk-notification-banner__content">
                    <h3 class="govuk-notification-banner__heading">
                      An unexpected error has occurred
                    </h3>
                    <p class="govuk-body">
                      We're sorry, but something went wrong. The error has been
                      automatically reported and we'll look into it.
                    </p>
                    <details class="govuk-details">
                      <summary class="govuk-details__summary">
                        <span class="govuk-details__summary-text">
                          Technical details
                        </span>
                      </summary>
                      <div class="govuk-details__text">
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            backgroundColor: "#f3f2f1",
                            padding: "1rem",
                            borderRadius: "4px",
                            fontSize: "0.875rem",
                          }}
                        >
                          {this.state.error.message}
                          {this.state.error.stack &&
                            `\n\n${this.state.error.stack}`}
                        </pre>
                      </div>
                    </details>
                    <button
                      type="button"
                      class="govuk-button"
                      onClick={this.resetError}
                    >
                      Return to home page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}
