const path = require("path");

/**
 * Central place for URLs, timeouts, and static test data.
 * Override BASE_URL via environment: BASE_URL=https://your-app.com npm test
 */
module.exports = {
  baseUrl: process.env.BASE_URL || "https://qa.procalyx.net",
  loginPath: "/login",
  /** Post-login User Management module */
  userManagementPath: "/dashboard/user-management",
  defaultTimeoutMs: 15_000,
  /** Written by login TC 08 — use with `storageState` in Playwright */
  authStoragePath: path.join(__dirname, "../.auth/qa-session.json"),
};
