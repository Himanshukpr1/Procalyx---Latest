/**
 * **Affordplan Master** → **Item Master** — `/dashboard/item-master`, `/add`.
 */
function intString1to100() {
  return String(Math.floor(Math.random() * 100) + 1);
}

module.exports = {
  listPath: "/dashboard/item-master",
  addPath: "/dashboard/item-master/add",

  /**
   * **GST%**, **Unit per Pack**, **Pack MRP** must be between **1** and **100** (QA does not accept 0).
   * @returns {{ itemName: string, genericName: string, doseSize: string, hsnCode: string, gstPercent: string, unitPerPack: string, packMrp: string }}
   */
  buildItemMasterPayload() {
    const ts = Date.now();
    return {
      itemName: `Auto AP Item ${ts}`,
      genericName: `Generic Auto ${ts}`,
      doseSize: "10 mg",
      hsnCode: "30049099",
      gstPercent: intString1to100(),
      unitPerPack: intString1to100(),
      packMrp: intString1to100(),
    };
  },
};
