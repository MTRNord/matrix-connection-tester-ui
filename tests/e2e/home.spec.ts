import { test, expect } from "./fixtures.ts";

test.describe("home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders page title", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Matrix Connectivity Tester");
  });

  test("renders server name input", async ({ page }) => {
    const input = page.locator("#homeserver");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "text");
    await expect(input).toHaveAttribute("required", "");
  });

  test("renders run tests button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Run Tests" }),
    ).toBeVisible();
  });

  test("renders statistics opt-in checkbox", async ({ page }) => {
    const checkbox = page.locator(
      'input[type="checkbox"][name="includeInStatistics"]',
    );
    await expect(checkbox).toBeVisible();
  });

  test("submitting with a valid domain redirects to results", async ({
    page,
  }) => {
    await page.fill("#homeserver", "matrix.org");
    await page.getByRole("button", { name: "Run Tests" }).click();
    await page.waitForURL(/\/results\?serverName=/);
    expect(page.url()).toContain("serverName=matrix.org");
  });

  test("submitting with an IPv4 literal redirects to results", async ({
    page,
  }) => {
    await page.fill("#homeserver", "192.168.1.1");
    await page.getByRole("button", { name: "Run Tests" }).click();
    await page.waitForURL(/\/results\?serverName=/);
    expect(page.url()).toContain("serverName=192.168.1.1");
  });

  test("input is required — empty submission stays on home page", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Run Tests" }).click();
    // Browser required validation prevents navigation
    await expect(page).toHaveURL("/");
  });

  test("details section is collapsed by default", async ({ page }) => {
    const details = page.locator("details.govuk-details");
    await expect(details).not.toHaveAttribute("open");
  });

  test("details section can be expanded", async ({ page }) => {
    const summary = page.locator("details.govuk-details summary");
    await summary.click();
    await expect(page.locator("details.govuk-details")).toHaveAttribute("open");
  });

  test("hint text is visible", async ({ page }) => {
    await expect(page.locator("#homeserver-hint")).toBeVisible();
  });
});
