const path = require("path");
const { resolveAuthStoragePath } = require("./auth-profiles");

/**
 * Central place for URLs, timeouts, and static test data.
 * Override BASE_URL via environment: BASE_URL=https://your-app.com npm test
 * Auth session file: `AUTH_PROFILE=superadmin|ap_operator` — see `data/auth-profiles.js`.
 */
module.exports = {
  baseUrl: process.env.BASE_URL || "https://qa.procalyx.net",
  loginPath: "/login",
  /** Post-login User Management module */
  userManagementPath: "/dashboard/user-management",
  /** Hospital Onboarding → Hospital (list + add) */
  hospitalMastersPath: "/dashboard/hospital-masters",
  hospitalMastersAddPath: "/dashboard/hospital-masters/add",
  /** Hospital Onboarding → Hospital Unit (list + add) */
  hospitalUnitMastersPath: "/dashboard/hospital-unit-masters",
  hospitalUnitMastersAddPath: "/dashboard/hospital-unit-masters/add",
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
  /** Cookie/storage file for the active `AUTH_PROFILE` (Super Admin or AP operator). */
  authStoragePath: resolveAuthStoragePath(),
};
