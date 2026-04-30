const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");
const hmData = require("../../../data/AP SuperAdmin/hospital-masters");
const { createHospitalAddLocators } = require("../../locators/hospital-masters-add.locators");
const { getFormVariants } = require("../../config/hospital-form-variants");

/**
 * Prefer `Auto Hospital …` options (matches `uniqueHospitalName()`), newest first by embedded timestamp.
 * Remaining options are tried after, in original order.
 * @param {string[]} labels
 * @returns {string[]}
 */
function orderHospitalSelectionLabels(labels) {
  const filtered = labels.filter((t) => t && !/^\s*Select hospital/i.test(t));
  const auto = filtered.filter((t) => /Auto Hospital/i.test(t));
  const score = (s) => {
    const nums = s.match(/\d{10,}/g);
    if (!nums || !nums.length) return 0;
    return Math.max(...nums.map(Number));
  };
  auto.sort((a, b) => score(b) - score(a));
  const rest = filtered.filter((t) => !/Auto Hospital/i.test(t));
  return [...auto, ...rest];
}

/**
 * Add **Hospital** or **Hospital Unit** — shared field `name`s; section `aria-label`s differ by variant.
 */
class HospitalAddPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {ReturnType<typeof getFormVariants>["HOSPITAL_MASTER"]} [variant] — default Hospital Master
   */
  constructor(page, variant) {
    super(page);
    const V = getFormVariants();
    this.variant = variant === undefined ? V.HOSPITAL_MASTER : variant;
    this.pageTitle = page.getByText(this.variant.pageTitlePattern).first();
    this.submitButton = page.getByRole("button", { name: /submit|save|create|send for approval/i });
    this.loc = createHospitalAddLocators(page, hmData.hospitalAddDropdownDefaults(), this.variant);
  }

  sec() {
    return this.variant.section;
  }

  /**
   * @param {import('@playwright/test').Locator} dropdown
   * @param {import('@playwright/test').Locator} option
   */
  async clickDropdownOption(dropdown, option) {
    await expect(dropdown).toBeVisible({ timeout: 15_000 });
    await dropdown.click();
    await expect(option).toBeVisible({ timeout: 15_000 });
    await option.click();
  }

  async selectHospitalTypeOption() {
    const ui = hmData.hospitalAddDropdownDefaults();
    await expect(this.loc.hospitalType).toBeVisible({ timeout: 15_000 });
    await this.loc.hospitalType.click();

    const listbox = this.page.getByRole("listbox").last();
    await expect(listbox).toBeVisible({ timeout: 15_000 });

    const byLabel = listbox.getByRole("option", { name: ui.hospitalTypeOption, exact: true });
    if ((await byLabel.count()) > 0) {
      await byLabel.click();
      return;
    }

    const byRegex = listbox.getByRole("option", { name: /Clinic|Nursing|Hospital/i });
    if ((await byRegex.count()) > 0) {
      await byRegex.first().click();
      return;
    }

    const firstReal = listbox
      .getByRole("option")
      .filter({ hasNotText: /^Select(\s+|\.\.\.)?$/i })
      .first();
    await expect(firstReal).toBeVisible({ timeout: 5_000 });
    await firstReal.click();
  }

  async selectApKamNameOption() {
    const ui = hmData.hospitalAddDropdownDefaults();
    await expect(this.loc.apKamNameDropdown).toBeVisible({ timeout: 15_000 });
    await this.loc.apKamNameDropdown.click();

    const listbox = this.page.getByRole("listbox").last();
    await expect(listbox).toBeVisible({ timeout: 15_000 });

    if (ui.apKamUserLabel) {
      const escaped = ui.apKamUserLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const preferred = listbox.getByRole("option", { name: new RegExp(escaped, "i") });
      if ((await preferred.count()) > 0) {
        await preferred.first().click();
        return;
      }
    }

    const firstReal = listbox
      .getByRole("option")
      .filter({ hasNotText: /^\s*Select a user/i })
      .first();

    await expect(firstReal).toBeVisible({ timeout: 15_000 });
    await firstReal.click();
  }

  async scrollToFormSection(sectionName) {
    const region = this.page.getByRole("region", { name: sectionName });
    await expect(region).toBeVisible({ timeout: 30_000 });
    await region.scrollIntoViewIfNeeded();
  }

  /** Hospital Unit only — `HospitalSelectionSection.tsx` */
  async fillHospitalSelectionSection() {
    if (!this.variant.hasHospitalSelection) return;
    const ordered = await this.collectAndOrderHospitalSelectionCandidates();
    if (!ordered.length) {
      throw new Error("Hospital Selection dropdown has no hospitals to pick.");
    }
    await this.fillHospitalSelectionSectionForLabel(ordered[0]);
  }

  /**
   * Open Hospital Selection combobox, read option labels, close without committing (Escape).
   * @returns {Promise<string[]>}
   */
  async collectHospitalSelectionOptionLabels() {
    if (!this.variant.hasHospitalSelection) return [];
    await this.scrollToFormSection(this.sec().SELECTION);
    const region = this.page.getByRole("region", { name: this.sec().SELECTION });
    const selectHospital = region.getByRole("combobox").first();
    await expect(selectHospital).toBeVisible({ timeout: 15_000 });
    await selectHospital.click();

    const listbox = this.page.getByRole("listbox").last();
    await expect(listbox).toBeVisible({ timeout: 15_000 });
    const opts = listbox.getByRole("option");
    const count = await opts.count();
    const labels = [];
    for (let i = 0; i < count; i++) {
      const t = (await opts.nth(i).innerText()).trim();
      if (t && !/^\s*Select hospital/i.test(t)) {
        labels.push(t);
      }
    }
    await this.page.keyboard.press("Escape");
    await expect(listbox).toBeHidden({ timeout: 5_000 }).catch(() => {});
    return labels;
  }

  /** Labels ordered: `Auto Hospital …` newest first (by `Date.now()` in name), then other hospitals. */
  async collectAndOrderHospitalSelectionCandidates() {
    const raw = await this.collectHospitalSelectionOptionLabels();
    return orderHospitalSelectionLabels(raw);
  }

  /**
   * Pick one hospital row in the listbox by visible option text.
   * @param {string} optionText
   */
  async fillHospitalSelectionSectionForLabel(optionText) {
    if (!this.variant.hasHospitalSelection) return;
    await this.scrollToFormSection(this.sec().SELECTION);
    const region = this.page.getByRole("region", { name: this.sec().SELECTION });
    const selectHospital = region.getByRole("combobox").first();
    await expect(selectHospital).toBeVisible({ timeout: 15_000 });
    await selectHospital.click();

    const listbox = this.page.getByRole("listbox").last();
    await expect(listbox).toBeVisible({ timeout: 15_000 });
    const escaped = optionText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const opt = listbox.getByRole("option", { name: new RegExp(`^\\s*${escaped}\\s*$`, "i") });
    await expect(opt.first()).toBeVisible({ timeout: 15_000 });
    await opt.first().click();

    await expect(this.page.locator('[name="hospitalSelection.hospitalCode"]')).not.toHaveValue("", {
      timeout: 30_000,
    });
  }

  async expectAddHospitalScreenLoaded() {
    await expect(this.page).toHaveURL(this.variant.addUrlRegex);
    await expect(this.pageTitle).toBeVisible({ timeout: 30_000 });
  }

  /** TC05 / TC06 — KYB */
  async fillHospitalKybSection(d) {
    hmData.assertValidPanGst(d.samplePan, d.sampleGst);
    await this.scrollToFormSection(this.sec().KYB);

    await this.loc.pan.fill(d.samplePan);
    await this.loc.gst.fill(d.sampleGst);
    await this.loc.hospitalLegalName.fill(d.legalName);

    await expect(this.loc.pan).toHaveValue(d.samplePan);
    await expect(this.loc.gst).toHaveValue(d.sampleGst);
    await expect(this.loc.hospitalLegalName).toHaveValue(d.legalName);
  }

  /** TC06 / TC07 — Information */
  async fillHospitalInformationSection(d) {
    await this.scrollToFormSection(this.sec().INFO);

    await this.loc.hospitalName.fill(d.hospitalName);
    await this.selectHospitalTypeOption();
    /** Hospital Unit form has no `info.numberOfUnits` (see `HospitalUnitForm` InfoSection). */
    if (this.variant.id !== "hospitalUnit") {
      await this.loc.numberOfUnitsInput.fill(String(d.defaultUnits));
    }
    await this.loc.addressInputField.fill(d.operationalAddress);

    await this.clickDropdownOption(this.loc.countryDropdown, this.loc.countryOption);
    await expect(this.loc.stateDropdown).toBeEnabled({ timeout: 45_000 });
    await this.clickDropdownOption(this.loc.stateDropdown, this.loc.stateOption);
    await expect(this.loc.cityDropdown).toBeEnabled({ timeout: 45_000 });
    await this.clickDropdownOption(this.loc.cityDropdown, this.loc.cityOption);
    await this.loc.pincodeInputField.fill(String(d.defaultPincode));
  }

  /** TC07 / TC08 — HIS */
  async fillHospitalHisSection() {
    await this.scrollToFormSection(this.sec().HIS);
    const ui = hmData.hospitalAddDropdownDefaults();
    if (this.variant.id === "hospitalUnit") {
      await expect(this.loc.hospitalUnitHisInput).toBeVisible({ timeout: 15_000 });
      await this.loc.hospitalUnitHisInput.fill(ui.hisVendor);
    } else {
      await this.clickDropdownOption(this.loc.hospitalHisDropdown, this.loc.hospitalHisOption);
    }
    await this.clickDropdownOption(
      this.loc.hospitalHisIntegrationStatusDropdown,
      this.loc.hospitalHisIntegrationStatusOption
    );
    await this.clickDropdownOption(
      this.loc.hospitalHisIntegrationModeDropdown,
      this.loc.hospitalHisIntegrationModeOption
    );
  }

  /** TC08 / TC09 — Infrastructure */
  async fillHospitalInfrastructureSection(d) {
    await this.scrollToFormSection(this.sec().INFRA);
    await this.loc.numberOfBedsInput.fill(String(d.defaultBeds));

    await this.loc.specialityDropdown.click();
    await this.loc.specialityOption1.click();
   
  }

  /** TC09 / TC10 — AP KAM */
  async fillApKamInfoSection() {
    await this.scrollToFormSection(this.sec().AP_KAM);
    await this.selectApKamNameOption();
  }

  async expectApKamAutoFilledEmailAndDesignation() {
    const section = this.page.getByRole("region", { name: this.sec().AP_KAM });
    const email = section.locator('input[name="apSPOC.email"]');
    await expect(email).toBeVisible({ timeout: 15_000 });
    await expect(email).not.toHaveValue("", { timeout: 15_000 });

    const designation = section.locator('input[name="apSPOC.designation"]');
    await expect(designation).toBeVisible({ timeout: 15_000 });
    await expect(designation).not.toHaveValue("", { timeout: 15_000 });
  }

  /** TC10 / TC11 — SPOC */
  async fillHospitalSpocSection(d) {
    await this.scrollToFormSection(this.sec().SPOC);
    await this.loc.hospitalSpocNameInput.fill(d.spocName);
    await this.loc.hospitalSpocDesignationInput.fill(d.spocDesignation);
    await this.loc.hospitalSpocEmailInput.fill(d.spocEmail);
    await this.loc.hospitalSpocPhoneInput.fill(d.spocPhone);
    await this.clickDropdownOption(this.loc.hospitalSpocDepartmentDropdown, this.loc.hospitalSpocDepartmentOption);
  }

  /** TC11 / TC12 — Contract */
  async fillHospitalContractDetailsSection() {
    await this.scrollToFormSection(this.sec().CONTRACT);
    await this.clickDropdownOption(this.loc.hospitalContractStatusDropdown, this.loc.hospitalContractStatusOption);
    await this.clickDropdownOption(
      this.loc.hospitalOperationalStatusDropdown,
      this.loc.hospitalOperationalStatusOption
    );
  }

  /** TC12 / TC13 — Commercials */
  async fillHospitalCommercialsSection() {
    await this.scrollToFormSection(this.sec().COMMERCIALS);
    if (await this.loc.commercialsNumberOfLogins.count()) {
      await this.loc.commercialsNumberOfLogins.fill("1");
    }
  }

  /** TC13 / TC14 — Bank */
  async fillHospitalBankAccountSection(d) {
    await this.scrollToFormSection(this.sec().BANK);
    await this.loc.bankNameInput.fill(d.bankName);
    await this.loc.bankAccountNumberInput.fill(d.bankAccountNo);
    await this.loc.bankIfscInput.fill(d.bankIfsc);
  }

  async submitCreateHospital() {
    await this.submitButton.scrollIntoViewIfNeeded();
    await this.submitButton.click();
  }

  async expectCreateSucceeded() {
    await Promise.race([
      this.page.waitForURL(this.variant.listUrlRegex, { timeout: 120_000 }),
      this.page.getByText(/success|submitted|approval|created|pending/i).first().waitFor({ state: "visible", timeout: 120_000 }),
    ]);
  }
}

module.exports = { HospitalAddPage, getFormVariants };
