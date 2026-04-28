/**
 * Add Hospital / Hospital Unit forms — `react-hook-form` `name` + MUI roles (procalyx-ui).
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} [ui]
 * @param {object} [variant] — from `getFormVariants()` (defaults to Hospital Master)
 */
const { getFormVariants, SECTION: SECTION_LEGACY } = require("../config/hospital-form-variants");

function createHospitalAddLocators(page, ui = {}, variant) {
  const FORM_VARIANTS = getFormVariants();
  const v = variant === undefined ? FORM_VARIANTS.HOSPITAL_MASTER : variant;
  const {
    hospitalTypeOption = "Clinic/ Nursing Home",
    countryOption = "India",
    stateOption = "Bihar",
    cityOption = "Baisi",
    hisVendor = "Allscripts",
    integrationStatus = "In Progress",
    integrationMode = "API",
    speciality1 = "Cardiology",
    speciality2 = "Dermatology",
    contractStatusOption = "Contract Cancelled",
    operationalStatusOption = "Active",
    spocDepartmentOption = "Operations",
  } = ui;

  const sec = v.section;
  const spoc = v.spocFieldPrefix;
  const isHospitalUnit = v.id === FORM_VARIANTS.HOSPITAL_UNIT.id;

  const hospitalInfoSection = page.getByRole("region", { name: sec.INFO });
  const hospitalHisSection = page.getByRole("region", { name: sec.HIS });
  const hospitalContractDetailsSection = page.getByRole("region", { name: sec.CONTRACT });
  const apKamSection = page.getByRole("region", { name: sec.AP_KAM });

  return {
    pan: page.getByRole("textbox", { name: "Enter 10-digit PAN number" }),
    gst: page.locator('input[name="kyb.gstNumber"]'),
    hospitalLegalName: page.locator('input[name="kyb.hospitalLegalName"]'),

    hospitalName: isHospitalUnit
      ? page.locator('input[name="info.hospitalUnitName"]')
      : page.locator('input[name="info.hospitalName"]'),
    hospitalType: isHospitalUnit
      ? page.getByRole("combobox", { name: "Select hospital unit type" })
      : page.getByRole("combobox", { name: "Select hospital type" }),
    hospitalTypeOption: page.getByRole("option", { name: hospitalTypeOption }),
    numberOfUnitsInput: page.locator('[name="info.numberOfUnits"]'),
    addressInputField: page.locator('textarea[name="info.operationalAddress"]'),

    countryDropdown: hospitalInfoSection.getByRole("combobox").nth(1),
    countryOption: page.getByRole("option", { name: countryOption }),
    stateDropdown: hospitalInfoSection.getByRole("combobox").nth(2),
    stateOption: page.getByRole("option", { name: stateOption }),
    cityDropdown: hospitalInfoSection.getByRole("combobox").nth(3),
    cityOption: page.getByRole("option", { name: cityOption }),
    pincodeInputField: page.locator('[name="info.pincode"]'),

    /**
     * HIS: Hospital Master = vendor **dropdown** (`his.hospitalHIS`) + 2 selects.
     * Hospital Unit = free-text **input** (`his.hospitalUnitHIS`) + 2 selects (no vendor dropdown).
     */
    ...(isHospitalUnit
      ? {
          hospitalUnitHisInput: hospitalHisSection.locator('input[name="his.hospitalUnitHIS"]'),
          hospitalHisIntegrationStatusDropdown: hospitalHisSection.getByRole("combobox").nth(0),
          hospitalHisIntegrationModeDropdown: hospitalHisSection.getByRole("combobox").nth(1),
        }
      : {
          hospitalHisDropdown: hospitalHisSection.getByRole("combobox").nth(0),
          hospitalHisIntegrationStatusDropdown: hospitalHisSection.getByRole("combobox").nth(1),
          hospitalHisIntegrationModeDropdown: hospitalHisSection.getByRole("combobox").nth(2),
        }),
    hospitalHisOption: page.getByRole("option", { name: hisVendor }),
    hospitalHisIntegrationStatusOption: page.getByRole("option", { name: integrationStatus }),
    hospitalHisIntegrationModeOption: page.getByRole("option", { name: integrationMode }),

    specialityDropdown: page.getByRole("combobox", { name: "Select specialties..." }),
    specialityOption1: page.getByRole("option", { name: speciality1 }),
    specialityOption2: page.getByRole("option", { name: speciality2 }),
    numberOfBedsInput: page.locator('[name="infrastructure.numberOfBeds"]'),

    apKamNameDropdown: apKamSection.getByRole("combobox").nth(0),

    hospitalSpocNameInput: page.locator(`input[name="${spoc}.name"]`),
    hospitalSpocDesignationInput: page.locator(`input[name="${spoc}.designation"]`),
    hospitalSpocEmailInput: page.locator(`input[name="${spoc}.email"]`),
    hospitalSpocPhoneInput: page.locator(`input[name="${spoc}.phone"]`),
    hospitalSpocDepartmentDropdown: page.getByRole("combobox", { name: "Select department" }),
    hospitalSpocDepartmentOption: page.getByRole("option", { name: spocDepartmentOption }),

    hospitalContractStatusDropdown: hospitalContractDetailsSection.getByRole("combobox").nth(0),
    hospitalContractStatusOption: page.getByRole("option", { name: contractStatusOption }),
    hospitalOperationalStatusDropdown: hospitalContractDetailsSection.getByRole("combobox").nth(1),
    hospitalOperationalStatusOption: page.getByRole("option", { name: operationalStatusOption, exact: true }),

    commercialsNumberOfLogins: page.locator('[name="commercials.numberOfLogins"]'),
    bankNameInput: page.locator('[name="bank.bankName"]'),
    bankAccountNumberInput: page.locator('[name="bank.accountNumber"]'),
    bankIfscInput: page.locator('[name="bank.ifscCode"]'),
  };
}

module.exports = {
  createHospitalAddLocators,
  /** @deprecated prefer `getFormVariants().HOSPITAL_MASTER.section` */
  SECTION: SECTION_LEGACY,
  getFormVariants,
  /** @deprecated prefer `getFormVariants()` */
  get FORM_VARIANTS() {
    return getFormVariants();
  },
};
