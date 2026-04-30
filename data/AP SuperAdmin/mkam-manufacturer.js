/**
 * MKAM operator — **Manufacturer Management** create payload (`/mkam/manufacturer-management/add`).
 * PAN / GST formats enforced via `buildManufacturerOnboardingEditPayload`.
 */
const { buildManufacturerOnboardingEditPayload, uniqueMfgSubsidiaryName } = require("./manufacturer-masters");

/**
 * Full create payload for MKAM Add Manufacturer (sections mirror onboarding edit field names).
 */
function buildMkamManufacturerPayload() {
  const seedName = uniqueMfgSubsidiaryName("Auto MKAM MFG");
  /** `seedName` seeds unique **MFG Legal Name** etc.; **MFG Name** combobox picks an existing master row only (see MkamManufacturerAddPage). */
  return buildManufacturerOnboardingEditPayload(seedName);
}

module.exports = {
  buildMkamManufacturerPayload,
};
