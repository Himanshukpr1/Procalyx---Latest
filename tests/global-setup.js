const fs = require("fs");
const env = require("../data/AP SuperAdmin/env");
const { saveAuthSessionViaOtp } = require("./helpers/auth-storage");

/**
 * If CLI limits to `--project chromium` only, skip OTP (authenticated specs use another project).
 */
function willRunAuthenticatedProjectOrSpecs() {
  const argv = process.argv;
  const projects = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--project" && argv[i + 1]) {
      projects.push(argv[i + 1]);
    } else if (argv[i].startsWith("--project=")) {
      projects.push(argv[i].slice("--project=".length));
    }
  }
  if (projects.length === 0) {
    return true;
  }
  if (projects.some((p) => p.includes("authenticated"))) {
    return true;
  }
  const joined = argv.join(" ");
  return /\.authenticated\.spec\.|chromium-authenticated/.test(joined);
}

/**
 * Runs once before all workers. Creates `.auth/qa-session.json` when missing (one OTP for the whole run).
 * - `REFRESH_AUTH=1` — force new OTP + overwrite file.
 * - `SKIP_GLOBAL_AUTH=1` — skip (no file created; use TC01 OTP or `npm run test:auth:save`).
 */
module.exports = async function globalSetup() {
  if (process.env.SKIP_GLOBAL_AUTH === "1") {
    console.log("[global-setup] SKIP_GLOBAL_AUTH=1 — not writing session");
    return;
  }
  if (!willRunAuthenticatedProjectOrSpecs()) {
    console.log("[global-setup] Skipping auth (no authenticated project in this run)");
    return;
  }
  if (fs.existsSync(env.authStoragePath) && process.env.REFRESH_AUTH !== "1") {
    console.log("[global-setup] Reusing", env.authStoragePath);
    return;
  }
  await saveAuthSessionViaOtp();
};
