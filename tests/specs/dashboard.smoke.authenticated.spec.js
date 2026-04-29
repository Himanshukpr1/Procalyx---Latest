/**
 * Post-login smoke — session file for the active `AUTH_PROFILE` (e.g. from login @sanity TC 08).
 * HKAM / MKAM home: `/hkam`; Super Admin / others: `/dashboard`.
 */
const { test, expect } = require("@playwright/test");
const env = require("../../data/env");

test("dashboard — not redirected to login when session exists", { tag: "@dashboard-smoke" }, async ({ page }) => {
  await page.goto(env.appHomePath, { waitUntil: "domcontentloaded" });
  const { urlPathIsLoginPage } = require("../../data/auth-profiles");
  await expect(async () => {
    expect(urlPathIsLoginPage(page.url())).toBe(false);
  }).toPass({ timeout: 60_000 });
});
