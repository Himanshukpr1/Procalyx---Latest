const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * Hospital Unit Master list — `/dashboard/hospital-unit-masters`
 */
class HospitalUnitMastersPage extends BasePage {
  constructor(page) {
    super(page);
    this.addNewHospitalUnitButton = page.getByRole("button", { name: /add new hospital unit/i });
    this.pageHeading = page.getByRole("heading", { name: /hospital unit master/i });
    this.hospitalUnitTable = page.locator("table").first();
  }

  /**
   * TC03 — sidebar link to Hospital Unit list (same pattern as Hospital Master `Hospital` link).
   */
  async clickHospitalUnitSidebarLink() {
    const link = this.page.getByText("Hospital Unit", { exact: true }).first();
    await expect(link).toBeVisible({ timeout: 30_000 });
    await link.click();
    await expect(this.page).toHaveURL(/\/dashboard\/hospital-unit-masters/);
  }

  async openHospitalUnitMastersList(listPath = "/dashboard/hospital-unit-masters") {
    await this.goto(listPath);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectHospitalUnitMasterListVisible() {
    await expect(this.page).toHaveURL(/\/dashboard\/hospital-unit-masters$/);
    await expect(this.pageHeading).toBeVisible({ timeout: 30_000 });
  }

  async expectAddNewHospitalUnitButtonClickable() {
    await expect(this.addNewHospitalUnitButton).toBeVisible({ timeout: 30_000 });
    await expect(this.addNewHospitalUnitButton).toBeEnabled();
  }

  async clickAddNewHospitalUnit() {
    await this.addNewHospitalUnitButton.click();
    await expect(this.page).toHaveURL(/\/dashboard\/hospital-unit-masters\/add/);
  }

  /**
   * TC15 — assert **Hospital Unit** name appears in the grid.
   * @param {string} unitName — `info.hospitalName` from the add form
   */
  async expectHospitalUnitListedByName(unitName) {
    const table = this.hospitalUnitTable;
    await expect(table).toBeVisible({ timeout: 30_000 });

    const headerInputs = table.locator("thead").locator('input[type="text"], input[type="search"]');
    if ((await headerInputs.count()) > 0) {
      await headerInputs.first().fill(unitName);
    }

    await expect(async () => {
      await expect(this.page.locator("tbody").getByText(unitName, { exact: false }).first()).toBeVisible();
    }).toPass({ timeout: 45_000 });
  }
}

module.exports = { HospitalUnitMastersPage };
