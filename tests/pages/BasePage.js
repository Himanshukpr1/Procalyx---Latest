/**
 * Base page object — extend for each app area.
 */

class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async goto(path = "/") {
    await this.page.goto(path);
  }
}

module.exports = { BasePage };
