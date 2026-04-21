/**
 * Hospital Master — add form test data (QA). Override via env when QA copy or validation rules change.
 */
const { randomDigits } = require("../utils/random-user");

function uniqueHospitalName(prefix = "Auto Hospital") {
  return `${prefix} ${Date.now()}-${randomDigits(4)}`;
}

/** Valid Indian PAN format (10 chars): `ABCDE1234F` */
const samplePan = process.env.HOSPITAL_TEST_PAN || "ABCDE1234F";

/** 15-char GST format: `22AAAAA0000A1Z5` */
const sampleGst = process.env.HOSPITAL_TEST_GST || "22AAAAA0000A1Z5";

function buildHospitalCreatePayload() {
  const hospitalName = uniqueHospitalName();
  return {
    hospitalName,
    legalName: process.env.HOSPITAL_LEGAL_NAME || `${hospitalName} Pvt Ltd`,
    operationalAddress: process.env.HOSPITAL_ADDRESS || "Automation QA address, Block 1",
    samplePan,
    sampleGst,
    defaultPincode: process.env.HOSPITAL_PINCODE || "400001",
    defaultUnits: process.env.HOSPITAL_UNITS || "100",
    defaultBeds: process.env.HOSPITAL_BEDS || "10",
    defaultIcuBeds: process.env.HOSPITAL_ICU || "1",
    defaultOt: process.env.HOSPITAL_OT || "1",
    spocName: process.env.HOSPITAL_SPOC_NAME || "Auto SPOC",
    spocDesignation: process.env.HOSPITAL_SPOC_DESIG || "Manager",
    spocEmail: process.env.HOSPITAL_SPOC_EMAIL || `spoc.${Date.now()}@yopmail.com`,
    spocPhone: process.env.HOSPITAL_SPOC_PHONE || `9${randomDigits(9)}`,
    /** TC12 — adjust env if QA labels differ */
    commercialRemarks: process.env.HOSPITAL_COMMERCIALS || "Automation QA — commercials",
    /** TC13 */
    bankAccountHolder: process.env.HOSPITAL_BANK_HOLDER || "QA Hospital Account",
    bankAccountNo: process.env.HOSPITAL_BANK_ACCOUNT || `5${randomDigits(15)}`,
    bankIfsc: process.env.HOSPITAL_BANK_IFSC || "SBIN0001234",
    bankName: process.env.HOSPITAL_BANK_NAME || "QA Bank Ltd",
  };
}

/** Assert formats required by KYB validation (fail fast in tests). */
function assertValidPanGst(pan, gst) {
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    throw new Error(`Invalid test PAN format (expected ABCDE1234F style): ${pan}`);
  }
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(gst)) {
    throw new Error(`Invalid test GST format (expected 22AAAAA0000A1Z5 style): ${gst}`);
  }
}

/** Dropdown / listbox labels for `createHospitalAddLocators` — override via env per QA data. */
function hospitalAddDropdownDefaults() {
  return {
    /** Must match API hospital type `name` in QA (see Autocomplete option label). */
    hospitalTypeOption: process.env.HOSPITAL_TYPE_OPTION || "Clinic/ Nursing Home",
    countryOption: process.env.HOSPITAL_COUNTRY || "India",
    stateOption: process.env.HOSPITAL_STATE || "Bihar",
    cityOption: process.env.HOSPITAL_CITY || "Baisi",
    hisVendor: process.env.HOSPITAL_HIS_VENDOR || "Allscripts",
    integrationStatus: process.env.HOSPITAL_HIS_INTEGRATION_STATUS || "In Progress",
    integrationMode: process.env.HOSPITAL_HIS_INTEGRATION_MODE || "API",
    speciality1: process.env.HOSPITAL_SPECIALITY_1 || "Cardiology",
    speciality2: process.env.HOSPITAL_SPECIALITY_2 || "Dermatology",
    /**
     * Optional: substring to match a specific AP KAM user (`ApSpocSection` option text is `Name (id)`).
     * If unset, TC09 selects the **first** non-placeholder row after opening the Name listbox.
     */
    apKamUserLabel: process.env.HOSPITAL_AP_KAM_OPTION || null,
    contractStatusOption: process.env.HOSPITAL_CONTRACT_STATUS || "Contract Cancelled",
    operationalStatusOption: process.env.HOSPITAL_OPERATIONAL_STATUS || "Active",
    spocDepartmentOption: process.env.HOSPITAL_SPOC_DEPT || "Operations",
  };
}

module.exports = {
  uniqueHospitalName,
  buildHospitalCreatePayload,
  hospitalAddDropdownDefaults,
  assertValidPanGst,
  samplePan,
  sampleGst,
  defaultPincode: process.env.HOSPITAL_PINCODE || "400001",
  defaultUnits: process.env.HOSPITAL_UNITS || "1",
  defaultBeds: process.env.HOSPITAL_BEDS || "10",
  defaultIcuBeds: process.env.HOSPITAL_ICU || "1",
  defaultOt: process.env.HOSPITAL_OT || "1",
  spocName: process.env.HOSPITAL_SPOC_NAME || "Auto SPOC",
  spocDesignation: process.env.HOSPITAL_SPOC_DESIG || "Manager",
  spocEmail: process.env.HOSPITAL_SPOC_EMAIL || `spoc.${Date.now()}@yopmail.com`,
  spocPhone: process.env.HOSPITAL_SPOC_PHONE || `9${randomDigits(9)}`,
};
