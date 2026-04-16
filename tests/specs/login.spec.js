const { test, expect } = require("../fixtures/base");
const env = require("../../data/env");
const testData = require("../../data/test-data");
const { LoginPage } = require("../pages/LoginPage");
const { OtpPage } = require("../pages/OtpPage");
const { goToOtpScreenWithRetry } = require("../helpers/otp-flow");
const { saveLoggedInSession } = require("../helpers/auth-storage");

/**
 * One browser + one tab for this file: shared `context` / `page` (headed mode opens once).
 * Use `--workers=1` if you still see multiple windows (parallel workers).
 */
test.describe("Login", () => {
  test.describe.configure({ mode: "serial" });

  /** @type {import('@playwright/test').BrowserContext} */
  let context;
  /** @type {import('@playwright/test').Page} */
  let page;
  /** @type {LoginPage} */
  let loginPage;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({ baseURL: env.baseUrl });
    page = await context.newPage();
    loginPage = new LoginPage(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe("Login — email (TC 01–04)", () => {
    test.beforeEach(async () => {
      await loginPage.open(env.loginPath);
    });

    test("TC 01 — @sanity — user is able to navigate to URL", { tag: "@sanity" }, async () => {
      await expect(page).toHaveURL(/\/login\/?$/);
    });

    test("TC 02 — visibility of Email address field and Continue button", async () => {
      await expect(loginPage.emailFieldLabel).toBeVisible();
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.continueButton).toBeVisible();
    });

    test("TC 03 — Continue without email: user cannot proceed", async () => {
      await loginPage.submitContinue();
      await expect(page).toHaveURL(/\/login/);
      await expect(loginPage.emailInput).toBeVisible();
      const alert = loginPage.validationMessage;
      const ariaInvalid = await loginPage.emailInput.getAttribute("aria-invalid");
      if (ariaInvalid === "true") {
        await expect(loginPage.emailInput).toHaveAttribute("aria-invalid", "true");
      } else if ((await alert.count()) > 0) {
        await expect(alert.first()).toBeVisible();
      } else {
        await expect(
          page.getByText(/required|enter|email|cannot be empty|field/i).first()
        ).toBeVisible();
      }
    });

    test("TC 04 — invalid email and Continue: user cannot proceed", async () => {
      await loginPage.fillEmail(testData.login.invalidEmail);
      await loginPage.submitContinue();
      await expect(page).toHaveURL(/\/login/);
      await expect(loginPage.emailInput).toBeVisible();
      const alert = loginPage.validationMessage;
      const ariaInvalid = await loginPage.emailInput.getAttribute("aria-invalid");
      if (ariaInvalid === "true") {
        await expect(loginPage.emailInput).toHaveAttribute("aria-invalid", "true");
      } else if ((await alert.count()) > 0) {
        await expect(alert.first()).toBeVisible();
      } else {
        await expect(page.getByText(/valid|invalid|email|format|@/i).first()).toBeVisible();
      }
    });
  });

  /**
   * Sanity: email → OTP → dashboard + saved session. Single OTP request for TC 05–08.
   * Run only these: `npm run test:sanity`
   */
  test.describe("@sanity Login — TC 05–08 (single OTP session)", { tag: "@sanity" }, () => {
    test.setTimeout(180_000);

    /** @type {OtpPage} */
    let otpPage;
    /** @type {string | null} */
    let capturedOtp;

    test.beforeAll(async () => {
      const r = await goToOtpScreenWithRetry(page, testData.login.validEmail, {
        captureOtp: true,
        maxAttempts: 4,
        backoffMs: 25_000,
      });

      if (r.cooldown) {
        throw new Error(
          "Still rate-limited after retries. Wait for QA cooldown, or use another LOGIN_TEST_EMAIL, then re-run."
        );
      }

      otpPage = r.otpPage;
      const fromApi = r.otp;
      const manual = testData.login.manualOtp?.trim();
      capturedOtp = fromApi || manual || null;

      if (!capturedOtp) {
        throw new Error(
          'No OTP captured from API and LOGIN_OTP is unset. Set LOGIN_OTP=xxxxxx or ensure responses include "otp": "908943".'
        );
      }
    });

    test("TC 05 — valid email and Continue: user proceeds to OTP step", async () => {
      await expect(otpPage.headingVerifyOtp).toBeVisible();
    });

    test("TC 06 — Verify the email id that is visible is correct", async () => {
      const email = testData.login.validEmail;
      await expect(otpPage.displayedEmail(email)).toBeVisible();
      await expect(otpPage.promptWithEmail).toContainText(email);
      const emailBox = page.getByRole("textbox", { name: /Email ID/i });
      if (await emailBox.isVisible()) {
        await expect(emailBox).toHaveValue(email);
      }
    });

    test("TC 07 — Continue is disabled until user enters the OTP", async () => {
      await otpPage.clearOtpFields();
      await expect(otpPage.continueButton).toBeDisabled();
      await otpPage.fillOtp("1");
      await expect(otpPage.continueButton).toBeDisabled();
      await otpPage.clearOtpFields();
      await otpPage.fillOtp("12345");
      await expect(otpPage.continueButton).toBeDisabled();
      await otpPage.clearOtpFields();
    });

    test("TC 08 — Correct OTP from API allows user to login", async () => {
      expect(capturedOtp).toBeTruthy();
      await otpPage.fillOtp(capturedOtp);
      await otpPage.waitForRedirectAwayFromLoginOtpStep(45_000);
      await expect(otpPage.headingVerifyOtp).toBeHidden({ timeout: 10_000 });
      await expect(page).not.toHaveURL(/\/login\/?$/);
      await saveLoggedInSession(page.context());
    });
  });
});
