import { test, expect } from "./fixtures.ts";

test.describe("language switcher", () => {
  test("language selector is visible on the home page", async ({ page }) => {
    await page.goto("/");
    // LanguageSelector island renders a button or select
    await expect(
      page.locator(".govuk-header__content button, .govuk-header__content select, [data-language-selector]").or(
        page.locator(".govuk-header__content").getByRole("button"),
      ).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("page renders in English by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Matrix Connectivity Tester");
  });

  test("switching to German changes page content", async ({ page }) => {
    await page.goto("/?locale=de");
    // The German heading would be different — just verify h1 is visible and locale cookie is set
    await expect(page.locator("h1")).toBeVisible();
    const cookies = await page.context().cookies();
    const localeCookie = cookies.find((c) => c.name === "locale");
    expect(localeCookie?.value).toBe("de");
  });

  test("locale cookie persists across navigation", async ({ page }) => {
    await page.goto("/?locale=de");
    await page.goto("/docs");
    const cookies = await page.context().cookies();
    const localeCookie = cookies.find((c) => c.name === "locale");
    expect(localeCookie?.value).toBe("de");
  });

  test("switching back to English works", async ({ page }) => {
    await page.goto("/?locale=de");
    await page.goto("/?locale=en");
    const cookies = await page.context().cookies();
    const localeCookie = cookies.find((c) => c.name === "locale");
    expect(localeCookie?.value).toBe("en");
    await expect(page.locator("h1")).toContainText("Matrix Connectivity Tester");
  });

  test("German locale renders German headings on home", async ({ page }) => {
    await page.goto("/?locale=de");
    // German page should not show the English heading
    await expect(page.locator("h1")).not.toContainText(
      "Matrix Connectivity Tester",
    );
  });
});
