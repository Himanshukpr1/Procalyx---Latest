/**
 * Static and generated data for **Manufacturer Item** mapping (`/dashboard/manufacturer-item/add`).
 */
module.exports = {
  /** TC05 — AffordPlan Generic Item search (listbox) */
  affordplanGenericItemSearch: "Genexol 350",
  /** TC08 */
  remarksText: "Test Automation Suite",

  /**
   * Unique item code / name so TC10 can find the row without collisions.
   * @returns {{ itemCode: string, itemName: string }}
   */
  buildManufacturerItemPayload() {
    const ts = Date.now();
    return {
      itemCode: `AUTO-MFG-ITEM-${ts}`,
      itemName: `Auto Mfg Item ${ts}`,
    };
  },
};
