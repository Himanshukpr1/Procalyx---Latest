/**
 * Shared add-form flows: **Hospital** (`/hospital-masters/add`) vs **Hospital Unit** (`/hospital-unit-masters/add`).
 * `FormSection` `title` → `role="region"` + `aria-label` (procalyx-ui).
 */
const HOSPITAL_MASTER = {
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

const HOSPITAL_UNIT = {
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

module.exports = {
  FORM_VARIANTS: {
    HOSPITAL_MASTER,
    HOSPITAL_UNIT,
  },
  /** Backward compat — same as `FORM_VARIANTS.HOSPITAL_MASTER.section` */
  SECTION: HOSPITAL_MASTER.section,
};
