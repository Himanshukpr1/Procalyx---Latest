/**
 * Shared add-form flows: **Hospital** vs **Hospital Unit**.
 * `FormSection` `title` → `role="region"` + `aria-label` (procalyx-ui).
 * URL regexes follow `data/env.js` for the active `AUTH_PROFILE` (HKAM uses `/hkam/...`).
 */
const { getAuthProfile } = require("../../data/auth-profiles");

const HOSPITAL_MASTER_BASE = {
  id: "hospitalMaster",
  addUrlRegex: /\/dashboard\/hospital-masters\/add/,
  listUrlRegex: /\/dashboard\/hospital-masters\/?$/,
  pageTitlePattern: /add new hospital/i,
  spocFieldPrefix: "hospitalSPOC",
  hasHospitalSelection: false,
  section: {
    KYB: "Hospital KYB",
    INFO: "Hospital Information",
    INFRA: "Hospital Infrastructure",
    HIS: "Hospital HIS",
    AP_KAM: "AP KAM Info",
    SPOC: "Hospital SPOC Info",
    CONTRACT: "Hospital Contract Details",
    COMMERCIALS: "Hospital Commercials",
    BANK: "Hospital Bank Account Details",
  },
};

const HOSPITAL_UNIT_BASE = {
  id: "hospitalUnit",
  addUrlRegex: /\/dashboard\/hospital-unit-masters\/add/,
  listUrlRegex: /\/dashboard\/hospital-unit-masters\/?$/,
  pageTitlePattern: /add new hospital unit/i,
  spocFieldPrefix: "hospitalUnitSPOC",
  hasHospitalSelection: true,
  section: {
    SELECTION: "Hospital Selection",
    KYB: "Hospital Unit KYB",
    INFO: "Hospital Unit Information",
    INFRA: "Hospital Unit Infrastructure",
    HIS: "Hospital Unit HIS",
    AP_KAM: "AP KAM Info",
    SPOC: "Hospital Unit SPOC Info",
    CONTRACT: "Hospital Unit Contract Details",
    COMMERCIALS: "Hospital Unit Commercials",
    BANK: "Hospital Unit Bank Account Details",
  },
};

function augmentVariantForHkam(base) {
  if (getAuthProfile() !== "hkam_operator") {
    return base;
  }
  if (base.id === "hospitalMaster") {
    return {
      ...base,
      addUrlRegex: /\/hkam\/hospital-management\/add/,
      listUrlRegex: /\/hkam\/hospital-management\/?$/,
    };
  }
  if (base.id === "hospitalUnit") {
    return {
      ...base,
      addUrlRegex: /\/hkam\/hospital-unit-management\/add/,
      listUrlRegex: /\/hkam\/hospital-unit-management\/?$/,
    };
  }
  return base;
}

function getFormVariants() {
  return {
    HOSPITAL_MASTER: augmentVariantForHkam(HOSPITAL_MASTER_BASE),
    HOSPITAL_UNIT: augmentVariantForHkam(HOSPITAL_UNIT_BASE),
  };
}

module.exports = {
  getFormVariants,
  /** @deprecated prefer `getFormVariants()` — values depend on `AUTH_PROFILE`. */
  get FORM_VARIANTS() {
    return getFormVariants();
  },
  /** Backward compat — same as base Hospital Master `section` (labels unchanged for HKAM). */
  SECTION: HOSPITAL_MASTER_BASE.section,
};
