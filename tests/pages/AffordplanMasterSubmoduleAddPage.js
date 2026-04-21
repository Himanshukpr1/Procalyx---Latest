const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * **New …** add screens under Affordplan Master — `/dashboard/.../add` (same layout as **New Therapy**).
 */

/**
 * @typedef {{
 *   id: string,
 *   listPath: string,
 *   addPath: string,
 *   listUrlRe: RegExp,
 *   addUrlRe: RegExp,
 *   sidebarLabel: string,
 *   listHeadingRe: RegExp,
 *   addHeadingRe: RegExp,
 *   nameFieldLabelRe: RegExp,
 *   nameColumnHeaderRe: RegExp,
 * }} AffordplanSubmoduleConfig
 */

class AffordplanMasterSubmoduleAddPage extends BasePage {
  constructor(page) {
    super(page);
    this.saveButton = page.getByRole("button", { name: /^Save$/i });
  }

  /**
   * @param {AffordplanSubmoduleConfig} cfg
   */
  async expectAddFormLoaded(cfg) {
    await expect(this.page).toHaveURL(cfg.addUrlRe);
    await expect(this.page.getByRole("heading", { name: cfg.addHeadingRe }).first()).toBeVisible({ timeout: 30_000 });
  }

  /**
   * Assert **Status** defaults to **Active** (required field; no change needed for create).
   */
  async expectStatusDefaultsToActive() {
    const status = this.page.getByRole("combobox", { name: /status/i });
    if ((await status.count()) === 0) {
      return;
    }
    await expect(status.first()).toBeVisible({ timeout: 15_000 });
    await expect(status.first()).toContainText(/active/i);
  }

  /**
   * @param {AffordplanSubmoduleConfig} cfg
   * @param {string} uniqueDisplayName
   */
  async fillName(cfg, uniqueDisplayName) {
    const nameInput = this.page.getByRole("textbox", { name: cfg.nameFieldLabelRe });
    await expect(nameInput).toBeVisible({ timeout: 15_000 });
    await nameInput.fill(uniqueDisplayName);
  }

  async clickSave() {
    await this.saveButton.scrollIntoViewIfNeeded();
    await expect(this.saveButton).toBeEnabled();
    await this.saveButton.click();
  }

  /**
   * @param {AffordplanSubmoduleConfig} cfg
   */
  async expectSaveReturnedToList(cfg) {
    await this.page.waitForURL(cfg.listUrlRe, { timeout: 120_000 });
  }

  /**
   * Create record: name only; **Status** left as default **Active**.
   * @param {AffordplanSubmoduleConfig} cfg
   * @param {string} uniqueDisplayName
   */
  async createNewRecordWithDefaultActive(cfg, uniqueDisplayName) {
    await this.expectAddFormLoaded(cfg);
    await this.expectStatusDefaultsToActive();
    await this.fillName(cfg, uniqueDisplayName);
    await this.clickSave();
    await this.expectSaveReturnedToList(cfg);
  }
}

module.exports = { AffordplanMasterSubmoduleAddPage };
