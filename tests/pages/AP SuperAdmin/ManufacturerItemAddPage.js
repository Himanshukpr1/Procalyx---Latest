const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * **Manufacturer Item** form — create (`/add`) or **edit** (Actions → pencil on a row; no Add New on the list in current QA).
 */
class ManufacturerItemAddPage extends BasePage {
  constructor(page) {
    super(page);
    this.saveButton = page.getByRole("button", { name: /^Save$/i });
  }

  async expectAddManufacturerItemFormLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-item\/add/);
    await expect(this.page.getByRole("heading", { name: /new manufacturer item mapping/i })).toBeVisible({
      timeout: 30_000,
    });
  }

  /**
   * True if we are already on the **edit** form (e.g. after TC04) — skip navigating to the list and clicking edit again in TC05.
   */
  async isOnEditView() {
    const u = this.page.url();
    if (/\/manufacturer-item\/.*(edit|\/edit)/i.test(u) || (/\/manufacturer-item/i.test(u) && u.toLowerCase().includes("edit") && !/\/manufacturer-item\/?$/.test(u))) {
      return true;
    }
    if (await this.page.getByRole("dialog").first().isVisible().catch(() => false)) {
      if (await this.saveButton.isVisible().catch(() => false)) {
        return true;
      }
    }
    return false;
  }

  /** After **Actions** → edit on a list row (same fields as the old /add form; Add New is no longer on the list). */
  async expectEditManufacturerItemFormLoaded() {
    await expect(
      this.page.getByRole("heading", { name: /manufacturer item|item mapping|edit manufacturer/i })
    ).toBeVisible({ timeout: 30_000 });
    await expect(this.saveButton).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Dismiss the Autocomplete list so focus does not keep filtering / “searching” the next field.
   */
  async _closeAffordplanDropdownIfOpen() {
    if (await this.page.getByRole("listbox").isVisible().catch(() => false)) {
      await this.page.keyboard.press("Escape");
    }
  }

  /**
   * TC05 — **AffordPlan Generic Item** (MUI Autocomplete). Clears any prior value (edit forms often
   * rehydrate; `fill('')` alone is unreliable on consecutive runs), types the full query with
   * `pressSequentially` (debounced search), then waits for the listbox + options before selecting.
   * @param {string} searchText — e.g. `Genexol 350` from `data/manufacturer-item`
   */
  async fillAffordplanGenericItem(searchText) {
    const wanted = searchText.trim();
    if (!wanted) {
      throw new Error("fillAffordplanGenericItem: searchText is empty");
    }
    // Flexible match: "Genexol 350" vs "Genexol  350" / line breaks in MUI options
    const matchRe = new RegExp(
      wanted
        .split(/\s+/)
        .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("\\s*"),
      "i"
    );

    await this._closeAffordplanDropdownIfOpen();
    await this.page.keyboard.press("Escape");

    const inForm = this.page.getByRole("main").getByPlaceholder(/search by item name/i);
    const field =
      (await inForm.count()) > 0 ? inForm.first() : this.page.getByPlaceholder(/search by item name/i).first();
    await expect(field).toBeVisible({ timeout: 30_000 });
    await field.scrollIntoViewIfNeeded();
    await field.focus();
    await field.click();

    await this._clearAutocompleteSearchField(field);
    await expect
      .poll(async () => (await field.inputValue()).trim(), { timeout: 5_000 })
      .toBe("");

    /** Debounced server/typeahead search — headless needs slightly slower typing than headed. */
    await field.pressSequentially(wanted, { delay: 90 });

    await expect
      .poll(
        async () => {
          const lb = await this._listboxForAffordplanField(field);
          if (!(await lb.isVisible().catch(() => false))) {
            return -1;
          }
          return await lb.getByRole("option").count();
        },
        { timeout: 40_000, intervals: [150, 300, 500, 800] }
      )
      .toBeGreaterThan(0);

    const listbox = await this._listboxForAffordplanField(field);
    await expect(listbox).toBeVisible({ timeout: 15_000 });
    const option = listbox.getByRole("option").filter({ hasText: matchRe }).first();
    await expect(option).toBeVisible({ timeout: 25_000 });
    await option.scrollIntoViewIfNeeded();
    try {
      await option.click({ timeout: 12_000 });
    } catch {
      await option.click({ force: true, timeout: 12_000 });
    }
    await expect
      .poll(async () => (await field.inputValue()).trim().length, { timeout: 15_000 })
      .toBeGreaterThan(0);

    await field.blur();
    await this._closeAffordplanDropdownIfOpen();
  }

  /**
   * Remove previous selection / text. MUI Autocomplete + edit screens often keep internal state; second
   * test runs can leave "genexol" without "350" if not fully cleared.
   * @param {import('@playwright/test').Locator} field
   */
  async _clearAutocompleteSearchField(field) {
    const root = field.locator("xpath=ancestor::div[contains(@class, 'MuiAutocomplete-root')][1]");
    const clearBtn = root.locator(
      "button[title='Clear'], .MuiAutocomplete-clearIndicator, [data-testid='CloseIcon']"
    );
    if (await clearBtn.first().isVisible().catch(() => false)) {
      await clearBtn.first().click();
    }
    await field.clear();
    let v = await field.inputValue();
    if (v.trim() !== "") {
      await this.page.keyboard.press("Control+a");
      await this.page.keyboard.press("Backspace");
      v = await field.inputValue();
    }
    if (v.trim() !== "") {
      await field.fill("");
    }
  }

  /**
   * MUI Autocomplete: the input gets `aria-controls` pointing at the `listbox` (more stable than
   * `.MuiAutocomplete-popper … :last()` when multiple poppers exist in the DOM). Falls back to a
   * visible listbox in the current popper.
   * @param {import('@playwright/test').Locator} field
   * @returns {Promise<import('@playwright/test').Locator>}
   */
  async _listboxForAffordplanField(field) {
    const raw =
      (await field.getAttribute("aria-controls"))?.trim() || (await field.getAttribute("aria-owns"))?.trim();
    if (raw) {
      const byId = this.page.locator(`[id="${ManufacturerItemAddPage._quoteAttr(raw)}"]`);
      if ((await byId.count()) > 0) {
        return byId;
      }
    }
    return this.page.locator(".MuiAutocomplete-popper:visible, .MuiPopper-root:visible").locator("[role='listbox']").first();
  }

  /** @param {string} v */
  static _quoteAttr(v) {
    return v.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
  }

  /**
   * TC06 — **Item Code** (distinct from **AP Item Code** when both exist).
   * @param {string} code
   */
  async fillItemCode(code) {
    const exact = this.page.getByRole("textbox", { name: /^Item Code$/i });
    if ((await exact.count()) > 1) {
      await exact.last().scrollIntoViewIfNeeded();
      await exact.last().fill(code);
    } else if ((await exact.count()) === 1) {
      await exact.scrollIntoViewIfNeeded();
      await exact.fill(code);
    } else {
      const byLabel = this.page.locator("label").filter({ hasText: /^Item Code$/i }).first();
      await byLabel.scrollIntoViewIfNeeded();
      await byLabel.locator("xpath=following::input[1]").fill(code);
    }
  }

  /**
   * TC07 — **Item Name** (required; distinct from **AP Item Name** when both exist).
   * @param {string} name
   */
  async fillItemName(name) {
    const exact = this.page.getByRole("textbox", { name: /^Item Name$/i });
    if ((await exact.count()) > 1) {
      await exact.last().scrollIntoViewIfNeeded();
      await exact.last().fill(name);
    } else if ((await exact.count()) === 1) {
      await exact.scrollIntoViewIfNeeded();
      await exact.fill(name);
    } else {
      const byLabel = this.page.locator("label").filter({ hasText: /^Item Name/ }).filter({ hasNotText: /AP/i }).first();
      await byLabel.scrollIntoViewIfNeeded();
      await byLabel.locator("xpath=following::input[1]").fill(name);
    }
  }

  /**
   * TC08 — **Remarks** (textarea).
   * @param {string} text
   */
  async fillRemarks(text) {
    const byRole = this.page.getByRole("textbox", { name: /remarks/i });
    if ((await byRole.count()) > 0) {
      await byRole.last().scrollIntoViewIfNeeded();
      await byRole.last().fill(text);
      return;
    }
    await this.page.locator("textarea").last().scrollIntoViewIfNeeded();
    await this.page.locator("textarea").last().fill(text);
  }

  async clickSave() {
    await this.saveButton.scrollIntoViewIfNeeded();
    await expect(this.saveButton).toBeEnabled();
    await this.saveButton.click();
  }

  async expectSaveSucceeded() {
    await this.page.waitForURL(/\/dashboard\/manufacturer-item\/?$/, { timeout: 120_000 });
  }
}

module.exports = { ManufacturerItemAddPage };
