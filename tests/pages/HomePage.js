const { BasePage } = require("./BasePage");

/**
 * Example page object — replace selectors with your Procalyx UI.
 */
class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.getByRole("heading", { level: 1 });
  }

  async open() {
    await this.goto("/");
  }
}

module.exports = { HomePage };
