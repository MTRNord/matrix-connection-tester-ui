import { test as base, type Page } from "@playwright/test";
export { expect } from "@playwright/test";
import {
  DEFAULT_ALERTS,
  DEFAULT_USER_ME,
  OIDC_CONFIG,
  type AlertDto,
  type UserMeDto,
} from "./helpers/mock-data.ts";

// Backend URL as used by the frontend's config.json
const BACKEND = "http://localhost:8080";

// ---------------------------------------------------------------------------
// Auth injection
// ---------------------------------------------------------------------------

/**
 * Inject a fake access token into sessionStorage before the page scripts run.
 * Uses addInitScript so the island's isAuthenticated() check sees the token
 * immediately on hydration — no race condition.
 */
export async function injectAuthTokens(
  page: Page,
  options: { accessToken?: string; expiresAt?: number } = {},
): Promise<void> {
  const token = options.accessToken ?? "fake-e2e-access-token";
  const expiresAt = options.expiresAt ?? Date.now() + 60 * 60 * 1000;
  await page.addInitScript(
    ({ token, expiresAt }: { token: string; expiresAt: number }) => {
      sessionStorage.setItem("auth_access_token", token);
      sessionStorage.setItem("auth_token_expires_at", String(expiresAt));
    },
    { token, expiresAt },
  );
}

// ---------------------------------------------------------------------------
// API mocking
// ---------------------------------------------------------------------------

/**
 * Mock the alerts API and user /me endpoint.
 * Call before page.goto() so the mocks are in place when the island fetches.
 */
export async function mockAlertsAPI(
  page: Page,
  options: {
    alerts?: AlertDto[];
    userMe?: UserMeDto;
    alertsStatus?: number;
  } = {},
): Promise<void> {
  const alerts = options.alerts ?? DEFAULT_ALERTS;
  const userMe = options.userMe ?? DEFAULT_USER_ME;
  const alertsStatus = options.alertsStatus ?? 200;

  await page.route(`${BACKEND}/api/v2/alerts`, (route) => {
    const method = route.request().method();
    if (method === "GET") {
      if (alertsStatus !== 200) {
        route.fulfill({ status: alertsStatus, body: "Unauthorized" });
        return;
      }
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ alerts, total: alerts.length }),
      });
    } else if (method === "POST") {
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(alerts[0] ?? DEFAULT_ALERTS[0]),
      });
    } else {
      route.continue();
    }
  });

  await page.route(`${BACKEND}/oauth2/account/me`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(userMe),
    });
  });

  await page.route(
    `${BACKEND}/oauth2/.well-known/openid-configuration`,
    (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(OIDC_CONFIG),
      });
    },
  );
}

/** Mock DELETE /api/v2/alerts/:id */
export async function mockDeleteAlert(page: Page): Promise<void> {
  await page.route(`${BACKEND}/api/v2/alerts/**`, (route) => {
    if (route.request().method() === "DELETE") {
      route.fulfill({ status: 204 });
    } else {
      route.continue();
    }
  });
}

/** Mock PUT /api/v2/alerts/:id/notify-emails */
export async function mockUpdateNotifyEmails(
  page: Page,
  updatedAlert: AlertDto,
): Promise<void> {
  await page.route(`${BACKEND}/api/v2/alerts/*/notify-emails`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(updatedAlert),
    });
  });
}

// ---------------------------------------------------------------------------
// Custom fixtures
// ---------------------------------------------------------------------------

type E2EFixtures = {
  authedPage: Page;
};

export const test = base.extend<E2EFixtures>({
  authedPage: async ({ page }, use) => {
    await injectAuthTokens(page);
    await use(page);
  },
});
