const { expect } = require("@playwright/test");
const env = require("../../data/env");
const { BasePage } = require("./BasePage");

/**
 * MKAM — **Add New Manufacturer** (`/mkam/manufacturer-management/add`).
 * Includes mandatory **MFG Name** — pick **existing** manufacturer from dropdown (`Search manufacturer...`), not a generated seed string.
 */
class MkamManufacturerAddPage extends BasePage {
  constructor(page) {
    super(page);
    this.saveButton = page.getByRole("button", { name: /^Save$/i });
    this.confirmButton = page.getByRole("button", { name: /^Confirm$/i });
  }

  async expectAddManufacturerScreenLoaded() {
    await expect(this.page).toHaveURL(env.mkamManufacturerManagementAddUrlRe);
    await expect(this.page.getByRole("heading", { name: /add new manufacturer/i })).toBeVisible({
      timeout: 45_000,
    });
  }

  async scrollToSection(title) {
    const region = this.page.getByRole("region", { name: title });
    await expect(region).toBeVisible({ timeout: 30_000 });
    await region.scrollIntoViewIfNeeded();
  }

  /** TC05 — MFG KYB (PAN `ABCDE1234F`, GST `22AAAAA0000A1Z5`). */
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
   * MKAM Add — **MFG Name** must choose an **existing** manufacturer from the API dropdown only (do not type a generated seed).
   * Opens search, waits for suggestions, selects the first substantive option.
   * Does **not** call `dismissVisibleAutocompleteListboxes` here — Escape can clear selection.
   */
  async pickExistingMfgNameFromDropdown() {
    const info = this.page.getByRole("region", { name: "MFG Information" });
    const box = info
      .getByPlaceholder(/Search manufacturer/i)
      .or(info.getByRole("combobox", { name: /^MFG Name\b/i }))
      .first();

    await expect(box).toBeVisible({ timeout: 25_000 });
    await box.click();

    const getListbox = () => this.page.getByRole("listbox").last();

    if (!(await getListbox().isVisible().catch(() => false))) {
      await box.press("ArrowDown");
    }
    if (!(await getListbox().isVisible().catch(() => false))) {
      /** Some APIs return options only after typing — generic trigger, not the automation-generated Legal/MFG seed string. */
      await box.pressSequentially("a", { delay: 40 });
    }

    const listbox = getListbox();
    await expect(listbox).toBeVisible({ timeout: 25_000 });

    const opts = listbox.getByRole("option");
    await expect(opts.first()).toBeVisible({ timeout: 15_000 });

    const n = await opts.count();
    let clicked = false;
    for (let i = 0; i < n; i++) {
      const opt = opts.nth(i);
      const text = ((await opt.innerText()) || "").trim();
      if (!text || /^no\s+(matching\s+)?results?$/i.test(text) || /^type\s+to\s+search/i.test(text)) {
        continue;
      }
      if ((await opt.getAttribute("aria-disabled")) === "true") continue;
      await opt.click();
      clicked = true;
      break;
    }
    if (!clicked) {
      throw new Error(
        "MFG Name: dropdown has no selectable manufacturer — ensure QA has at least one master record for MKAM.",
      );
    }

    await this.expectNoVisibleAutocompleteListbox();
  }

  /**
   * MKAM — Country / State / City via **MUI Select**.
   * The visible `[role=combobox]` is typically a **sibling** of `input[name="info.country"]` inside the same
   * `MuiInputBase-root`, so `getByRole('combobox').filter({ has: input })` matches nothing (native input is not inside
   * the combobox node). Resolve: ancestor wrapper from the native input → click its combobox child.
   * @param {object} d — onboarding payload (`countryOption`, `stateOption`, `cityOption`).
   */
  async fillMkamLocationCascade(d) {
    const info = this.page.getByRole("region", { name: "MFG Information" });

    /** @param {string} nativeInputName e.g. `info.country` */
    const muiSelectComboForNativeInput = (nativeInputName) =>
      info
        .locator(`input[name="${nativeInputName}"]`)
        .locator('xpath=ancestor::*[contains(@class,"MuiInputBase-root")][1]')
        .getByRole("combobox")
        .first();

    const countryCombo = muiSelectComboForNativeInput("info.country");
    await countryCombo.scrollIntoViewIfNeeded();
    await expect(countryCombo).toBeVisible({ timeout: 25_000 });
    await countryCombo.click();
    await this.page.getByRole("option", { name: d.countryOption, exact: true }).click();

    const stateCombo = muiSelectComboForNativeInput("info.state");
    await expect(stateCombo).toBeEnabled({ timeout: 45_000 });
    await stateCombo.click();
    await this.page.getByRole("option", { name: d.stateOption, exact: true }).click();

    const cityCombo = muiSelectComboForNativeInput("info.city");
    await expect(cityCombo).toBeEnabled({ timeout: 45_000 });
    await cityCombo.click();
    await this.page.getByRole("option", { name: d.cityOption, exact: true }).click();
  }

  /** TC06 — MFG Information */
  async fillMfgInformationSection(d) {
    await this.scrollToSection("MFG Information");

    /** Blur target below Category/Therapy — avoid Legal Name (scrolls back near MFG Name). */
    const addr = this.page.locator('[name="info.registeredAddress"]');
    const legal = this.page.locator('input[name="info.mfgLegalName"]');

    await this.pickExistingMfgNameFromDropdown();

    await legal.fill(d.mfgLegalName);
    await expect(legal).toHaveValue(d.mfgLegalName);

    await this.page.getByPlaceholder("Select categories...").click();
    const catList = this.page.getByRole("listbox").last();
    await expect(catList).toBeVisible({ timeout: 15_000 });
    await catList.getByRole("option").first().click();
    await this.dismissVisibleAutocompleteListboxes(addr);

    await this.page.getByPlaceholder("Select therapy areas...").click();
    const thList = this.page.getByRole("listbox").last();
    await expect(thList).toBeVisible({ timeout: 15_000 });
    await thList.getByRole("option").first().click();
    await this.dismissVisibleAutocompleteListboxes(addr);

    await addr.fill(d.registeredAddress);
    await expect(addr).toHaveValue(d.registeredAddress);

    /**
     * MKAM Add — do **not** use `getMfgInformationLocationCascade()` combobox scan: after **MFG Name** is chosen its
     * placeholder/chips change so it stops matching exclusions and gets mistaken for Country (`combobox.first()`).
     * Resolve Country / State / City by label + **Select country…** placeholder instead.
     */
    await this.fillMkamLocationCascade(d);

    const pin = this.page.locator('input[name="info.pincode"]');
    await pin.fill(String(d.pincode));
    await expect(pin).toHaveValue(String(d.pincode));
  }

  /** TC07 — MFG SPOC Info (hospital-units multi-select skipped when absent). */
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
    if (await hu.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await hu.click();
      const huList = this.page.getByRole("listbox").last();
      await expect(huList).toBeVisible({ timeout: 30_000 });
      await huList.getByRole("option").first().click();
      await this.page.keyboard.press("Escape");
    }
  }

  /** TC08 — MFG Contract Details */
  async fillMfgContractSection(d) {
    await this.scrollToSection("MFG Contract Details");
    const region = this.page.getByRole("region", { name: "MFG Contract Details" });
    const combos = region.getByRole("combobox");
    await combos.nth(0).click();
    await this.page.getByRole("option", { name: d.contractStatus, exact: true }).click();
    await combos.nth(1).click();
    await this.page.getByRole("option", { name: /^Active$/i }).click();
  }

  /** TC09 — MFG Commercials */
  async fillMfgCommercialsSection(d) {
    await this.scrollToSection("MFG Commercials");
    await this.page.locator('input[name="commercials.subscriptionFee"]').fill(String(d.subscriptionFee));
    await this.page.locator('input[name="commercials.transactionFee"]').fill(String(d.transactionFee));
  }

  /** TC10 — Bank account details (region title varies by build). */
  async fillMfgBankSection(d) {
    const titles = ["Bank Details", "MFG Bank Account Details", "MFG Bank Account"];
    let scrolled = false;
    for (const title of titles) {
      const region = this.page.getByRole("region", { name: title });
      if (await region.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await region.scrollIntoViewIfNeeded();
        scrolled = true;
        break;
      }
    }
    if (!scrolled) await this.scrollToSection("Bank Details");
    await this.page.locator('input[name="bank.bankName"]').fill(d.bankName);
    await this.page.locator('input[name="bank.accountNumber"]').fill(d.bankAccount);
    await this.page.locator('input[name="bank.ifscCode"]').fill(d.bankIfsc);
  }

  async submitCreate() {
    await this.saveButton.scrollIntoViewIfNeeded();
    await expect(this.saveButton).toBeEnabled({ timeout: 120_000 });
    await this.saveButton.click();
    const dialog = this.page.getByRole("dialog");
    if (await dialog.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await this.confirmButton.click();
    }
    await this.page.waitForURL(env.mkamManufacturerManagementListUrlRe, { timeout: 180_000 });
  }
}

module.exports = { MkamManufacturerAddPage };
