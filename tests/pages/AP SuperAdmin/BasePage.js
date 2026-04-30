/**
 * Base page object — extend for each app area.
 */
const { expect } = require("@playwright/test");

class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * @param {string} [path]
   * @param {import('@playwright/test').PageGotoOptions} [options]
   */
  async goto(path = "/", options) {
    await this.page.goto(path, options);
  }

  /**
   * MUI drawer can lag behind `domcontentloaded`. Wait until a **visible** primary nav item exists.
   * Avoid `getByText(/^dashboard$/i).first()` — that often resolves to a hidden node and breaks Super Admin while HKAM passes.
   */
  async waitForAppShellSidebarReady() {
    await expect(async () => {
      const p = this.page;
      const blocks = [
        p.getByRole("link", { name: /^dashboard$/i }),
        p.getByRole("button", { name: /^dashboard$/i }),
        p.getByRole("treeitem", { name: /^dashboard$/i }),
        p.getByRole("button", { name: /hospital onboarding/i }),
        p.getByRole("treeitem", { name: /hospital onboarding/i }),
        p.getByRole("link", { name: /^Hospital(\s+Master(s)?)?$/i }),
        p.getByRole("button", { name: /^Hospital(\s+Master(s)?)?$/i }),
        p.getByRole("link", { name: /^Hospital Unit(\s+Master(s)?)?$/i }),
        p.getByRole("button", { name: /^Hospital Unit(\s+Master(s)?)?$/i }),
        p.getByRole("link", { name: /manufacturer masters/i }),
        p.getByRole("button", { name: /manufacturer masters/i }),
      ];
      let anyVisible = false;
      for (const loc of blocks) {
        const n = await loc.count();
        for (let i = 0; i < n; i++) {
          if (await loc.nth(i).isVisible().catch(() => false)) {
            anyVisible = true;
            break;
          }
        }
        if (anyVisible) break;
      }
      expect(anyVisible).toBe(true);
    }).toPass({ timeout: 45_000 });
  }

  /** @param {import('@playwright/test').Locator} loc */
  async anyLocatorVisible(loc) {
    const n = await loc.count();
    for (let i = 0; i < n; i++) {
      if (await loc.nth(i).isVisible().catch(() => false)) return true;
    }
    return false;
  }

  /**
   * MUI multi-select / autocomplete: picking an option often leaves `[role=listbox]` visible (sometimes portaled),
   * blocking fields below. Retries Escape until none visible; optional blur click when Escape is insufficient.
   * @param {import('@playwright/test').Locator} [blurLocator] — e.g. another control in the same section to steal focus
   */
  async dismissVisibleAutocompleteListboxes(blurLocator) {
    await expect(async () => {
      const lbs = this.page.getByRole("listbox");
      const n = await lbs.count();
      let visible = false;
      for (let i = 0; i < n; i++) {
        if (await lbs.nth(i).isVisible().catch(() => false)) {
          visible = true;
          break;
        }
      }
      if (!visible) return;
      await this.page.keyboard.press("Escape");
      throw new Error("listbox still visible");
    }).toPass({ timeout: 15_000 });

    let stillOpen = false;
    const lbs = this.page.getByRole("listbox");
    const n = await lbs.count();
    for (let i = 0; i < n; i++) {
      if (await lbs.nth(i).isVisible().catch(() => false)) {
        stillOpen = true;
        break;
      }
    }
    if (!stillOpen) return;

    if (!blurLocator) {
      throw new Error(
        "Autocomplete listbox still visible after Escape; pass blurLocator (e.g. Registered office address textarea — avoid Legal Name; it can re-open Category above)."
      );
    }

    await blurLocator.click({ force: true });
    await expect(async () => {
      const boxes = this.page.getByRole("listbox");
      const c = await boxes.count();
      for (let j = 0; j < c; j++) {
        if (await boxes.nth(j).isVisible().catch(() => false)) throw new Error("open");
      }
    }).toPass({ timeout: 10_000 });
  }

  /**
   * Waits until no `[role=listbox]` is visible (popover closed). Does **not** press Escape — Escape on MUI
   * Autocomplete often clears an uncommitted / pending selection (e.g. MKAM **MFG Name** search).
   */
  async expectNoVisibleAutocompleteListbox() {
    await expect(async () => {
      const lbs = this.page.getByRole("listbox");
      const n = await lbs.count();
      for (let i = 0; i < n; i++) {
        if (await lbs.nth(i).isVisible().catch(() => false)) throw new Error("listbox visible");
      }
    }).toPass({ timeout: 15_000 });
  }

  /**
   * **MFG Information** — Country / State / City. Category & Therapy are `role=combobox`; MKAM **Add**
   * often adds **MFG Name / subsidiary** search (`nth` scan mis-picks it as Country).
   * Prefer geographic accessible names; else skip category/therapy **and** subsidiary/MFG-name combos.
   * @param {import('@playwright/test').Locator} infoRegion
   */
  async getMfgInformationLocationCascade(infoRegion) {
    const byAccessibleName = async () => {
      const country = infoRegion.getByRole("combobox", { name: /^Country\b/i });
      const state = infoRegion.getByRole("combobox", { name: /^State\b/i });
      const city = infoRegion.getByRole("combobox", { name: /^City\b/i });
      if (
        (await country.count()) === 0 ||
        (await state.count()) === 0 ||
        (await city.count()) === 0
      ) {
        return null;
      }
      return { country: country.first(), state: state.first(), city: city.first() };
    };

    const named = await byAccessibleName();
    if (named) return named;

    const isExcludedCombo = async (cb) => {
      const inner = cb.locator("input, textarea").first();
      const ph = ((await inner.getAttribute("placeholder")) || "").trim();
      const nm = ((await inner.getAttribute("name")) || "").trim();
      const aria = ((await inner.getAttribute("aria-label")) || "").trim();
      const blob = `${ph} ${nm} ${aria}`;

      if (/categories/i.test(ph)) return true;
      if (/therapy/i.test(ph)) return true;

      /** MKAM Add — **MFG Name** row (`Search manufacturer...`) sits above Legal Name (still `role=combobox`). */
      if (/search\s+manufacturer/i.test(ph)) return true;

      /** MKAM Add / search flows — subsidiary row can sit above Country (still `role=combobox`). */
      if (/subsidiary|mfgSubsidiary|parentMfg|parent\s*mfg/i.test(nm)) return true;
      if (/subsidiary|\bmfg\s*name\b|search.*mfg|mfg.*search/i.test(blob)) return true;
      if (/info\.mfgName\b|^mfgName$/i.test(nm)) return true;

      return false;
    };

    const cbs = infoRegion.getByRole("combobox");
    await expect(cbs.first()).toBeVisible({ timeout: 20_000 });
    const n = await cbs.count();
    const indices = [];
    for (let i = 0; i < n; i++) {
      const cb = cbs.nth(i);
      if (await isExcludedCombo(cb)) continue;
      indices.push(i);
    }
    if (indices.length < 3) {
      throw new Error(
        `MFG Information: need 3 location comboboxes after excluding category/therapy/MFG Name rows; found ${indices.length}.`,
      );
    }
    return {
      country: cbs.nth(indices[0]),
      state: cbs.nth(indices[1]),
      city: cbs.nth(indices[2]),
    };
  }

  /**
   * Super Admin: **Hospital Onboarding** accordion is collapsed after a full `goto(appHomePath)` in TC03.
   * Expand once so **Hospital** / **Hospital Unit** children exist (no-op when control missing — e.g. HKAM).
   * @returns {Promise<boolean>} whether an onboarding control was clicked
   */
  async tryExpandHospitalOnboardingSidebar() {
    const p = this.page;
    const clickFirstVisible = async (loc) => {
      const n = await loc.count();
      for (let i = 0; i < n; i++) {
        const el = loc.nth(i);
        if (await el.isVisible().catch(() => false)) {
          await el.click();
          return true;
        }
      }
      return false;
    };
    if (await clickFirstVisible(p.getByRole("button", { name: /hospital onboarding/i }))) return true;
    if (await clickFirstVisible(p.getByRole("treeitem", { name: /hospital onboarding/i }))) return true;
    if (await clickFirstVisible(p.getByText("Hospital Onboarding", { exact: false }))) return true;
    return false;
  }
}

module.exports = { BasePage };
