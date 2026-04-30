const { BasePage } = require("./BasePage");

/**
 * OTP step — still under /login on QA; heading "Verify OTP".
 */
class OtpPage extends BasePage {
  constructor(page) {
    super(page);

    this.headingVerifyOtp = page.getByRole("heading", { name: "Verify OTP" });
    this.instructionLine = page.getByText("Enter the code sent to your email.");
    this.promptWithEmail = page.getByText(/Enter the OTP sent to/i);

    this.resendButton = page.getByRole("button", { name: /Resend/i });
    this.resendAttemptsText = page.getByText(/OTP resend attempts left/i);
    this.resendCooldownText = page.getByText(/Resend OTP in/i);

    /** Read-only email field on OTP step */
    this.emailFieldOnOtpStep = page
      .getByRole("textbox", { name: /Email ID/i })
      .or(page.locator('input[readonly][type="text"], input[readonly][type="email"]'));

    this.otpDigitInputs = page.locator(
      'input[inputmode="numeric"], input[type="tel"], input[autocomplete="one-time-code"]'
    );

    this.continueButton = page.getByRole("button", { name: "Continue" });

    this.contactSupportTrigger = page.getByText("Contact Support");
    this.incorrectOtpMessage = page.getByText(/Incorrect OTP/i);
    this.exhaustedAttemptsMessage = page.getByText(/exhausted your 3 login attempts/i);
  }

  async expectLoaded() {
    await this.headingVerifyOtp.waitFor({ state: "visible", timeout: 30_000 });
  }

  /**
   * @param {string} otp
   */
  async fillOtp(otp) {
    const digits = otp.replace(/\D/g, "").slice(0, 6);
    const inputs = this.page.locator(
      'input[inputmode="numeric"], input[type="tel"], input[autocomplete="one-time-code"]'
    );
    const n = await inputs.count();
    if (n >= 6) {
      for (let i = 0; i < 6; i++) {
        await inputs.nth(i).fill(digits[i] ?? "");
      }
      return;
    }
    if (n === 1) {
      await inputs.first().fill(digits);
      return;
    }
    const fallback = this.page.locator("input").filter({ hasNot: this.page.locator('[name="email"]') });
    const fc = await fallback.count();
    if (fc >= 6) {
      for (let i = 0; i < 6; i++) {
        await fallback.nth(i).fill(digits[i] ?? "");
      }
      return;
    }
    await this.page.getByRole("textbox").last().fill(digits);
  }

  async clearOtpFields() {
    const inputs = this.otpDigitInputs;
    const n = await inputs.count();
    for (let i = 0; i < Math.min(n, 6); i++) {
      await inputs.nth(i).clear();
    }
  }

  /**
   * Where the user’s email appears on the OTP step.
   * MUI/React often does not mirror the value into `input[value="…"]`, so avoid that selector.
   *
   * @param {string} email
   */
  displayedEmail(email) {
    const asText = this.page.getByText(email, { exact: true });
    const asEmailField = this.page.getByRole("textbox", { name: /Email ID/i });
    return asText.or(asEmailField);
  }

  /**
   * Valid OTP triggers verify API and redirect/navigation to dashboard — no Continue click.
   * Waits for either leaving `/login` or the OTP step disappearing (SPA variants).
   * @param {number} [timeoutMs]
   */
  async waitForRedirectAwayFromLoginOtpStep(timeoutMs = 45_000) {
    const urlLeavesLogin = this.page.waitForURL(
      (url) => {
        const path = new URL(url).pathname.replace(/\/$/, "") || "/";
        return path !== "/login";
      },
      { timeout: timeoutMs }
    );
    const otpStepGone = this.headingVerifyOtp.waitFor({ state: "hidden", timeout: timeoutMs });
    await Promise.race([urlLeavesLogin, otpStepGone]);
  }
}

module.exports = { OtpPage };
