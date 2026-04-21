const { expect } = require("@playwright/test");
const { performOtpLoginOnPage } = require("./otp-login");
const { UserManagementPage } = require("../pages/UserManagementPage");

/**
 * TC01 — open dashboard; if session missing/expired (`/login`), complete OTP once.
 * Works with `getStorageStateForAuthenticatedSuite()` so parallel runs skip OTP when `.auth/qa-session.json` is valid.
 *
 * @param {import('@playwright/test').Page} page
 */
async function ensureAuthenticatedSession(page) {
  await page.goto("/dashboard");
  await page.waitForLoadState("domcontentloaded");
  if (/\/login/i.test(page.url())) {
    await performOtpLoginOnPage(page);
  }
  await expect(page).not.toHaveURL(/\/login/);
  const um = new UserManagementPage(page);
  await um.expectSessionShowsAdminUser();
}

module.exports = { ensureAuthenticatedSession };
