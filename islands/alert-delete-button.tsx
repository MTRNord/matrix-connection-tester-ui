import { useComputed, useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

interface AlertDeleteButtonProps {
  alertId: string;
  serverName: string;
  locale: string;
  apiBaseUrl: string;
}

export default function AlertDeleteButton(
  { alertId, serverName, locale, apiBaseUrl }: AlertDeleteButtonProps,
) {
  const showConfirm = useSignal(false);
  const isDeleting = useSignal(false);
  const deletionRequested = useSignal(false);
  const isDeletionPending = useSignal(false);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  const successDialogRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  const translations = {
    en: {
      delete: "Delete",
      confirm_title: "Confirm deletion",
      confirm_message: "Request deletion of the alert for",
      confirm_warning:
        "You will receive a verification email to confirm this deletion.",
      cancel: "Cancel",
      confirm_delete: "Send verification email",
      deleting: "Sending...",
      success_title: "Verification email sent",
      success_message:
        "Please check your email and click the verification link to complete the deletion of the alert for",
      success_note:
        "Note: The alert will remain in this list until you confirm the deletion via email.",
      close: "Close",
      pending_deletion: "Deletion pending",
    },
    de: {
      delete: "Löschen",
      confirm_title: "Löschung bestätigen",
      confirm_message: "Löschung der Benachrichtigung anfragen für",
      confirm_warning:
        "Sie erhalten eine Bestätigungs-E-Mail, um diese Löschung zu bestätigen.",
      cancel: "Abbrechen",
      confirm_delete: "Bestätigungs-E-Mail senden",
      deleting: "Wird gesendet...",
      success_title: "Bestätigungs-E-Mail gesendet",
      success_message:
        "Bitte überprüfen Sie Ihre E-Mails und klicken Sie auf den Bestätigungslink, um die Löschung der Benachrichtigung für",
      success_note:
        "Hinweis: Die Benachrichtigung bleibt in dieser Liste, bis Sie die Löschung per E-Mail bestätigen.",
      close: "Schließen",
      pending_deletion: "Löschung ausstehend",
    },
  };

  const t = translations[locale as keyof typeof translations] ||
    translations.en;

  // Computed signal for button text
  const buttonText = useComputed(() => {
    if (isDeletionPending.value) {
      return t.pending_deletion;
    }
    return isDeleting.value ? t.deleting : t.delete;
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
                {t.confirm_title}
              </h2>
            </div>
            <div class="govuk-notification-banner__content">
              <div id="confirm-dialog-description">
                <p class="govuk-body">
                  {t.confirm_message} <strong>{serverName}</strong>?
                </p>
                <p class="govuk-body">
                  <strong>{t.confirm_warning}</strong>
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
                  {t.confirm_delete}
                </button>
                <button
                  type="button"
                  class="govuk-button govuk-button--secondary"
                  data-module="govuk-button"
                  onClick={handleCloseConfirm}
                  disabled={isDeleting.value}
                >
                  {t.cancel}
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
                {t.success_title}
              </h2>
            </div>
            <div class="govuk-notification-banner__content">
              <div id="success-dialog-description">
                <p class="govuk-body">
                  {t.success_message} <strong>{serverName}</strong>.
                </p>
                <div class="govuk-inset-text modal-inset-text">
                  {t.success_note}
                </div>
              </div>
              <button
                type="button"
                class="govuk-button"
                data-module="govuk-button"
                onClick={handleCloseSuccess}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
