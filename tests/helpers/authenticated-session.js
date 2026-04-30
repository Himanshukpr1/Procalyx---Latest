const { expect } = require("@playwright/test");
const env = require("../../data/AP SuperAdmin/env");
const { urlPathIsLoginPage, isKamOperatorProfile } = require("../../data/AP SuperAdmin/auth-profiles");
const { performOtpLoginOnPage } = require("./otp-login");

const SHELL_TIMEOUT_MS = 90_000;

/**
 * HKAM / MKAM: same bar as dashboard.smoke — not stuck on the login path (no strict `/hkam` requirement).
 */
async function expectHkamAuthenticatedShell(page) {
  await expect(async () => {
    expect(urlPathIsLoginPage(page.url())).toBe(false);
  }).toPass({ timeout: SHELL_TIMEOUT_MS });
}

/**
 * Open app home (`env.appHomePath`); if session missing/expired, OTP login once.
 * HKAM / MKAM: never uses UserManagementPage; post-login assertion matches dashboard smoke (not on login path).
 *
 * @param {import('@playwright/test').Page} page
 */
async function ensureAuthenticatedSession(page) {
  await page.goto(env.appHomePath, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("domcontentloaded");

  if (urlPathIsLoginPage(page.url())) {
    await performOtpLoginOnPage(page);
  }

  await expect(async () => {
    expect(urlPathIsLoginPage(page.url())).toBe(false);
  }).toPass({ timeout: SHELL_TIMEOUT_MS });

  if (isKamOperatorProfile()) {
    await expectHkamAuthenticatedShell(page);
    return;
  }

  const { UserManagementPage } = require("../pages/AP SuperAdmin/UserManagementPage");
  const um = new UserManagementPage(page);
  await um.expectSessionShowsAdminUser();
}

module.exports = { ensureAuthenticatedSession };
