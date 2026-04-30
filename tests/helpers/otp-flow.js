const { LoginPage } = require("../pages/AP SuperAdmin/LoginPage");
const { OtpPage } = require("../pages/AP SuperAdmin/OtpPage");
const { waitForOtpInResponse } = require("../../utils/otp-api");
const env = require("../../data/AP SuperAdmin/env");

/** Wall-clock delay without tying to Playwright page lifecycle (cooldown backoff survives headed/debug closes). */
function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Cooldown / throttling on the email step (Verify OTP not shown yet) */
function otpRateLimitedLocator(page) {
  return page.getByText(
    /Please wait \d+ seconds before requesting a new OTP|Maximum OTP requests exceeded|reached the limit of \d+ OTPs/i
  );
}

/**
 * Email Continue → OTP screen. Optionally captures `"otp": "908943"` from a JSON API response.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {{ captureOtp?: boolean }} [opts]
 */
async function goToOtpScreen(page, email, opts = {}) {
  const loginPage = new LoginPage(page);
  let otpPromise = null;
  if (opts.captureOtp) {
    otpPromise = waitForOtpInResponse(page).catch(() => null);
  }
  await loginPage.open("/login");
  await loginPage.fillEmail(email);
  await loginPage.submitContinue();

  const otpPage = new OtpPage(page);
  const blocked = otpRateLimitedLocator(page);
  await Promise.race([
    otpPage.headingVerifyOtp.waitFor({ state: "visible", timeout: 45_000 }),
    blocked.waitFor({ state: "visible", timeout: 45_000 }),
  ]);

  if (await blocked.isVisible().catch(() => false)) {
    return { loginPage, otpPage, otp: null, cooldown: true };
  }

  let otp = null;
  if (opts.captureOtp && otpPromise) {
    otp = await otpPromise;
  }
  return { loginPage, otpPage, otp, cooldown: false };
}

/**
 * Retries when QA shows OTP rate limit (same user, backoff between attempts).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {{ captureOtp?: boolean; maxAttempts?: number; backoffMs?: number }} [opts]
 */
async function goToOtpScreenWithRetry(page, email, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 4;
  const backoffMs = opts.backoffMs ?? 25_000;
  const { captureOtp } = opts;

  /** @type {Awaited<ReturnType<typeof goToOtpScreen>> | null} */
  let last = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = await goToOtpScreen(page, email, { captureOtp });
    if (!last.cooldown) {
      return last;
    }
    if (attempt === maxAttempts) {
      return last;
    }
    console.warn(
      `[otp-flow] OTP rate limit / cooldown — waiting ${Math.round(backoffMs / 1000)}s before retry (${attempt}/${maxAttempts})…`
    );
    await sleepMs(backoffMs);
    await page.goto(`${env.baseUrl}/login`, { waitUntil: "domcontentloaded" });
  }
  return /** @type {typeof last} */ (last);
}

module.exports = { goToOtpScreen, goToOtpScreenWithRetry, otpRateLimitedLocator };
