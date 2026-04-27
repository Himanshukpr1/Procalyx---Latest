const path = require("path");

/**
 * **Auth profile** (switch user + session file without changing spec code).
 * - `superadmin` (default) — `LOGIN_TEST_EMAIL` or `data/test-data.js` default → `.auth/qa-session.json`
 * - `ap_operator` — `LOGIN_TEST_EMAIL` or `LOGIN_OPERATOR_EMAIL` or `operator123@affordplan.com` → `.auth/qa-ap-operator-session.json`
 *
 * Usage (same spec files, different account):
 *   npm run test:ap-operator-suite          # login.spec + 3 module specs + dashboard.smoke
 *   npm run test:ap-operator-suite:flow
 *   AUTH_PROFILE=ap_operator npm run test:item-master:flow
 *   AUTH_PROFILE=ap_operator npm run test:auth:save:ap-operator
 * `LOGIN_TEST_EMAIL=...` overrides the email for **any** profile.
 */
const DEFAULT_OPERATOR_EMAIL = "operator123@affordplan.com";

function getAuthProfile() {
  const p = (process.env.AUTH_PROFILE || "superadmin").toLowerCase();
  if (p === "ap_operator" || p === "operator" || p === "affordplan_operator") {
    return "ap_operator";
  }
  return "superadmin";
}

/**
 * Email used for `performOtpLoginOnPage` (TC01, global-setup, `test:auth:save*`).
 * @returns {string}
 */
function getLoginEmailForAuth() {
  if (process.env.LOGIN_TEST_EMAIL && String(process.env.LOGIN_TEST_EMAIL).trim()) {
    return String(process.env.LOGIN_TEST_EMAIL).trim();
  }
  if (getAuthProfile() === "ap_operator") {
    return (process.env.LOGIN_OPERATOR_EMAIL || DEFAULT_OPERATOR_EMAIL).trim();
  }
  const testData = require("./test-data");
  return testData.login.validEmail;
}

/**
 * Session JSON path: keep Super Admin and AP Operator files separate so default suite behaviour is unchanged.
 * @returns {string}
 */
function resolveAuthStoragePath() {
  const root = path.join(__dirname, "../.auth");
  if (getAuthProfile() === "ap_operator") {
    return path.join(root, "qa-ap-operator-session.json");
  }
  return path.join(root, "qa-session.json");
}

module.exports = {
  getAuthProfile,
  getLoginEmailForAuth,
  resolveAuthStoragePath,
  DEFAULT_AP_OPERATOR_EMAIL: DEFAULT_OPERATOR_EMAIL,
};
