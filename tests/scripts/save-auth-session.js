#!/usr/bin/env node
/**
 * Manual: `npm run test:auth:save` — one OTP, writes `.auth/qa-session.json` (same file as global setup).
 */
const { saveAuthSessionViaOtp } = require("../helpers/auth-storage");

saveAuthSessionViaOtp().catch((err) => {
  console.error(err);
  process.exit(1);
});
