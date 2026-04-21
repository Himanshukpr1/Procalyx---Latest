const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * **New Manufacturer Item Mapping** — `/dashboard/manufacturer-item/add`
 */
class ManufacturerItemAddPage extends BasePage {
  constructor(page) {
    super(page);
    this.saveButton = page.getByRole("button", { name: /^Save$/i });
  }

  async expectAddManufacturerItemFormLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-item\/add/);
    await expect(this.page.getByRole("heading", { name: /new manufacturer item mapping/i })).toBeVisible({
      timeout: 30_000,
    });
  }

  /**
   * TC05 — **AffordPlan Generic Item**: search by item name and select a matching option.
   * @param {string} searchText — e.g. `Genexol 350`
   */
  async fillAffordplanGenericItem(searchText) {
    const search = this.page.getByPlaceholder(/search by item name/i);
    await expect(search.first()).toBeVisible({ timeout: 30_000 });
    await search.first().click();
    await search.first().fill(searchText);

    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "i");

    await expect(async () => {
      const opt = this.page.getByRole("option", { name: re });
      if ((await opt.count()) > 0) {
        await opt.first().click();
        return;
      }
      const inMenu = this.page
        .locator('[role="listbox"], [role="menu"]')
        .filter({ visible: true })
        .getByText(re)
        .first();
      await expect(inMenu).toBeVisible();
      await inMenu.click();
    }).toPass({ timeout: 30_000 });
  }

  /**
   * TC06 — **Item Code** (distinct from **AP Item Code** when both exist).
   * @param {string} code
   */
  async fillItemCode(code) {
    const exact = this.page.getByRole("textbox", { name: /^Item Code$/i });
    if ((await exact.count()) > 1) {
      await exact.last().scrollIntoViewIfNeeded();
      await exact.last().fill(code);
    } else if ((await exact.count()) === 1) {
      await exact.scrollIntoViewIfNeeded();
      await exact.fill(code);
    } else {
      const byLabel = this.page.locator("label").filter({ hasText: /^Item Code$/i }).first();
      await byLabel.scrollIntoViewIfNeeded();
      await byLabel.locator("xpath=following::input[1]").fill(code);
    }
  }

  /**
   * TC07 — **Item Name** (required; distinct from **AP Item Name** when both exist).
   * @param {string} name
   */
  async fillItemName(name) {
    const exact = this.page.getByRole("textbox", { name: /^Item Name$/i });
    if ((await exact.count()) > 1) {
      await exact.last().scrollIntoViewIfNeeded();
      await exact.last().fill(name);
    } else if ((await exact.count()) === 1) {
      await exact.scrollIntoViewIfNeeded();
      await exact.fill(name);
    } else {
      const byLabel = this.page.locator("label").filter({ hasText: /^Item Name/ }).filter({ hasNotText: /AP/i }).first();
      await byLabel.scrollIntoViewIfNeeded();
      await byLabel.locator("xpath=following::input[1]").fill(name);
    }
  }

  /**
   * TC08 — **Remarks** (textarea).
   * @param {string} text
   */
  async fillRemarks(text) {
    const byRole = this.page.getByRole("textbox", { name: /remarks/i });
    if ((await byRole.count()) > 0) {
      await byRole.last().scrollIntoViewIfNeeded();
      await byRole.last().fill(text);
      return;
    }
    await this.page.locator("textarea").last().scrollIntoViewIfNeeded();
    await this.page.locator("textarea").last().fill(text);
  }

  async clickSave() {
    await this.saveButton.scrollIntoViewIfNeeded();
    await expect(this.saveButton).toBeEnabled();
    await this.saveButton.click();
  }

  async expectSaveSucceeded() {
    await this.page.waitForURL(/\/dashboard\/manufacturer-item\/?$/, { timeout: 120_000 });
  }
}

module.exports = { ManufacturerItemAddPage };
