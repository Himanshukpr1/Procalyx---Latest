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

  async submitContinue() {
    await this.continueButton.click();
  }
}

module.exports = { LoginPage };
