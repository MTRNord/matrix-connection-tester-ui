import { useComputed, useSignal } from "@preact/signals";
import { useEffect, useMemo, useRef } from "preact/hooks";
import { I18n, type Locale } from "../lib/i18n.ts";
import { fetchWithTrace } from "../lib/tracing.ts";

interface AlertDeleteButtonProps {
  alertId: string;
  serverName: string;
  locale: Locale;
  apiBaseUrl: string;
}

export default function AlertDeleteButton(
  { alertId, serverName, locale, apiBaseUrl }: AlertDeleteButtonProps,
) {
  const i18n = useMemo(() => new I18n(locale), [locale]);
  const isDeleting = useSignal(false);
  const isDeletionPending = useSignal(false);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const successDialogRef = useRef<HTMLDialogElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Computed signal for button text
  const buttonText = useComputed(() => {
    if (isDeletionPending.value) {
      return i18n.tString("alerts.delete_pending_deletion");
    }
    return isDeleting.value
      ? i18n.tString("alerts.delete_deleting")
      : i18n.tString("common.delete");
  });

  const handleDelete = async () => {
    isDeleting.value = true;

    try {
      const response = await fetchWithTrace(
        `${apiBaseUrl}/api/alerts/${encodeURIComponent(alertId)}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        // Show success message and mark as pending
        confirmDialogRef.current?.close();
        isDeleting.value = false;
        isDeletionPending.value = true;
        successDialogRef.current?.showModal();
      } else {
        // Show error and reset
        alert("Failed to send deletion verification email. Please try again.");
        isDeleting.value = false;
        confirmDialogRef.current?.close();
      }
    } catch (e) {
      console.error("Error requesting deletion:", e);
      alert("Failed to send deletion verification email. Please try again.");
      isDeleting.value = false;
      confirmDialogRef.current?.close();
    }
  };

  const handleCloseConfirm = () => {
    confirmDialogRef.current?.close();
  };

  const handleCloseSuccess = () => {
    successDialogRef.current?.close();
  };

  const handleShowConfirm = () => {
    confirmDialogRef.current?.showModal();
  };

  // Handle dialog close events to restore focus
  useEffect(() => {
    const confirmDialog = confirmDialogRef.current;
    const successDialog = successDialogRef.current;

    const handleConfirmClose = () => {
      triggerButtonRef.current?.focus();
    };

    const handleSuccessClose = () => {
      triggerButtonRef.current?.focus();
    };

    confirmDialog?.addEventListener("close", handleConfirmClose);
    successDialog?.addEventListener("close", handleSuccessClose);

    return () => {
      confirmDialog?.removeEventListener("close", handleConfirmClose);
      successDialog?.removeEventListener("close", handleSuccessClose);
    };
  }, []);

  // Focus first interactive element when dialogs open
  useEffect(() => {
    const confirmDialog = confirmDialogRef.current;
    const successDialog = successDialogRef.current;

    const handleConfirmOpen = () => {
      const firstButton = confirmDialog?.querySelector("button");
      firstButton?.focus();
    };

    const handleSuccessOpen = () => {
      const closeButton = successDialog?.querySelector("button");
      closeButton?.focus();
    };

    // Use MutationObserver to detect when dialog opens
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "open") {
          if (confirmDialog?.open) {
            handleConfirmOpen();
          }
          if (successDialog?.open) {
            handleSuccessOpen();
          }
        }
      });
    });

    if (confirmDialog) {
      observer.observe(confirmDialog, { attributes: true });
    }
    if (successDialog) {
      observer.observe(successDialog, { attributes: true });
    }

    return () => observer.disconnect();
  }, []);

  // Handle backdrop clicks
  const handleConfirmBackdropClick = (e: MouseEvent) => {
    if (!isDeleting.value && e.target === confirmDialogRef.current) {
      handleCloseConfirm();
    }
  };

  const handleSuccessBackdropClick = (e: MouseEvent) => {
    if (e.target === successDialogRef.current) {
      handleCloseSuccess();
    }
  };

  return (
    <>
      <button
        ref={triggerButtonRef}
        type="button"
        class="govuk-button govuk-button--warning govuk-button--secondary"
        data-module="govuk-button"
        onClick={handleShowConfirm}
        disabled={isDeleting.value || isDeletionPending.value}
      >
        {buttonText}
      </button>

      <dialog
        ref={confirmDialogRef}
        class="alert-delete-dialog"
        onClick={handleConfirmBackdropClick}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <div class="govuk-notification-banner alert-delete-modal-dialog">
          <div class="govuk-notification-banner__header">
            <h2
              class="govuk-notification-banner__title"
              id="confirm-dialog-title"
            >
              {i18n.tString("alerts.delete_confirm_title")}
            </h2>
          </div>
          <div class="govuk-notification-banner__content">
            <div id="confirm-dialog-description">
              <p class="govuk-body">
                {i18n.tString("alerts.delete_confirm_message")}{" "}
                <strong>{serverName}</strong>?
              </p>
              <p class="govuk-body">
                <strong>
                  {i18n.tString("alerts.delete_confirm_warning")}
                </strong>
              </p>
            </div>
            <div class="govuk-button-group">
              <button
                type="button"
                class="govuk-button govuk-button--warning"
                data-module="govuk-button"
                onClick={handleDelete}
                disabled={isDeleting.value}
              >
                {i18n.tString("alerts.delete_confirm_delete")}
              </button>
              <button
                type="button"
                class="govuk-button govuk-button--secondary"
                data-module="govuk-button"
                onClick={handleCloseConfirm}
                disabled={isDeleting.value}
              >
                {i18n.tString("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      </dialog>

      <dialog
        ref={successDialogRef}
        class="alert-delete-dialog"
        onClick={handleSuccessBackdropClick}
        aria-labelledby="success-dialog-title"
        aria-describedby="success-dialog-description"
      >
        <div class="govuk-notification-banner govuk-notification-banner--success alert-delete-modal-dialog">
          <div class="govuk-notification-banner__header">
            <h2
              class="govuk-notification-banner__title"
              id="success-dialog-title"
            >
              {i18n.tString("alerts.delete_success_title")}
            </h2>
          </div>
          <div class="govuk-notification-banner__content">
            <div id="success-dialog-description">
              <p class="govuk-body">
                {i18n.tString("alerts.delete_success_message")}{" "}
                <strong>{serverName}</strong>.
              </p>
              <div class="govuk-inset-text modal-inset-text">
                {i18n.tString("alerts.delete_success_note")}
              </div>
            </div>
            <button
              type="button"
              class="govuk-button"
              data-module="govuk-button"
              onClick={handleCloseSuccess}
            >
              {i18n.tString("common.close")}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
