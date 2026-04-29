const { isKamOperatorProfile } = require("../../data/auth-profiles");
const { LoginPage } = require("../pages/LoginPage");

/**
 * HKAM / MKAM: after OTP, the app can stay on `/login` with a unit selector — **My Dashboard** → **Continue**.
 * HKAM: **Select Hospital Unit Name**; MKAM: **Select Manufacturer Unit Name**.
 *
 * No-op for other `AUTH_PROFILE` values.
 *
 * @param {import('@playwright/test').Page} page
 */
async function applyPostOtpHkamContextIfNeeded(page) {
  if (!isKamOperatorProfile()) {
    return;
  }
  const loginPage = new LoginPage(page);
  await loginPage.completePostOtpKamContextStep();
}

module.exports = { applyPostOtpHkamContextIfNeeded };
