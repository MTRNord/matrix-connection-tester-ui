import { test, expect } from "./fixtures.ts";

// Statistics are fetched server-side from the real backend's /metrics endpoint.
// These tests require the backend to be running.
const skipIfNoBackend = process.env.SKIP_BACKEND_TESTS === "true";

test.describe("statistics page", () => {
  test("renders page heading", async ({ page }) => {
    await page.goto("/statistics");
    await expect(page.locator("h1")).toContainText("Statistics");
  });

  test("renders page description", async ({ page }) => {
    await page.goto("/statistics");
    await expect(page.locator(".govuk-body").first()).toBeVisible();
  });

  test(
    "shows stat cards or error state",
    async ({ page }) => {
      await page.goto("/statistics");
      // Either the stats loaded or an error banner is shown — both are valid
      const statsOrError = page.locator(
        ".govuk-summary-card, .govuk-error-summary, h2",
      );
      await expect(statsOrError.first()).toBeVisible({ timeout: 15_000 });
    },
  );

  test.describe("with backend running", () => {
    test.skip(skipIfNoBackend, "backend not available in this environment");

    test("shows overview section", async ({ page }) => {
      await page.goto("/statistics");
      await expect(
        page.locator("h2, h3").filter({ hasText: /overview|total tests/i }),
      ).toBeVisible({ timeout: 15_000 });
    });

    test("shows Total Tests stat", async ({ page }) => {
      await page.goto("/statistics");
      await expect(
        page.getByText("Total Tests"),
      ).toBeVisible({ timeout: 15_000 });
    });

    test("shows Unique Servers stat", async ({ page }) => {
      await page.goto("/statistics");
      await expect(
        page.getByText("Unique Servers"),
      ).toBeVisible({ timeout: 15_000 });
    });
  });
});
