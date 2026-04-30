const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * **Manufacturer Onboarding** — `/dashboard/manufacturer-masters` (KAM list).
 */
class ManufacturerOnboardingPage extends BasePage {
  constructor(page) {
    super(page);
    this.table = page.locator("table").first();
  }

  /** TC07 — open **Manufacturer Onboarding** from the left nav (same entry as config path). */
  async clickManufacturerOnboardingNav() {
    await this.page.waitForLoadState("domcontentloaded");
    const byButton = this.page.getByRole("button", { name: /manufacturer onboarding/i });
    if ((await byButton.count()) > 0) {
      await byButton.first().click();
      await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-masters\/?$/);
      return;
    }
    const byTree = this.page.getByRole("treeitem", { name: /manufacturer onboarding/i });
    if ((await byTree.count()) > 0) {
      await byTree.first().click();
      await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-masters\/?$/);
      return;
    }
    const text = this.page.getByText("Manufacturer Onboarding", { exact: false });
    await expect(text.first()).toBeVisible({ timeout: 30_000 });
    await text.first().click();
    await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-masters\/?$/);
  }

  async gotoOnboardingList(listPath = "/dashboard/manufacturer-masters") {
    await this.goto(listPath);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectOnboardingListVisible() {
    await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-masters\/?$/);
    await expect(this.page.getByText(/Manufacturer Master/i).first()).toBeVisible({ timeout: 30_000 });
  }

  /**
   * TC08 — filter **MFG Name** (first filter row; matches AP **MFG Subsidiary Name**).
   * @param {string} mfgName
   */
  async expectManufacturerListedByMfgName(mfgName) {
    const table = this.table;
    await expect(table).toBeVisible({ timeout: 30_000 });

    const headerInputs = table.locator("thead").locator('input[type="text"], input[type="search"]');
    const count = await headerInputs.count();
    if (count >= 1) {
      await headerInputs.nth(0).fill(mfgName);
    }

    await expect(async () => {
      await expect(this.page.locator("tbody").getByText(mfgName, { exact: false }).first()).toBeVisible();
    }).toPass({ timeout: 45_000 });
  }

  /**
   * TC09 — `aria-label` from onboarding table: `Edit ${row.mfgName}`.
   * @param {string} mfgName
   */
  async clickEditManufacturerAction(mfgName) {
    const escaped = mfgName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const editBtn = this.page.getByRole("button", { name: new RegExp(`^Edit\\s+${escaped}`, "i") });
    await expect(editBtn).toBeVisible({ timeout: 30_000 });
    await editBtn.click();
  }
}

module.exports = { ManufacturerOnboardingPage };
