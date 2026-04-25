import { test, expect } from "./fixtures.ts";
import { mockAlertsAPI } from "./fixtures.ts";
import AxeBuilder from "@axe-core/playwright";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function checkA11y(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .exclude(".govuk-skip-link") // skip link is intentionally visually hidden
    .analyze();
  expect(results.violations).toEqual([]);
}

test.describe("accessibility — WCAG 2.1 AA", () => {
  test("home page passes axe", async ({ page }) => {
    await page.goto("/");
    await checkA11y(page);
  });

  test("docs index passes axe", async ({ page }) => {
    await page.goto("/docs");
    await checkA11y(page);
  });

  test("federation setup docs page passes axe", async ({ page }) => {
    await page.goto("/docs/federation-setup");
    await checkA11y(page);
  });

  test("statistics page passes axe", async ({ page }) => {
    await page.goto("/statistics");
    // Give SSR-fetched data time to load
    await page.waitForLoadState("networkidle");
    await checkA11y(page);
  });

  test("alerts page (unauthenticated) passes axe", async ({ page }) => {
    await page.goto("/alerts");
    // Wait for island to settle on the unauthenticated state
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible({
      timeout: 10_000,
    });
    await checkA11y(page);
  });

  test("alerts page (authenticated with alerts) passes axe", async ({
    authedPage: page,
  }) => {
    await mockAlertsAPI(page);
    await page.goto("/alerts");
    await expect(
      page.locator("h2", { hasText: "Your alerts" }),
    ).toBeVisible({ timeout: 10_000 });
    await checkA11y(page);
  });

  test("alerts page (authenticated, empty list) passes axe", async ({
    authedPage: page,
  }) => {
    await mockAlertsAPI(page, { alerts: [] });
    await page.goto("/alerts");
    await expect(
      page.locator(".govuk-inset-text"),
    ).toBeVisible({ timeout: 10_000 });
    await checkA11y(page);
  });

  test("404 page passes axe", async ({ page }) => {
    await page.goto("/this-does-not-exist-xyz");
    await checkA11y(page);
  });
});
