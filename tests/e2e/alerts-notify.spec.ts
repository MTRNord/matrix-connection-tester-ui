import { test, expect } from "./fixtures.ts";
import {
  mockAlertsAPI,
  mockUpdateNotifyEmails,
} from "./fixtures.ts";
import { DEFAULT_ALERTS, DEFAULT_USER_ME } from "./helpers/mock-data.ts";

// Alert 1 from DEFAULT_ALERTS — verified, has user@example.com as notify_email
const ALERT = DEFAULT_ALERTS[0];

// Construct the updated alert as if user@example.com + user2@example.com were added
const UPDATED_ALERT = {
  ...ALERT,
  notify_emails: ["user@example.com", "user2@example.com"],
};

test.describe("notification emails — manage panel", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await mockAlertsAPI(page, { userMe: DEFAULT_USER_ME });
    await page.goto("/alerts");
    await expect(
      page.locator("h2", { hasText: "Your alerts" }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows Manage link in notifications column", async ({
    authedPage: page,
  }) => {
    const firstRow = page.locator(".govuk-table__row").nth(1);
    await expect(firstRow.getByRole("button", { name: "Manage" })).toBeVisible();
  });

  test("notification emails are visible without clicking Manage", async ({
    authedPage: page,
  }) => {
    // The fallback email (user@example.com) should be visible in the table cell
    await expect(page.getByText("user@example.com").first()).toBeVisible();
  });

  test("clicking Manage reveals Remove buttons next to emails", async ({
    authedPage: page,
  }) => {
    const firstRow = page.locator(".govuk-table__row").nth(1);
    await firstRow.getByRole("button", { name: "Manage" }).click();
    await expect(
      firstRow.getByRole("button", { name: "Remove" }),
    ).toBeVisible();
  });

  test("clicking Manage reveals Done link", async ({ authedPage: page }) => {
    const firstRow = page.locator(".govuk-table__row").nth(1);
    await firstRow.getByRole("button", { name: "Manage" }).click();
    await expect(
      firstRow.getByRole("button", { name: "Done" }),
    ).toBeVisible();
  });

  test("clicking Done collapses the panel", async ({ authedPage: page }) => {
    const firstRow = page.locator(".govuk-table__row").nth(1);
    await firstRow.getByRole("button", { name: "Manage" }).click();
    await firstRow.getByRole("button", { name: "Done" }).click();
    await expect(
      firstRow.getByRole("button", { name: "Manage" }),
    ).toBeVisible();
    await expect(
      firstRow.getByRole("button", { name: "Done" }),
    ).not.toBeVisible();
  });

  test("addable emails are shown in select when managing", async ({
    authedPage: page,
  }) => {
    // DEFAULT_USER_ME has user@example.com (already in notify list) and
    // user2@example.com + unverified@example.com.
    // Only verified addable emails appear: user2@example.com
    const firstRow = page.locator(".govuk-table__row").nth(1);
    await firstRow.getByRole("button", { name: "Manage" }).click();
    const select = firstRow.locator("select");
    await expect(select).toBeVisible();
    await expect(select.locator("option", { hasText: "user2@example.com" }))
      .toBeVisible();
    // unverified@example.com is not verified so must not appear
    await expect(
      select.locator("option", { hasText: "unverified@example.com" }),
    ).toHaveCount(0);
  });

  test("adding an email calls PUT and updates the list", async ({
    authedPage: page,
  }) => {
    await mockUpdateNotifyEmails(page, UPDATED_ALERT);

    const firstRow = page.locator(".govuk-table__row").nth(1);
    await firstRow.getByRole("button", { name: "Manage" }).click();

    // Select user2@example.com and click Add
    const select = firstRow.locator("select");
    await select.selectOption("user2@example.com");
    await firstRow.getByRole("button", { name: "Add" }).click();

    // After update, user2@example.com should appear in the row
    await expect(firstRow.getByText("user2@example.com")).toBeVisible({
      timeout: 8_000,
    });
  });

  test("removing an email calls PUT and removes it from the list", async ({
    authedPage: page,
  }) => {
    const afterRemove = { ...ALERT, notify_emails: [] };
    await mockUpdateNotifyEmails(page, afterRemove);

    const firstRow = page.locator(".govuk-table__row").nth(1);
    await firstRow.getByRole("button", { name: "Manage" }).click();

    // Click Remove next to user@example.com
    await firstRow.getByRole("button", { name: "Remove" }).first().click();

    // user@example.com should be gone from this row
    await expect(firstRow.locator("code", { hasText: "user@example.com" }))
      .not.toBeVisible({ timeout: 8_000 });
  });

  test("failed PUT shows error message", async ({ authedPage: page }) => {
    // Mock PUT to return 403
    await page.route(
      "http://localhost:8080/api/v2/alerts/*/notify-emails",
      (route) => {
        route.fulfill({ status: 403, body: "Forbidden" });
      },
    );

    const firstRow = page.locator(".govuk-table__row").nth(1);
    await firstRow.getByRole("button", { name: "Manage" }).click();
    await firstRow.getByRole("button", { name: "Remove" }).first().click();

    await expect(
      page.locator(".govuk-error-message", {
        hasText: "Failed to update notification emails",
      }),
    ).toBeVisible({ timeout: 8_000 });
  });
});
