import { test, expect } from "./fixtures.ts";
import { mockAlertsAPI, mockDeleteAlert } from "./fixtures.ts";
import { DEFAULT_ALERTS } from "./helpers/mock-data.ts";

test.describe("alerts page — unauthenticated", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/alerts");
  });

  test("shows page heading", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Server Alerts");
  });

  test("shows sign in button when not logged in", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Sign in" }),
    ).toBeVisible();
  });

  test("does not show alerts table when unauthenticated", async ({ page }) => {
    await expect(page.locator(".govuk-table")).toHaveCount(0);
  });
});

test.describe("alerts page — authenticated", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await mockAlertsAPI(page);
    await page.goto("/alerts");
    // Wait for the island to hydrate and show the authenticated view
    await expect(
      page.locator("h2", { hasText: "Your alerts" }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows alerts table with correct columns", async ({
    authedPage: page,
  }) => {
    const table = page.locator(".govuk-table");
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Server name" }))
      .toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Status" }))
      .toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Notifications" }))
      .toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Actions" }))
      .toBeVisible();
  });

  test("shows alert server names", async ({ authedPage: page }) => {
    await expect(page.getByText("matrix.example.com")).toBeVisible();
    await expect(page.getByText("failing.example.com")).toBeVisible();
  });

  test("shows Active tag for verified alert", async ({ authedPage: page }) => {
    const firstRow = page.locator(".govuk-table__row").nth(1);
    await expect(firstRow.locator(".govuk-tag--green")).toContainText("Active");
  });

  test("shows Pending tag for unverified alert", async ({
    authedPage: page,
  }) => {
    const secondRow = page.locator(".govuk-table__row").nth(2);
    await expect(secondRow.locator(".govuk-tag--yellow")).toContainText(
      "Pending",
    );
  });

  test("shows Failing tag for currently failing alert", async ({
    authedPage: page,
  }) => {
    const secondRow = page.locator(".govuk-table__row").nth(2);
    await expect(secondRow.locator(".govuk-tag--red")).toContainText("Failing");
  });

  test("shows notification emails in the table", async ({
    authedPage: page,
  }) => {
    await expect(page.getByText("user@example.com")).toBeVisible();
  });

  test("shows sign out button", async ({ authedPage: page }) => {
    await expect(
      page.getByRole("button", { name: "Sign out" }),
    ).toBeVisible();
  });

  test("shows add alert form", async ({ authedPage: page }) => {
    await expect(
      page.locator("h2", { hasText: "Add a new alert" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add alert" }),
    ).toBeVisible();
  });
});

test.describe("alerts — empty list", () => {
  test("shows empty state message when no alerts", async ({
    authedPage: page,
  }) => {
    await mockAlertsAPI(page, { alerts: [] });
    await page.goto("/alerts");
    await expect(
      page.locator(".govuk-inset-text", {
        hasText: "You have no alerts set up yet.",
      }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("alerts — delete flow", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await mockAlertsAPI(page);
    await mockDeleteAlert(page);
    await page.goto("/alerts");
    await expect(
      page.locator("h2", { hasText: "Your alerts" }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("opens delete confirmation dialog when Delete is clicked", async ({
    authedPage: page,
  }) => {
    await page.getByRole("button", { name: "Delete" }).first().click();
    const dialog = page.locator("dialog.alert-delete-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("#delete-dialog-title")).toContainText(
      "Confirm deletion",
    );
  });

  test("dialog contains server name of alert to delete", async ({
    authedPage: page,
  }) => {
    await page.getByRole("button", { name: "Delete" }).first().click();
    const dialog = page.locator("dialog.alert-delete-dialog");
    await expect(dialog).toContainText(DEFAULT_ALERTS[0].server_name);
  });

  test("cancelling dialog closes it without deleting", async ({
    authedPage: page,
  }) => {
    await page.getByRole("button", { name: "Delete" }).first().click();
    const dialog = page.locator("dialog.alert-delete-dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).not.toBeVisible();
    // Table still shows both alerts
    await expect(page.getByText("matrix.example.com")).toBeVisible();
  });

  test("confirming deletion removes the alert from the list", async ({
    authedPage: page,
  }) => {
    await page.getByRole("button", { name: "Delete" }).first().click();
    const dialog = page.locator("dialog.alert-delete-dialog");
    await dialog.getByRole("button", { name: "Delete alert" }).click();

    // Island removes the alert from local state — no refetch needed
    await expect(page.getByText("matrix.example.com")).not.toBeVisible({
      timeout: 8_000,
    });
  });
});

test.describe("alerts — add alert", () => {
  test("adding a new alert shows success message", async ({
    authedPage: page,
  }) => {
    await mockAlertsAPI(page);
    await page.goto("/alerts");
    await expect(
      page.locator("h2", { hasText: "Your alerts" }),
    ).toBeVisible({ timeout: 10_000 });

    await page.fill("#add-server-name", "new.example.com");
    await page.getByRole("button", { name: "Add alert" }).click();

    await expect(
      page.locator(".govuk-notification-banner--success"),
    ).toContainText("Alert added successfully", { timeout: 8_000 });
  });
});
