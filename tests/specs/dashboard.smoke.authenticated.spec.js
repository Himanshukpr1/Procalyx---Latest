/**
 * Post-login smoke — requires `.auth/qa-session.json` (e.g. from login @sanity TC 08).
 */
const { test, expect } = require("@playwright/test");

test("dashboard — not redirected to login when session exists", async ({ page }) => {
  await page.goto("/");
  await expect(page).not.toHaveURL(/\/login\/?$/);
});
