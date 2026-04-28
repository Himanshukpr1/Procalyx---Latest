const { getLoginEmailForAuth } = require("../../data/auth-profiles");
const testData = require("../../data/test-data");
const { goToOtpScreenWithRetry } = require("./otp-flow");
const { applyPostOtpHkamContextIfNeeded } = require("./post-otp-hkam-context");

/**
 * Email from `getLoginEmailForAuth()` (`AUTH_PROFILE` / `LOGIN_TEST_EMAIL` / `LOGIN_OPERATOR_EMAIL`) → OTP → past `/login`.
 *
 * @param {import('@playwright/test').Page} page
 */
async function performOtpLoginOnPage(page) {
  const email = getLoginEmailForAuth();
  const r = await goToOtpScreenWithRetry(page, email, {
    captureOtp: true,
    maxAttempts: 4,
    backoffMs: 25_000,
  });

  if (r.cooldown) {
    throw new Error(
      "OTP rate-limited. Wait for QA cooldown or set LOGIN_TEST_EMAIL, then re-run."
    );
  }

  const otp = r.otp || testData.login.manualOtp?.trim();
  if (!otp) {
    throw new Error(
      'No OTP from API. Set LOGIN_OTP=xxxxxx or ensure responses include "otp": "908943".'
    );
  }

  await r.otpPage.fillOtp(otp);
  await r.otpPage.waitForRedirectAwayFromLoginOtpStep(60_000);
  await applyPostOtpHkamContextIfNeeded(page);
}

module.exports = { performOtpLoginOnPage };
