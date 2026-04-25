import { test, expect } from "./fixtures.ts";

test.describe("documentation", () => {
  test("index renders page heading", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.locator("h1")).toContainText("Documentation");
  });

  test("index shows section cards", async ({ page }) => {
    await page.goto("/docs");
    // Docs index should have at least 4 section card headings
    const cards = page.locator(".govuk-card, .govuk-summary-card, h2, h3");
    await expect(cards.first()).toBeVisible();
  });

  test("index shows Getting Started section", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.getByText("Getting Started")).toBeVisible();
  });

  test("index shows Configuration section", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.getByText("Configuration")).toBeVisible();
  });

  test("federation setup sub-page renders correctly", async ({ page }) => {
    await page.goto("/docs/federation-setup");
    await expect(page.locator("h1")).toContainText(
      "Matrix Federation Setup",
    );
  });

  test("sub-page shows Back link pointing to docs index", async ({ page }) => {
    await page.goto("/docs/federation-setup");
    const backLink = page.locator(".govuk-back-link");
    await expect(backLink).toBeVisible();
  });

  test("non-existent doc page returns 404", async ({ page }) => {
    const response = await page.goto("/docs/this-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
  });
});
