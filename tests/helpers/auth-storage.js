const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");
const env = require("../../data/env");
const { performOtpLoginOnPage } = require("./otp-login");

/** @deprecated use `env.authStoragePath` — kept for login.spec.js */
function getAuthStoragePath() {
  return env.authStoragePath;
}

/**
 * Persist cookies + localStorage so other tests can skip OTP.
 * @param {import('@playwright/test').BrowserContext} context
 */
async function saveLoggedInSession(context) {
  const file = env.authStoragePath;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await context.storageState({ path: file });
}

/**
 * For `browser.newContext({ storageState })` in authenticated suites.
 * Reuses `.auth/qa-session.json` when present so parallel workers do not each trigger OTP.
 * Set `FORCE_OTP_LOGIN=1` to ignore the file (fresh login in TC01).
 */
function getStorageStateForAuthenticatedSuite() {
  if (process.env.FORCE_OTP_LOGIN === "1") {
    return { cookies: [], origins: [] };
  }
  if (fs.existsSync(env.authStoragePath)) {
    return env.authStoragePath;
  }
  return { cookies: [], origins: [] };
}

/**
 * One OTP login + write `env.authStoragePath`. Used by global setup and `npm run test:auth:save`.
 */
async function saveAuthSessionViaOtp() {
  fs.mkdirSync(path.dirname(env.authStoragePath), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: process.env.BASE_URL || env.baseUrl,
  });
  const page = await context.newPage();
  await performOtpLoginOnPage(page);
  await context.storageState({ path: env.authStoragePath });
  await browser.close();
  console.log("[auth] Saved session to", env.authStoragePath);
}

module.exports = {
  getAuthStoragePath,
  saveLoggedInSession,
  getStorageStateForAuthenticatedSuite,
  saveAuthSessionViaOtp,
};
