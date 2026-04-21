const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * **New Manufacturer Master** — `/dashboard/manufacturer-masters-ap/add`
 */
class ManufacturerMastersAddPage extends BasePage {
  constructor(page) {
    super(page);
    this.saveButton = page.getByRole("button", { name: /^Save$/i });
  }

  async expectAddManufacturerFormLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-masters-ap\/add/);
    await expect(this.page.getByRole("heading", { name: /new manufacturer master/i })).toBeVisible({
      timeout: 30_000,
    });
  }

  /**
   * Minimal create: **MFG Subsidiary Name** + **MFG Legal Name** + **Status** (Unassigned).
   * Parent MFG is optional — left empty.
   * @param {{ mfgSubsidiaryName: string, mfgLegalName: string }} d
   */
  async fillMinimalManufacturerCreate(d) {
    await this.page.getByRole("textbox", { name: /MFG Subsidiary Name/i }).fill(d.mfgSubsidiaryName);
    await this.page.getByRole("textbox", { name: /MFG Legal Name/i }).fill(d.mfgLegalName);

    const statusField = this.page.getByRole("combobox", { name: /^Status$/i });
    if ((await statusField.count()) > 0) {
      await statusField.click();
      await this.page.getByRole("option", { name: /^Unassigned$/i }).click();
    }
  }

  async submitCreate() {
    await this.saveButton.scrollIntoViewIfNeeded();
    await this.saveButton.click();
  }

  async expectCreateSucceeded() {
    await this.page.waitForURL(/\/dashboard\/manufacturer-masters-ap\/?$/, { timeout: 120_000 });
  }
}

module.exports = { ManufacturerMastersAddPage };
