const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * @typedef {{
 *   id: string,
 *   listPath: string,
 *   addPath: string,
 *   listUrlRe: RegExp,
 *   addUrlRe: RegExp,
 *   sidebarLabel: string,
 *   listHeadingRe: RegExp,
 *   addHeadingRe: RegExp,
 *   nameFieldLabelRe: RegExp,
 *   nameColumnHeaderRe: RegExp,
 * }} AffordplanSubmoduleConfig
 */

/**
 * Affordplan Master → Therapy, Form, … — shared list + sidebar behaviour.
 */
class AffordplanMasterSubmoduleListPage extends BasePage {
  constructor(page) {
    super(page);
    this.addNewButton = page.getByRole("button", { name: /add new/i });
    this.table = page.locator("table").first();
  }

  /** TC02 — expand **Affordplan Master** in the left menu. */
  async clickAffordplanMasterNav() {
    await this.page.waitForLoadState("domcontentloaded");
    const byButton = this.page.getByRole("button", { name: /affordplan master/i });
    if ((await byButton.count()) > 0) {
      await byButton.first().click();
      return;
    }
    const byTree = this.page.getByRole("treeitem", { name: /affordplan master/i });
    if ((await byTree.count()) > 0) {
      await byTree.first().click();
      return;
    }
    const text = this.page.getByText("Affordplan Master", { exact: false });
    await expect(text.first()).toBeVisible({ timeout: 30_000 });
    await text.first().click();
  }

  /**
   * Open a sub-module from the sidebar (e.g. **Therapy**, **Form/Unit Type**).
   * @param {string} sidebarLabel
   */
  async clickSubmoduleSidebarLink(sidebarLabel) {
    const byLink = this.page.getByRole("link", { name: sidebarLabel });
    if ((await byLink.count()) > 0) {
      await byLink.first().click();
    } else {
      const label = this.page.getByText(sidebarLabel, { exact: true });
      await expect(label.first()).toBeVisible({ timeout: 30_000 });
      await label.first().click();
    }
  }

  /**
   * @param {AffordplanSubmoduleConfig} cfg
   */
  async openList(cfg) {
    await this.goto(cfg.listPath);
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * @param {AffordplanSubmoduleConfig} cfg
   */
  async expectListVisible(cfg) {
    await expect(this.page).toHaveURL(cfg.listUrlRe);
    await expect(this.page.getByRole("heading", { name: cfg.listHeadingRe }).first()).toBeVisible({ timeout: 30_000 });
  }

  async expectAddNewButtonClickable() {
    await expect(this.addNewButton).toBeVisible({ timeout: 30_000 });
    await expect(this.addNewButton).toBeEnabled();
  }

  /**
   * @param {AffordplanSubmoduleConfig} cfg
   */
  async clickAddNew(cfg) {
    await this.addNewButton.click();
    await expect(this.page).toHaveURL(cfg.addUrlRe);
  }

  /**
   * Filter by the **Name** column (header text matches `cfg.nameColumnHeaderRe`) and assert the row exists.
   * @param {AffordplanSubmoduleConfig} cfg
   * @param {string} displayName
   */
  async expectListedByNameSearch(cfg, displayName) {
    await this.openList(cfg);
    const table = this.table;
    await expect(table).toBeVisible({ timeout: 30_000 });

    const thead = table.locator("thead");
    const headerRow = thead.locator("tr").first();
    const headerCells = headerRow.locator("th, td");
    const n = await headerCells.count();
    let colIdx = -1;
    for (let i = 0; i < n; i++) {
      const t = (await headerCells.nth(i).innerText()).trim();
      if (cfg.nameColumnHeaderRe.test(t)) {
        colIdx = i;
        break;
      }
    }
    if (colIdx < 0) {
      for (let i = 0; i < n; i++) {
        const t = (await headerCells.nth(i).innerText()).trim();
        if (/\bname\b/i.test(t) && !/code/i.test(t)) {
          colIdx = i;
          break;
        }
      }
    }
    if (colIdx < 0 && n >= 2) {
      colIdx = 1;
    }

    if (colIdx >= 0 && (await thead.locator("tr").count()) > 1) {
      const filterRow = thead.locator("tr").nth(1);
      const cell = filterRow.locator("th, td").nth(colIdx);
      const inp = cell.locator('input[type="text"], input[type="search"]').first();
      if ((await inp.count()) > 0) {
        await inp.fill(displayName);
      }
    } else {
      const headerInputs = thead.locator('input[type="text"], input[type="search"]');
      const count = await headerInputs.count();
      if (count > 0) {
        const idx = colIdx >= 0 && colIdx < count ? colIdx : Math.min(1, count - 1);
        await headerInputs.nth(idx).fill(displayName);
      }
    }

    await expect(async () => {
      await expect(this.page.locator("tbody").getByText(displayName, { exact: false }).first()).toBeVisible();
    }).toPass({ timeout: 45_000 });
  }
}

module.exports = { AffordplanMasterSubmoduleListPage };
