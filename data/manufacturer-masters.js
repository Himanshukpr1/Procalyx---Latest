/**
 * Data Operator **Manufacturer Masters** (`/dashboard/manufacturer-masters-ap`) — minimal create payload.
 */
const { randomDigits } = require("../utils/random-user");
const { assertValidPanGst, hospitalAddDropdownDefaults } = require("./hospital-masters");

function uniqueMfgSubsidiaryName(prefix = "Auto MFG") {
  return `${prefix} ${Date.now()}-${randomDigits(4)}`;
}

function buildMinimalManufacturerPayload() {
  const mfgSubsidiaryName = uniqueMfgSubsidiaryName();
  return {
    mfgSubsidiaryName,
    mfgLegalName: process.env.MFG_LEGAL_NAME || `${mfgSubsidiaryName} Pvt Ltd`,
  };
}

/**
 * **Manufacturer Onboarding** edit form (`/dashboard/manufacturer-masters/edit/:id`).
 * Reuses QA location defaults from `hospital-masters` where applicable.
 * @param {string} mfgNameFromAp — same as **MFG Subsidiary Name** from AP minimal create (list **MFG Name** column).
 */
function buildManufacturerOnboardingEditPayload(mfgNameFromAp) {
  const pan = process.env.MFG_TEST_PAN || "ABCDE1234F";
  const gst = process.env.MFG_TEST_GST || "22AAAAA0000A1Z5";
  assertValidPanGst(pan, gst);

  const loc = hospitalAddDropdownDefaults();
  const registeredAddress =
    process.env.MFG_REGISTERED_ADDRESS ||
    "Automation QA registered office address line one and two, Block A";

  return {
    pan,
    gst,
    mfgLegalName: process.env.MFG_ONBOARDING_LEGAL_NAME || `${mfgNameFromAp} Legal Pvt Ltd`,
    registeredAddress,
    pincode: process.env.MFG_PINCODE || "400001",
    countryOption: process.env.MFG_COUNTRY || loc.countryOption,
    stateOption: process.env.MFG_STATE || loc.stateOption,
    cityOption: process.env.MFG_CITY || loc.cityOption,
    /** MFG SPOC */
    spocName: process.env.MFG_SPOC_NAME || "Auto MFG SPOC",
    spocDesignation: process.env.MFG_SPOC_DESIG || "Manager",
    spocEmail: process.env.MFG_SPOC_EMAIL || `mfgspoc.${Date.now()}@yopmail.com`,
    spocPhone: process.env.MFG_SPOC_PHONE || `9${randomDigits(9)}`,
    spocDepartment: process.env.MFG_SPOC_DEPT || "Operations",
    /** Contract */
    contractStatus: process.env.MFG_CONTRACT_STATUS || "Pre-Contract",
    operationalStatus: process.env.MFG_OPERATIONAL_STATUS || "active",
    /** Commercials (optional fields; filled to exercise section) */
    subscriptionFee: process.env.MFG_SUBSCRIPTION_FEE || "100",
    transactionFee: process.env.MFG_TRANSACTION_FEE || "10",
    /** Bank */
    bankName: process.env.MFG_BANK_NAME || "QA Bank Ltd",
    bankAccount: process.env.MFG_BANK_ACCOUNT || `5${randomDigits(15)}`,
    bankIfsc: process.env.MFG_BANK_IFSC || "SBIN0001234",
    /** AP KAM — substring to pick a user, or null = first non-placeholder */
    apKamUserLabel: process.env.MFG_AP_KAM_OPTION || null,
  };
}

module.exports = {
  uniqueMfgSubsidiaryName,
  buildMinimalManufacturerPayload,
  buildManufacturerOnboardingEditPayload,
};
