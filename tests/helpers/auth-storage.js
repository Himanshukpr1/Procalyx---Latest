const fs = require("fs");
const path = require("path");

/** Saved after successful login (TC 08) — reuse with Playwright `storageState` */
function getAuthStoragePath() {
  return path.join(__dirname, "../../.auth/qa-session.json");
}

/**
 * Persist cookies + localStorage so other tests can skip OTP.
 * @param {import('@playwright/test').BrowserContext} context
 */
async function saveLoggedInSession(context) {
  const file = getAuthStoragePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await context.storageState({ path: file });
}

module.exports = { getAuthStoragePath, saveLoggedInSession };
