const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * **New Affordplan Item** — `/dashboard/item-master/add`
 */
class ItemMasterAddPage extends BasePage {
  constructor(page) {
    super(page);
    this.main = page.getByRole("main");
  }

  /**
   * Footer **Save** (SelectorsHub: `getByRole('button', { name: 'Save' })` — one match on QA).
   * @returns {import('@playwright/test').Locator}
   */
  saveButton() {
    return this.page.getByRole("button", { name: "Save", exact: true });
  }

  async expectAddFormLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/item-master\/add$/);
    await expect(this.page.getByRole("heading", { name: /new affordplan item/i })).toBeVisible({ timeout: 30_000 });
  }

  /**
   * MUI / React Select: open combobox and pick the first real option (skip “Select …”).
   * @param {RegExp} nameRe — accessible name of the field
   */
  async selectComboboxFirstOption(nameRe) {
    const cb = this.page.getByRole("combobox", { name: nameRe });
    await expect(cb.first()).toBeVisible({ timeout: 15_000 });
    await cb.first().click();

    await expect(async () => {
      const opt = this.page
        .getByRole("option")
        .filter({ hasNotText: /^\s*(select|choose)/i })
        .first();
      await expect(opt).toBeVisible({ timeout: 5_000 });
      await opt.click();
    }).toPass({ timeout: 20_000 });
    // Close MUI / portalled list so it doesn’t intercept the **Save** click.
    await this.page.keyboard.press("Escape");
  }

  /**
   * Close MUI listboxes; scroll so **Save** is in view.
   * Do not click the form surface here — a stray click can refocus a **combobox** and block the Save action.
   */
  async prepareToSubmit() {
    await this.page.keyboard.press("Escape");
    await this.page.keyboard.press("Escape");
    if ((await this.main.count()) > 0) {
      const m = this.main.first();
      await m.evaluate((el) => {
        el.scrollTo(0, el.scrollHeight);
      });
    } else {
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
  }

  /**
   * Numeric fields are often `role="spinbutton"` in MUI; try `textbox` or `spinbutton`.
   * @param {RegExp} nameRe
   * @param {string} value
   */
  async fillNumericOrTextByName(nameRe, value) {
    const loc = this.page.getByRole("textbox", { name: nameRe }).or(this.page.getByRole("spinbutton", { name: nameRe }));
    await expect(loc.first()).toBeVisible({ timeout: 10_000 });
    await loc.first().click();
    await loc.first().fill(value);
  }

  /**
   * Fills **New Affordplan Item** with unique identity fields and first options on required dropdowns.
   * **GST%**, **Unit per Pack**, **Pack MRP** must each be **1–100** (not 0).
   * @param {{ itemName: string, genericName: string, doseSize: string, hsnCode: string, gstPercent: string, unitPerPack: string, packMrp: string }} p
   */
  async fillNewAffordplanItem(p) {
    await this.page.getByRole("textbox", { name: /item name/i }).fill(p.itemName);
    await this.page.getByRole("textbox", { name: /dose\/?size/i }).fill(p.doseSize);
    await this.page.getByRole("textbox", { name: /generic name/i }).fill(p.genericName);
    await this.page.getByRole("textbox", { name: /hsn code/i }).fill(p.hsnCode);

    const gst = p.gstPercent || "10";
    const upp = p.unitPerPack || "10";
    const mrp = p.packMrp || "10";
    await this.fillNumericOrTextByName(/unit per pack/i, upp);
    await this.fillNumericOrTextByName(/gst/i, gst);
    await this.fillNumericOrTextByName(/pack mrp/i, mrp);

    // Dependent order: **Category** before **Sub Category**; **Form/Unit Type** before bare **Form** (regex).
    await this.selectComboboxFirstOption(/Category/);
    await this.selectComboboxFirstOption(/Sub Category/);
    await this.selectComboboxFirstOption(/ROA/);
    await this.selectComboboxFirstOption(/^Group/);
    await this.selectComboboxFirstOption(/Therapy Area/);
    await this.selectComboboxFirstOption(/Form\/Unit Type|Form.*Unit Type/i);
    await this.selectComboboxFirstOption(/^Form(\s*\*)?$/);
    await this.selectComboboxFirstOption(/UOM/);
    await this.selectComboboxFirstOption(/Manufacturer/);
  }

  /**
   * Wait until **Save** is enabled, then click. Uses QA locator `getByRole('button', { name: 'Save' })`.
   * Tries a normal click first, then `force: true` if MUI overlay/stacking blocks pointer events.
   */
  async clickSave() {
    await this.prepareToSubmit();
    const save = this.saveButton();
    await expect(save).toBeVisible({ timeout: 20_000 });
    await save.scrollIntoViewIfNeeded();
    await expect(async () => {
      await expect(save).toBeEnabled();
    }).toPass({ timeout: 120_000 });
    try {
      await save.click({ timeout: 10_000 });
    } catch {
      await save.click({ force: true });
    }
  }

  async expectSaveSucceeded() {
    await this.page.waitForURL(/\/dashboard\/item-master\/?$/, { timeout: 180_000 });
  }

  /**
   * TC05 — full create flow on the add screen.
   * @param {{ itemName: string, genericName: string, doseSize: string, hsnCode: string, gstPercent?: string, unitPerPack?: string, packMrp?: string }} p
   */
  async createItem(p) {
    await this.expectAddFormLoaded();
    await this.fillNewAffordplanItem(p);
    await this.clickSave();
    await this.expectSaveSucceeded();
  }
}

module.exports = { ItemMasterAddPage };
