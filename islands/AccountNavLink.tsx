/**
 * Client-side island for the "Your account" navigation link.
 *
 * Reads the backend URL from config.json and links to the backend account
 * page. The backend account page manages its own independent auth session
 * (server-side code exchange), so no token passing is needed.
 */

import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { isAuthenticated } from "../lib/auth.ts";

interface AccountNavLinkProps {
  /** i18n label for the link. Passed from the SSR shell to avoid client-side i18n. */
  label: string;
}

export default function AccountNavLink({ label }: AccountNavLinkProps) {
  const href = useSignal<string>("/oauth2/account");
  // null = unknown/loading, true = visible (logged in), false = hidden (not logged in)
  const visible = useSignal<boolean | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Load API server URL (if configured) and set the account href.
        const res = await fetch("/config.json");
        let apiUrl = "";
        if (res.ok) {
          const config = await res.json() as { api_server_url?: string };
          apiUrl = config.api_server_url?.replace(/\/$/, "") ?? "";
          if (apiUrl) {
            href.value = `${apiUrl}/oauth2/account`;
          }
        }
      } catch {
        // Fall through — keep the default /oauth2/account fallback
      }

      // Use sessionStorage-backed auth check (same approach as AlertsApp).
      // This avoids an extra network request and matches alerts-app behaviour.
      try {
        visible.value = isAuthenticated();
      } catch {
        visible.value = false;
      }
    }

    // Initialize once on mount.
    init();
  }, []);

  // While loading/unknown or not authenticated, render nothing.
  if (visible.value !== true) return null;

  return (
    <a class="govuk-service-navigation__link" href={href.value}>
      {label}
    </a>
  );
}
