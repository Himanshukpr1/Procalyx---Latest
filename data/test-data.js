/**
 * Test data for automation — login and future flows.
 * Override via env when needed (e.g. CI secrets):
 *   LOGIN_TEST_EMAIL=... LOGIN_INVALID_EMAIL=... npm test
 * AP operator (separate session file) uses `AUTH_PROFILE=ap_operator` — see `data/auth-profiles.js`.
 */

module.exports = {
  login: {
    /** Used when the app should reject the address (format, domain, or not registered) */
    invalidEmail: process.env.LOGIN_INVALID_EMAIL || "himanshu@ap.com",
    /** Used for successful login / next-step flows on QA */
    validEmail: process.env.LOGIN_TEST_EMAIL || "superadminap@yopmail.com",
    /**
     * If the API does not return `"otp"` in the body (common in prod), set for TC 08:
     *   LOGIN_OTP=123456 npm test
     */
    manualOtp: process.env.LOGIN_OTP || "",
  },
};
