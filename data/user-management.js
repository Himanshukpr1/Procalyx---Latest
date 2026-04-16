/**
 * User Management — relationship + role labels as on QA (`qa.procalyx.net` Affordplan org).
 * Override per env if your tenant differs:
 * `UM_RELATIONSHIP` `UM_DEPARTMENT` `UM_COUNTRY` `UM_STATE` `UM_CITY` `UM_HOSPITAL_NAME` `UM_HOSPITAL_UNIT`
 * `UM_ROLE_*` (hospital + manufacturer), `UM_MFG_*`, `UM_DIVISION`, `UM_THERAPY` — see `npm run test:user-mgmt`.
 */
module.exports = {
  /**
   * Relationship `<select>` lists organization names from the API — use the exact visible label.
   * QA Affordplan flow: select **Affordplan** (see User Management create-user modal).
   */
  defaultRelationship: process.env.UM_RELATIONSHIP || "Affordplan",

  /**
   * Role dropdown options for Affordplan (exact strings from QA UI).
   * TC05–TC09 map one role each: Admin, HKAM, MKAM, Operator, Super Admin.
   */
  roles: {
    affordplanAdmin: process.env.UM_ROLE_AP_ADMIN || "Affordplan Admin",
    hkamOperator: process.env.UM_ROLE_AP_HKAM || "HKAM Operator",
    mkamOperator: process.env.UM_ROLE_AP_MKAM || "MKAM Operator",
    affordplanOperator: process.env.UM_ROLE_AP_OPERATOR || "Affordplan Operator",
    affordplanSuperAdmin: process.env.UM_ROLE_AP_SUPERADMIN || "Affordplan Super Admin",
  },

  /**
   * Department + Geography — option **visible text** from QA dropdowns (API-driven).
   * `"first"` = first real option after the placeholder. Override per env for your tenant.
   */
  defaultDepartment: process.env.UM_DEPARTMENT || "first",
  defaultCountry: process.env.UM_COUNTRY || "first",
  defaultState: process.env.UM_STATE || "first",
  defaultCity: process.env.UM_CITY || "first",

  /** Hospital relationship — `Hospital Name` native `<select>` option text (`hospital_name` from API). */
  defaultHospitalName: process.env.UM_HOSPITAL_NAME || "first",

  /** Hospital Unit multi-select: `"first"` = first listed unit, or substring of unit label. */
  defaultHospitalUnit: process.env.UM_HOSPITAL_UNIT || "first",

  /**
   * Roles when **Relationship** = Hospital (QA dropdown). TC10–TC12.
   * Override: `UM_ROLE_HOSPITAL_CXO`, `UM_ROLE_HOSPITAL_OP`, `UM_ROLE_HOSPITAL_SA`.
   */
  hospitalRoles: {
    cxo: process.env.UM_ROLE_HOSPITAL_CXO || "Hospital CXO",
    operator: process.env.UM_ROLE_HOSPITAL_OP || "Hospital Operator",
    superAdmin: process.env.UM_ROLE_HOSPITAL_SA || "Hospital Super Admin",
  },

  /** Manufacturer `<select>` option (`mfg_name`). `"first"` tries each manufacturer until Hospital Unit list has rows. */
  defaultManufacturer: process.env.UM_MFG_NAME || "first",

  /** Manufacturer → Hospital Unit multi-select. */
  defaultManufacturerHospitalUnit: process.env.UM_MFG_HOSPITAL_UNIT || "first",

  defaultDivision: process.env.UM_DIVISION || "first",
  defaultTherapyArea: process.env.UM_THERAPY || "first",

  /**
   * Roles when **Relationship** = Manufacturer. TC13–TC16 (QA Role dropdown).
   */
  manufacturerRoles: {
    businessHead: process.env.UM_ROLE_MFG_BH || "Manufacturer Business Head",
    cxo: process.env.UM_ROLE_MFG_CXO || "Manufacturer CXO",
    operator: process.env.UM_ROLE_MFG_OP || "Manufacturer Operator",
    superAdmin: process.env.UM_ROLE_MFG_SA || "Manufacturer Super Admin",
  },
};
