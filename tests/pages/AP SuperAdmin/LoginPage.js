const { expect } = require("@playwright/test");
const { getAuthProfile } = require("../../../data/AP SuperAdmin/auth-profiles");
const { BasePage } = require("./BasePage");

/**
 * Procalyx QA login — https://qa.procalyx.net/login
 *
 * Locators follow the live a11y tree: email uses placeholder as accessible name;
 * "Email ID" is plain text (not wired to the input); footer actions are clickable
 * generics, not native links.
 */
class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    // ——— Right panel (form) ———
    this.headingLogIn = page.getByRole("heading", { name: "Log in" });
    this.subtitle = page.getByText("Please enter your login details.");
    /** Visual label only — not associated with the input for aria-labelledby */
    this.emailFieldLabel = page.getByText("Email ID", { exact: true });
    /** Accessible name comes from placeholder "you@example.com" */
    this.emailInput = page.getByRole("textbox", { name: "you@example.com" });
    /**
     * HKAM: after OTP — **Select Hospital Unit Name** (MUI combobox / placeholder).
     */
    this.hospitalUnitCombobox = page
      .getByRole("combobox", { name: /select hospital unit name/i })
      .or(page.getByPlaceholder(/select hospital unit name/i));
    /**
     * MKAM: after OTP — **Select Manufacturer Unit Name** (same **My Dashboard** → **Continue** pattern as HKAM).
     */
    this.manufacturerUnitCombobox = page
      .getByRole("combobox", { name: /select manufacturer unit name/i })
      .or(page.getByPlaceholder(/select manufacturer unit name/i));
    this.continueButton = page.getByRole("button", { name: "Continue" });

    this.validationMessage = page.locator('[role="alert"]');

    // ——— Support & legal (rendered as generic / text, not <a href>) ———
    this.havingProblemsLine = page.getByText("Having problems? Contact Support");
    this.contactSupportTrigger = page.getByText("Contact Support");
    this.termsOfUseTrigger = page.getByText("Terms of Use", { exact: true });
    this.privacyPolicyTrigger = page.getByText("Privacy Policy", { exact: true });

    // ——— Left panel ———
    /** Must be exact — "Welcome to Procalyx" also matches fuzzy name queries */
    this.brandHeading = page.getByRole("heading", { name: "PROCALYX", exact: true });
    this.welcomeHeading = page.getByRole("heading", { name: "Welcome to Procalyx" });
    this.welcomeDescription = page.getByText(
      "Streamline your procurement process with intelligent insights and automation."
    );
  }

  /** @param {string} [path] */
  async open(path = "/login") {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
    await this.emailInput.waitFor({ state: "visible", timeout: 30_000 });
  }

  /**
   * @param {string} email
   */
  async fillEmail(email) {
    const input = this.emailInput.or(this.page.getByPlaceholder("you@example.com"));
    await input.waitFor({ state: "visible", timeout: 30_000 });
    await input.fill(email);
  }

  /**
   * HKAM / MKAM — **after OTP**: stay on `/login` with unit selector — **My Dashboard** → **Continue**.
   * HKAM: **Select Hospital Unit Name**; MKAM: **Select Manufacturer Unit Name**.
   */
  async completePostOtpKamContextStep() {
    const combo =
      getAuthProfile() === "mkam_operator" ? this.manufacturerUnitCombobox : this.hospitalUnitCombobox;
    await combo.first().waitFor({ state: "visible", timeout: 25_000 });
    await combo.first().click();
    const myDashboard = this.page.getByRole("option", { name: /^My Dashboard$/i });
    await myDashboard.first().waitFor({ state: "visible", timeout: 15_000 });
    await myDashboard.first().click();
    await expect(async () => {
      expect(await this.continueButton.isEnabled()).toBe(true);
    }).toPass({ timeout: 15_000 });
    await this.continueButton.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /** @deprecated Use `completePostOtpKamContextStep` — kept for callers that reference HKAM-only naming. */
  async completeHkamPostOtpHospitalUnitStep() {
    return this.completePostOtpKamContextStep();
  }

  async submitContinue() {
    await this.continueButton.click();
  }
}

module.exports = { LoginPage };
