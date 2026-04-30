const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * Affordplan Master → **Manufacturer Masters** — `/dashboard/manufacturer-masters-ap`
 */
class ManufacturerMastersPage extends BasePage {
  constructor(page) {
    super(page);
    this.addNewButton = page.getByRole('button', { name: 'Add New' });
    this.pageHeading = page.getByRole("heading", { name: /^Manufacturer Masters$/i });
    this.table = page.locator("table").first();
  }

  /** TC02 — expand **Affordplan Master** in the left menu. */
  async clickAffordplanMasterNav() {
    await this.page.waitForLoadState("domcontentloaded");
    const byButton = this.page.getByRole("button", { name: /affordplan master/i });
    if ((await byButton.count()) > 0) {
      await byButton.first().click();
      return;
    }
    const byTree = this.page.getByRole("treeitem", { name: /affordplan master/i });
    if ((await byTree.count()) > 0) {
      await byTree.first().click();
      return;
    }
    const text = this.page.getByText("Affordplan Master", { exact: false });
    await expect(text.first()).toBeVisible({ timeout: 30_000 });
    await text.first().click();
  }

  /**
   * TC03 — open Manufacturer Masters (Data Operators list under Affordplan Master).
   */
  async clickManufacturerMastersSidebarLink() {
    const byHref = this.page.locator('span').filter({ hasText: 'Manufacturer Masters' }).nth(1);
    await expect(byHref.first()).toBeVisible({ timeout: 30_000 });
    await byHref.first().click();
    await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-masters-ap$/);
  }

  async openManufacturerMastersList(listPath = "/dashboard/manufacturer-masters-ap") {
    await this.goto(listPath);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectManufacturerMastersListVisible() {
    await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-masters-ap$/);
    await expect(this.pageHeading).toBeVisible({ timeout: 30_000 });
  }

  async expectAddNewButtonClickable() {
    await expect(this.addNewButton).toBeVisible({ timeout: 30_000 });
    await expect(this.addNewButton).toBeEnabled();
  }

  async clickAddNewManufacturer() {
    await this.addNewButton.click();
    await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-masters-ap\/add/);
  }

  /**
   * TC06 — filter **MFG Subsidiary Name** column (4th filter row under headers in current grid).
   * @param {string} subsidiaryName
   */
  async expectManufacturerListedBySubsidiaryName(subsidiaryName) {
    const table = this.table;
    await expect(table).toBeVisible({ timeout: 30_000 });

    const headerInputs = table.locator("thead").locator('input[type="text"], input[type="search"]');
    const count = await headerInputs.count();
    if (count >= 4) {
      await headerInputs.nth(3).fill(subsidiaryName);
    } else if (count > 0) {
      await headerInputs.first().fill(subsidiaryName);
    }

    await expect(async () => {
      await expect(this.page.locator("tbody").getByText(subsidiaryName, { exact: false }).first()).toBeVisible();
    }).toPass({ timeout: 45_000 });
  }
}

module.exports = { ManufacturerMastersPage };
