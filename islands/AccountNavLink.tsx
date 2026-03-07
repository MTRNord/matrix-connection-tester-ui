/**
 * Client-side island for the "Your account" navigation link.
 *
 * Reads the backend URL from config.json and links to the backend account
 * page. The backend account page manages its own independent auth session
 * (server-side code exchange), so no token passing is needed.
 */

import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";

interface AccountNavLinkProps {
  /** i18n label for the link. Passed from the SSR shell to avoid client-side i18n. */
  label: string;
}

export default function AccountNavLink({ label }: AccountNavLinkProps) {
  const href = useSignal<string>("/oauth2/account");

  useEffect(() => {
    async function buildHref() {
      try {
        const res = await fetch("/config.json");
        if (!res.ok) return;
        const config = await res.json() as { api_server_url?: string };
        const apiUrl = config.api_server_url?.replace(/\/$/, "") ?? "";
        if (apiUrl) {
          href.value = `${apiUrl}/oauth2/account`;
        }
      } catch {
        // Fall through — keep the default /oauth2/account fallback
      }
    }

    buildHref();
  }, []);

  return (
    <a class="govuk-service-navigation__link" href={href.value}>
      {label}
    </a>
  );
}
