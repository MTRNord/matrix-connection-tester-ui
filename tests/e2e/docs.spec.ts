import { test, expect } from "./fixtures.ts";

test.describe("documentation", () => {
  test("index renders page heading", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.locator("h1")).toContainText("Documentation");
  });

  test("index shows section cards", async ({ page }) => {
    await page.goto("/docs");
    // Docs index should have at least one heading or card
    const cards = page.locator(".govuk-card, .govuk-summary-card, h2, h3");
    await expect(cards.first()).toBeVisible();
  });

  test("index shows Getting Started section", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.getByRole("link", { name: "Getting Started" })).toBeVisible();
  });

  test("index shows Configuration section", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.getByRole("link", { name: "Configuration", exact: true })).toBeVisible();
  });

  test("federation setup sub-page renders correctly", async ({ page }) => {
    await page.goto("/docs/federation-setup");
    await expect(page.locator("h1")).toContainText(
      "Matrix Federation Setup",
    );
  });

  test("sub-page shows breadcrumb with docs index link", async ({ page }) => {
    await page.goto("/docs/federation-setup");
    const breadcrumbs = page.locator(".govuk-breadcrumbs");
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs.getByRole("link", { name: "Documentation" })).toBeVisible();
  });

  test("non-existent doc page returns 404", async ({ page }) => {
    const response = await page.goto("/docs/this-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
  });
});
