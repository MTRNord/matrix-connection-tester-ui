import { test, expect, type Page } from "@playwright/test";

/** Click the mobile nav toggle if it is visible (mobile viewport only). */
async function openNavIfMobile(page: Page): Promise<void> {
  const toggle = page.locator(".govuk-js-service-navigation-toggle");
  const isVisible = await toggle.isVisible();
  if (isVisible) {
    await toggle.click();
    // Wait briefly for the nav list to expand
    await page.locator("#navigation").waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
  }
}

test.describe("navigation", () => {
  test("header shows service name", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".govuk-header__homepage-link")).toContainText(
      "Connectivity Tester",
    );
  });

  test.describe("nav links", () => {
    const pages = [
      { path: "/", label: "Home" },
      { path: "/alerts", label: "Alerts" },
      { path: "/docs", label: "Documentation" },
      { path: "/statistics", label: "Statistics" },
    ];

    for (const { path, label } of pages) {
      test(`"${label}" link is present`, async ({ page }) => {
        await page.goto(path);
        await openNavIfMobile(page);
        const nav = page.locator(".govuk-service-navigation__list");
        await expect(nav.getByText(label)).toBeVisible();
      });

      test(`active nav item has aria-current="page" on ${path}`, async ({
        page,
      }) => {
        await page.goto(path);
        const activeLink = page.locator(
          `.govuk-service-navigation__link[aria-current="page"]`,
        );
        await expect(activeLink).toContainText(label);
      });
    }

    test("non-active nav items do not have aria-current", async ({ page }) => {
      await page.goto("/");
      const otherLinks = page.locator(
        `.govuk-service-navigation__link:not([aria-current])`,
      );
      // Should be 3 links without aria-current (Alerts, Documentation, Statistics)
      await expect(otherLinks).toHaveCount(3);
    });
  });

  test.describe("breadcrumbs", () => {
    test("results page shows breadcrumb with Home link", async ({ page }) => {
      await page.goto("/results?serverName=matrix.org");
      const breadcrumbs = page.locator(".govuk-breadcrumbs");
      await expect(breadcrumbs).toBeVisible();
      await expect(breadcrumbs.getByRole("link", { name: "Home" })).toBeVisible();
    });

    test("top-level pages do not show Back link", async ({ page }) => {
      for (const path of ["/", "/alerts", "/docs", "/statistics"]) {
        await page.goto(path);
        await expect(page.locator(".govuk-back-link")).toHaveCount(0);
      }
    });
  });

  test("404 page shows not-found content and returns 404 status", async ({ page }) => {
    const response = await page.goto("/this-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toContainText("Page not found");
  });

  test("skip link is present and points to main content", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator(".govuk-skip-link");
    await expect(skipLink).toHaveAttribute("href", "#main-content");
  });
});
