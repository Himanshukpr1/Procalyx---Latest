const path = require("path");

/**
 * **Auth profile** (switch user + session file without changing spec code).
 * - `superadmin` (default) — `LOGIN_TEST_EMAIL` or `data/test-data.js` default → `.auth/qa-session.json`
 * - `ap_operator` — `LOGIN_TEST_EMAIL` or `LOGIN_OPERATOR_EMAIL` or `operator123@affordplan.com` → `.auth/qa-ap-operator-session.json`
 * - `hkam_operator` — `LOGIN_TEST_EMAIL` or `LOGIN_HKAM_EMAIL` or HKAM default → `.auth/qa-hkam-operator-session.json` (post-OTP **My Dashboard** context)
 *
 * Usage (same spec files, different account):
 *   npm run test:ap-operator-suite          # login.spec + 3 module specs + dashboard.smoke
 *   npm run test:ap-operator-suite:flow
 *   npm run test:hkam-operator-suite        # login + hospital + hospital-unit masters
 *   AUTH_PROFILE=ap_operator npm run test:item-master:flow
 *   AUTH_PROFILE=ap_operator npm run test:auth:save:ap-operator
 *   AUTH_PROFILE=hkam_operator npm run test:auth:save:hkam-operator
 * `LOGIN_TEST_EMAIL=...` overrides the email for **any** profile.
 */
const DEFAULT_OPERATOR_EMAIL = "operator123@affordplan.com";
/** QA HKAM operator — override with `LOGIN_HKAM_EMAIL`. */
const DEFAULT_HKAM_EMAIL = "hkamap@yopmail.com";

function getAuthProfile() {
  const p = (process.env.AUTH_PROFILE || "superadmin").toLowerCase().replace(/-/g, "_");
  if (p === "ap_operator" || p === "operator" || p === "affordplan_operator") {
    return "ap_operator";
  }
  if (p === "hkam_operator" || p === "hkam") {
    return "hkam_operator";
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
  if (getAuthProfile() === "hkam_operator") {
    return (process.env.LOGIN_HKAM_EMAIL || DEFAULT_HKAM_EMAIL).trim();
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
  if (getAuthProfile() === "hkam_operator") {
    return path.join(root, "qa-hkam-operator-session.json");
  }
  return path.join(root, "qa-session.json");
}

/**
 * Auth **login** route (path or hash-router), for session checks aligned with `dashboard.smoke.authenticated.spec.js`.
 * @param {string} urlString
 */
function urlPathIsLoginPage(urlString) {
  try {
    const u = new URL(urlString);
    const p = u.pathname.replace(/\/$/, "") || "/";
    if (p === "/login" || p.startsWith("/login/")) {
      return true;
    }
    const h = (u.hash || "").replace(/^#/, "");
    if (/^\/?login(\/|\?|$)/i.test(h)) {
      return true;
    }
    return false;
  } catch {
    return /(^|\/)login(\/|\?|$)/i.test(urlString);
  }
}

module.exports = {
  getAuthProfile,
  getLoginEmailForAuth,
  resolveAuthStoragePath,
  urlPathIsLoginPage,
  DEFAULT_AP_OPERATOR_EMAIL: DEFAULT_OPERATOR_EMAIL,
  DEFAULT_HKAM_EMAIL,
};
