const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * **Edit Manufacturer** — `/dashboard/manufacturer-masters/edit/:id`
 */
class ManufacturerOnboardingEditPage extends BasePage {
  constructor(page) {
    super(page);
    this.saveButton = page.getByRole("button", { name: /^Save$/i });
    this.confirmButton = page.getByRole("button", { name: /^Confirm$/i });
  }

  async expectEditManufacturerLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-masters\/edit\//);
    await expect(this.page.getByRole("heading", { name: /edit manufacturer/i })).toBeVisible({
      timeout: 60_000,
    });
  }

  async scrollToSection(title) {
    const region = this.page.getByRole("region", { name: title });
    await expect(region).toBeVisible({ timeout: 30_000 });
    await region.scrollIntoViewIfNeeded();
  }

  /** TC11 — MFG KYB */
  async fillMfgKybSection(d) {
    await this.scrollToSection("MFG KYB");
    const pan = this.page.locator('input[name="kyb.pan"]');
    const gst = this.page.locator('input[name="kyb.gstNumber"]');
    await pan.fill(d.pan);
    await gst.fill(d.gst);
    await expect(pan).toHaveValue(d.pan);
    await expect(gst).toHaveValue(d.gst);
  }

  /**
   * TC12 — MFG Information (minimal required fields for validation).
   * Category / Therapy: first listbox option. Location: same cascade as hospital tests.
   */
  async fillMfgInformationSection(d) {
    await this.scrollToSection("MFG Information");

    const legal = this.page.locator('input[name="info.mfgLegalName"]');
    await legal.fill(d.mfgLegalName);
    await expect(legal).toHaveValue(d.mfgLegalName);

    await this.page.getByPlaceholder("Select categories...").click();
    const catList = this.page.getByRole("listbox").last();
    await expect(catList).toBeVisible({ timeout: 15_000 });
    await catList.getByRole("option").first().click();
    await this.page.keyboard.press("Escape");

    await this.page.getByPlaceholder("Select therapy areas...").click();
    const thList = this.page.getByRole("listbox").last();
    await expect(thList).toBeVisible({ timeout: 15_000 });
    await thList.getByRole("option").first().click();
    await this.page.keyboard.press("Escape");

    const addr = this.page.locator('[name="info.registeredAddress"]');
    await addr.fill(d.registeredAddress);
    await expect(addr).toHaveValue(d.registeredAddress);

    const info = this.page.getByRole("region", { name: "MFG Information" });
    const combos = info.getByRole("combobox");
    await expect(combos.nth(2)).toBeVisible({ timeout: 15_000 });
    await combos.nth(2).click();
    await this.page.getByRole("option", { name: d.countryOption, exact: true }).click();

    await expect(combos.nth(3)).toBeEnabled({ timeout: 45_000 });
    await combos.nth(3).click();
    await this.page.getByRole("option", { name: d.stateOption, exact: true }).click();

    await expect(combos.nth(4)).toBeEnabled({ timeout: 45_000 });
    await combos.nth(4).click();
    await this.page.getByRole("option", { name: d.cityOption, exact: true }).click();

    const pin = this.page.locator('input[name="info.pincode"]');
    await pin.fill(String(d.pincode));
    await expect(pin).toHaveValue(String(d.pincode));
  }

  /** TC13 — AP KAM Info: pick Name; email + designation auto-fill. */
  async fillApKamInfoSection(apKamUserLabel) {
    await this.scrollToSection("AP KAM Info");
    const region = this.page.getByRole("region", { name: "AP KAM Info" });
    const nameSelect = region.getByRole("combobox").first();
    await expect(nameSelect).toBeVisible({ timeout: 30_000 });
    await nameSelect.click();

    const listbox = this.page.getByRole("listbox").last();
    await expect(listbox).toBeVisible({ timeout: 30_000 });

    if (apKamUserLabel) {
      const escaped = apKamUserLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const opt = listbox.getByRole("option", { name: new RegExp(escaped, "i") }).first();
      await expect(opt).toBeVisible({ timeout: 15_000 });
      await opt.click();
    } else {
      const opt = listbox.getByRole("option").filter({ hasNotText: /Select a user/i }).first();
      await expect(opt).toBeVisible({ timeout: 30_000 });
      await opt.click();
    }

    const email = this.page.locator('input[name="apSPOC.email"]');
    await expect(email).not.toHaveValue("", { timeout: 15_000 });
    const designation = this.page.locator('input[name="apSPOC.designation"]');
    await expect(designation).not.toHaveValue("", { timeout: 15_000 });
  }

  /** TC14 — MFG SPOC Info (single-mode block + hospital units). */
  async fillMfgSpocInfoSection(d) {
    await this.scrollToSection("MFG SPOC Info");
    const region = this.page.getByRole("region", { name: "MFG SPOC Info" });

    await region.locator('input[name="manufacturerSPOC.name"]').fill(d.spocName);
    await region.locator('input[name="manufacturerSPOC.designation"]').fill(d.spocDesignation);
    await region.locator('input[name="manufacturerSPOC.email"]').fill(d.spocEmail);
    await region.locator('input[name="manufacturerSPOC.phone"]').fill(d.spocPhone);

    const dept = region.getByRole("combobox").first();
    await dept.click();
    await this.page.getByRole("option", { name: d.spocDepartment, exact: true }).click();

    const hu = region.getByPlaceholder("Select hospital units...");
    await expect(hu).toBeVisible({ timeout: 30_000 });
    await hu.click();
    const huList = this.page.getByRole("listbox").last();
    await expect(huList).toBeVisible({ timeout: 30_000 });
    await huList.getByRole("option").first().click();
    await this.page.keyboard.press("Escape");
  }

  /** TC15 — MFG Contract Details (non-Contracted to avoid extra date fields). */
  async fillMfgContractSection(d) {
    await this.scrollToSection("MFG Contract Details");
    const region = this.page.getByRole("region", { name: "MFG Contract Details" });
    const combos = region.getByRole("combobox");
    await combos.nth(0).click();
    await this.page.getByRole("option", { name: d.contractStatus, exact: true }).click();
    await combos.nth(1).click();
    await this.page.getByRole("option", { name: /^Active$/i }).click();
  }

  /** TC16 — MFG Commercials */
  async fillMfgCommercialsSection(d) {
    await this.scrollToSection("MFG Commercials");
    await this.page.locator('input[name="commercials.subscriptionFee"]').fill(String(d.subscriptionFee));
    await this.page.locator('input[name="commercials.transactionFee"]').fill(String(d.transactionFee));
  }

  /** TC17 — Bank Details + save */
  async fillMfgBankSection(d) {
    await this.scrollToSection("Bank Details");
    await this.page.locator('input[name="bank.bankName"]').fill(d.bankName);
    await this.page.locator('input[name="bank.accountNumber"]').fill(d.bankAccount);
    await this.page.locator('input[name="bank.ifscCode"]').fill(d.bankIfsc);
  }

  async submitSaveAndConfirm() {
    await this.saveButton.scrollIntoViewIfNeeded();
    await expect(this.saveButton).toBeEnabled({ timeout: 120_000 });
    await this.saveButton.click();
    await expect(this.page.getByRole("dialog")).toBeVisible({ timeout: 30_000 });
    await this.confirmButton.click();
  }

  async expectReturnedToOnboardingList() {
    await this.page.waitForURL(/\/dashboard\/manufacturer-masters\/?$/, { timeout: 120_000 });
  }
}

module.exports = { ManufacturerOnboardingEditPage };
