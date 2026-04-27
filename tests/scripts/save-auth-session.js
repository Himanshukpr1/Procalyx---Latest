#!/usr/bin/env node
/**
 * Manual: `npm run test:auth:save` (Super Admin) or `npm run test:auth:save:ap-operator` — one OTP, writes
 * `data/env.js`’s `authStoragePath` (see `data/auth-profiles.js`).
 */
const { saveAuthSessionViaOtp } = require("../helpers/auth-storage");

saveAuthSessionViaOtp().catch((err) => {
  console.error(err);
  process.exit(1);
});
