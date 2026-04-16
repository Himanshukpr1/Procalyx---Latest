/**
 * Builds unique profile data for User Management create-user flows.
 * Matches QA form: **Full Name** (single field), Email Address, Contact Number, etc.
 */
function randomDigits(len) {
  let s = "";
  for (let i = 0; i < len; i += 1) {
    s += Math.floor(Math.random() * 10).toString();
  }
  return s;
}

/**
 * @param {string} [key] seed for uniqueness in parallel runs
 * @returns {{ fullName: string, email: string, mobile: string, designation: string }}
 */
function buildRandomUserProfile(key = "u") {
  const id = `${Date.now()}-${key}-${randomDigits(4)}`;
  const safe = id.replace(/[^a-z0-9]/gi, "");
  return {
    fullName: `Auto User ${id}`,
    email: `auto.${safe}@yopmail.com`,
    mobile: `9${randomDigits(9)}`,
    designation: `Auto QA ${randomDigits(4)}`,
  };
}

module.exports = { buildRandomUserProfile, randomDigits };
