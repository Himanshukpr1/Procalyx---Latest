/**
 * Post-login smoke — session file for the active `AUTH_PROFILE` (e.g. from login @sanity TC 08).
 */
const { test, expect } = require("@playwright/test");

test("dashboard — not redirected to login when session exists", { tag: "@dashboard-smoke" }, async ({ page }) => {
  await page.goto("/");
  await expect(page).not.toHaveURL(/\/login\/?$/);
});
