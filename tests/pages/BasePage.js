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
