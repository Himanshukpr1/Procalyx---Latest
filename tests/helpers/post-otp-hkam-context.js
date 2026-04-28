const { getAuthProfile } = require("../../data/auth-profiles");
const { LoginPage } = require("../pages/LoginPage");

/**
 * HKAM: after a **successful OTP**, the app stays on `/login` with the user’s email and a
 * **Select Hospital Unit Name** dropdown — choose **My Dashboard**, then **Continue** to reach the app.
 *
 * No-op for other `AUTH_PROFILE` values.
 *
 * @param {import('@playwright/test').Page} page
 */
async function applyPostOtpHkamContextIfNeeded(page) {
  if (getAuthProfile() !== "hkam_operator") {
    return;
  }
  const loginPage = new LoginPage(page);
  await loginPage.completeHkamPostOtpHospitalUnitStep();
}

module.exports = { applyPostOtpHkamContextIfNeeded };
