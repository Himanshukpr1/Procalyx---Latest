const { resolveAuthStoragePath, getAuthProfile } = require("./auth-profiles");

/**
 * Central place for URLs, timeouts, and static test data.
 * Override BASE_URL via environment: BASE_URL=https://your-app.com npm test
 * Auth session file: `AUTH_PROFILE=superadmin|ap_operator|hkam_operator|mkam_operator` — see `data/auth-profiles.js`.
 *
 * **HKAM** (`hkam_operator`): `/hkam` + `/hkam/hospital-…`
 * **MKAM** (`mkam_operator`): `/mkam` + `/mkam/manufacturer-management` (Manufacturer Management)
 * Others: `/dashboard/…`
 */
module.exports = {
  baseUrl: process.env.BASE_URL || "https://qa.procalyx.net",
  loginPath: "/login",
  /** Post-login User Management module */
  userManagementPath: "/dashboard/user-management",
  /** Affordplan Master → Manufacturer Masters (data operators) */
  manufacturerMastersApPath: "/dashboard/manufacturer-masters-ap",
  manufacturerMastersApAddPath: "/dashboard/manufacturer-masters-ap/add",
  /** Sidebar **Manufacturer Onboarding** — KAM list + full edit form */
  manufacturerOnboardingPath: "/dashboard/manufacturer-masters",
  manufacturerOnboardingEditPathPattern: /\/dashboard\/manufacturer-masters\/edit\//,
  /** Manufacturer Masters → **Manufacturer Item** (list + add mapping) */
  manufacturerItemPath: "/dashboard/manufacturer-item",
  manufacturerItemAddPath: "/dashboard/manufacturer-item/add",
  defaultTimeoutMs: 15_000,
  /** Cookie/storage file for the active `AUTH_PROFILE`. */
  authStoragePath: resolveAuthStoragePath(),

  get appHomePath() {
    const p = getAuthProfile();
    if (p === "hkam_operator") return "/hkam";
    if (p === "mkam_operator") return "/mkam";
    return "/dashboard";
  },

  get hospitalMastersPath() {
    return getAuthProfile() === "hkam_operator" ? "/hkam/hospital-management" : "/dashboard/hospital-masters";
  },
  get hospitalMastersAddPath() {
    return getAuthProfile() === "hkam_operator"
      ? "/hkam/hospital-management/add"
      : "/dashboard/hospital-masters/add";
  },
  get hospitalUnitMastersPath() {
    return getAuthProfile() === "hkam_operator"
      ? "/hkam/hospital-unit-management"
      : "/dashboard/hospital-unit-masters";
  },
  get hospitalUnitMastersAddPath() {
    return getAuthProfile() === "hkam_operator"
      ? "/hkam/hospital-unit-management/add"
      : "/dashboard/hospital-unit-masters/add";
  },
  get hospitalMastersListUrlRe() {
    return getAuthProfile() === "hkam_operator"
      ? /\/hkam\/hospital-management\/?$/
      : /\/dashboard\/hospital-masters\/?$/;
  },
  get hospitalMastersAddUrlRe() {
    return getAuthProfile() === "hkam_operator"
      ? /\/hkam\/hospital-management\/add/
      : /\/dashboard\/hospital-masters\/add/;
  },
  get hospitalUnitMastersListUrlRe() {
    return getAuthProfile() === "hkam_operator"
      ? /\/hkam\/hospital-unit-management\/?$/
      : /\/dashboard\/hospital-unit-masters\/?$/;
  },
  get hospitalUnitMastersAddUrlRe() {
    return getAuthProfile() === "hkam_operator"
      ? /\/hkam\/hospital-unit-management\/add/
      : /\/dashboard\/hospital-unit-masters\/add/;
  },

  /** MKAM operator — Manufacturer Management list */
  get mkamManufacturerManagementPath() {
    return "/mkam/manufacturer-management";
  },
  /** MKAM — Add New Manufacturer */
  get mkamManufacturerManagementAddPath() {
    return "/mkam/manufacturer-management/add";
  },
  get mkamManufacturerManagementListUrlRe() {
    return /\/mkam\/manufacturer-management\/?$/;
  },
  get mkamManufacturerManagementAddUrlRe() {
    return /\/mkam\/manufacturer-management\/add/;
  },
};
