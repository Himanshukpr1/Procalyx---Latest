const testData = require("../../data/test-data");
const { goToOtpScreenWithRetry } = require("./otp-flow");

/**
 * Email (`test-data.js` validEmail) → OTP → app past `/login`. Caller keeps `page` open.
 *
 * @param {import('@playwright/test').Page} page
 */
async function performOtpLoginOnPage(page) {
  const r = await goToOtpScreenWithRetry(page, testData.login.validEmail, {
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
}

module.exports = { performOtpLoginOnPage };
