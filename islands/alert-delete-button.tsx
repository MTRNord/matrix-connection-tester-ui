import { useComputed, useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import type { I18n } from "../lib/i18n.ts";

interface AlertDeleteButtonProps {
  alertId: string;
  serverName: string;
  i18n: I18n;
  apiBaseUrl: string;
}

export default function AlertDeleteButton(
  { alertId, serverName, i18n, apiBaseUrl }: AlertDeleteButtonProps,
) {
  const showConfirm = useSignal(false);
  const isDeleting = useSignal(false);
  const deletionRequested = useSignal(false);
  const isDeletionPending = useSignal(false);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  const successDialogRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Computed signal for button text
  const buttonText = useComputed(() => {
    if (isDeletionPending.value) {
      return i18n.tString("alerts.delete_pending_deletion");
    }
    return isDeleting.value
      ? i18n.tString("alerts.delete_deleting")
      : i18n.tString("alerts.delete");
  });

  const handleDelete = async () => {
    isDeleting.value = true;

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/alerts/${encodeURIComponent(alertId)}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        // Show success message and mark as pending
        showConfirm.value = false;
        deletionRequested.value = true;
        isDeleting.value = false;
        isDeletionPending.value = true;
      } else {
        // Show error and reset
        alert("Failed to send deletion verification email. Please try again.");
        isDeleting.value = false;
        showConfirm.value = false;
      }
    } catch (e) {
      console.error("Error requesting deletion:", e);
      alert("Failed to send deletion verification email. Please try again.");
      isDeleting.value = false;
      showConfirm.value = false;
    }
  };

  // Handle escape key to close modals and trap focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === "Escape") {
        if (showConfirm.value && !isDeleting.value) {
          showConfirm.value = false;
          triggerButtonRef.current?.focus();
        } else if (deletionRequested.value) {
          deletionRequested.value = false;
          triggerButtonRef.current?.focus();
        }
      }

      // Handle Tab key for focus trap
      if (e.key === "Tab") {
        const activeDialog = showConfirm.value
          ? confirmDialogRef.current
          : deletionRequested.value
          ? successDialogRef.current
          : null;

        if (activeDialog) {
          const focusableElements = activeDialog.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          );
          const firstFocusable = focusableElements[0] as HTMLElement;
          const lastFocusable = focusableElements[
            focusableElements.length - 1
          ] as HTMLElement;

          if (e.shiftKey) {
            // Shift + Tab: move backwards
            if (document.activeElement === firstFocusable) {
              e.preventDefault();
              lastFocusable?.focus();
            }
          } else {
            // Tab: move forwards
            if (document.activeElement === lastFocusable) {
              e.preventDefault();
              firstFocusable?.focus();
            }
          }
        }
      }
    };

    if (showConfirm.value || deletionRequested.value) {
      globalThis.addEventListener("keydown", handleKeyDown);
      return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }
  }, [showConfirm.value, deletionRequested.value, isDeleting.value]);

  // Focus management for confirm dialog
  useEffect(() => {
    if (showConfirm.value && confirmDialogRef.current) {
      const firstButton = confirmDialogRef.current.querySelector("button");
      firstButton?.focus();
    }
  }, [showConfirm.value]);

  // Focus management for success dialog
  useEffect(() => {
    if (deletionRequested.value && successDialogRef.current) {
      const closeButton = successDialogRef.current.querySelector("button");
      closeButton?.focus();
    }
  }, [deletionRequested.value]);

  const handleCloseConfirm = () => {
    showConfirm.value = false;
    triggerButtonRef.current?.focus();
  };

  const handleCloseSuccess = () => {
    deletionRequested.value = false;
    triggerButtonRef.current?.focus();
  };

  return (
    <>
      <button
        ref={triggerButtonRef}
        type="button"
        class="govuk-button govuk-button--warning govuk-button--secondary"
        data-module="govuk-button"
        onClick={() => showConfirm.value = true}
        disabled={isDeleting.value || isDeletionPending.value}
      >
        {buttonText}
      </button>

      {showConfirm.value && (
        <div class="alert-delete-modal">
          <div
            class="alert-delete-modal-overlay"
            onClick={!isDeleting.value ? handleCloseConfirm : undefined}
            aria-hidden="true"
          />
          <div
            ref={confirmDialogRef}
            class="govuk-notification-banner alert-delete-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
          >
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
                  {i18n.tString("alerts.delete_cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletionRequested.value && (
        <div class="alert-delete-modal">
          <div
            class="alert-delete-modal-overlay"
            onClick={handleCloseSuccess}
            aria-hidden="true"
          />
          <div
            ref={successDialogRef}
            class="govuk-notification-banner govuk-notification-banner--success alert-delete-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-dialog-title"
            aria-describedby="success-dialog-description"
          >
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
                {i18n.tString("alerts.delete_close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
