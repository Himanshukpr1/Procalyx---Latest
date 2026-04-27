const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * **Manufacturer Masters** → **Manufacturer Item** — `/dashboard/manufacturer-item`
 * QA uses a **MUI DataGrid** (`role="grid"`, not always `<table>`), so we support both.
 */
class ManufacturerItemPage extends BasePage {
  constructor(page) {
    super(page);
    this.pageHeading = page.getByRole("heading", { name: /manufacturer items?/i });
    /** MUI **DataGrid** uses `role="grid"`; some builds still use a semantic `<table>`. */
    this.dataGrid = page.locator('[role="grid"], table').first();
  }

  /** TC02 — expand **Manufacturer Masters** in the left menu. */
  async clickManufacturerMastersNav() {
    await this.page.waitForLoadState("domcontentloaded");

    const byButton = this.page.getByRole("button", { name: /manufacturer masters/i });
    if ((await byButton.count()) > 0) {
      await byButton.first().click();
      return;
    }

    const byTree = this.page.getByRole("treeitem", { name: /manufacturer masters/i });
    if ((await byTree.count()) > 0) {
      await byTree.first().click();
      return;
    }

    const text = this.page.getByText("Manufacturer Masters", { exact: false });
    await expect(text.first()).toBeVisible({ timeout: 30_000 });
    await text.first().click();
  }

  /**
   * TC03 — open **Manufacturer Item** from the sidebar (under Manufacturer Masters).
   */
  async clickManufacturerItemSidebarLink() {
    const byLink = this.page.getByRole("link", { name: /manufacturer item/i });
    if ((await byLink.count()) > 0) {
      await byLink.first().click();
    } else {
      const label = this.page.getByText("Manufacturer Item", { exact: true });
      await expect(label.first()).toBeVisible({ timeout: 30_000 });
      await label.first().click();
    }
    await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-item\/?$/);
  }

  async openManufacturerItemList(listPath = "/dashboard/manufacturer-item") {
    await this.goto(listPath);
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.dataGrid).toBeVisible({ timeout: 30_000 });
  }

  async expectManufacturerItemListVisible() {
    await expect(this.page).toHaveURL(/\/dashboard\/manufacturer-item\/?$/);
    await expect(this.pageHeading).toBeVisible({ timeout: 30_000 });
  }

  /**
   * MUI: rows live under `.MuiDataGrid-virtualScroller`. HTML table: `tbody tr` (no header `tr` in `tbody`).
   * @returns {import('@playwright/test').Locator}
   */
  _dataRowLocators() {
    return this.dataGrid.locator(".MuiDataGrid-virtualScroller .MuiDataGrid-row");
  }

  async getDataRowCount() {
    const muiN = await this._dataRowLocators().count();
    if (muiN > 0) {
      return muiN;
    }
    return this.dataGrid.locator("tbody tr").count();
  }

  /**
   * @param {number} index — 0-based
   * @returns {import('@playwright/test').Locator}
   */
  _getDataRowByIndex(index) {
    return this._dataRowLocators()
      .nth(index)
      .or(this.dataGrid.locator("tbody tr").nth(index));
  }

  /**
   * **Actions** column: pencil (often `IconButton` with `aria-label` only, or bare `button`).
   * @param {import('@playwright/test').Locator} row
   */
  async _clickEditInActionsOnRow(row) {
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible({ timeout: 15_000 });

    const muiLastCell = row.locator("div[role='gridcell']").last();
    const tableLastCell = row.locator("td, th").last();
    const actions = (await muiLastCell.count()) > 0 ? muiLastCell : tableLastCell;

    const tryClick = async (locator) => {
      if ((await locator.count()) === 0) {
        return false;
      }
      const el = locator.first();
      await el.scrollIntoViewIfNeeded();
      try {
        await el.click({ timeout: 5_000 });
        return true;
      } catch {
        await el.click({ force: true, timeout: 5_000 });
        return true;
      }
    };

    if (await tryClick(actions.locator(".MuiIconButton-root, [class*='IconButton']"))) {
      return;
    }
    if (await tryClick(row.getByLabel(/edit/i))) {
      return;
    }
    if (await tryClick(row.getByRole("button", { name: /edit/i }))) {
      return;
    }
    if (await tryClick(row.locator("[aria-label*='Edit'], [aria-label*='edit']"))) {
      return;
    }
    if (await tryClick(actions.getByRole("button"))) {
      return;
    }
    if (await tryClick(actions.locator("a[href], [role='button']"))) {
      return;
    }
    if (await tryClick(actions.locator("button").first())) {
      return;
    }
    if (await tryClick(actions.getByRole("link"))) {
      return;
    }

    throw new Error("Could not find an Edit / Actions control in the row (check MUI cell layout).");
  }

  async _expectEditViewOpened() {
    await expect(async () => {
      const u = this.page.url();
      if (/\/manufacturer-item\/.*(edit|\/edit)/i.test(u) || (/\/manufacturer-item/i.test(u) && u.toLowerCase().includes("edit"))) {
        return;
      }
      if (await this.page.getByRole("dialog").first().isVisible().catch(() => false)) {
        return;
      }
      throw new Error("Edit did not open (URL or dialog)");
    }).toPass({ timeout: 20_000 });
  }

  /**
   * `rowIndex` — 0-based data row. Requires at least one row (QA data).
   */
  async clickEditInActionsForRowIndex(rowIndex) {
    await expect(this.dataGrid).toBeVisible({ timeout: 30_000 });
    const n = await this.getDataRowCount();
    if (n === 0) {
      throw new Error("No data rows in Manufacturer Item grid (is the grid MUI? Check getDataRowCount).");
    }
    const idx = Math.min(Math.max(0, rowIndex), n - 1);
    const muiRows = this._dataRowLocators();
    const muiN = await muiRows.count();
    let row;
    if (muiN > 0) {
      row = muiRows.nth(idx);
    } else {
      row = this.dataGrid.locator("tbody tr").nth(idx);
    }
    await this._clickEditInActionsOnRow(row);
    await this._expectEditViewOpened();
  }

  /**
   * Pick a **random** data row, then **Actions** → edit (pencil / icon button).
   */
  async clickRandomRowEditInActions() {
    const n = await this.getDataRowCount();
    if (n === 0) {
      throw new Error("No data rows in Manufacturer Item grid");
    }
    const idx = Math.floor(Math.random() * n);
    await this.clickEditInActionsForRowIndex(idx);
  }

  /**
   * TC10 — filter the **Item Name** column and assert the row is visible.
   * @param {string} itemName
   */
  async expectItemListedByItemName(itemName) {
    const table = this.dataGrid;
    await expect(table).toBeVisible({ timeout: 30_000 });

    const thead = table.locator("thead");
    if ((await thead.count()) === 0) {
      await this.page
        .getByPlaceholder(/item name|search|filter/i)
        .last()
        .fill(itemName);
      await expect(async () => {
        await expect(this.page.getByText(itemName, { exact: false }).first()).toBeVisible();
      }).toPass({ timeout: 45_000 });
      return;
    }

    const headerRow = thead.locator("tr").first();
    const headerCells = headerRow.locator("th, td");
    const hCount = await headerCells.count();
    let colIdx = -1;
    for (let i = 0; i < hCount; i += 1) {
      const t = (await headerCells.nth(i).innerText()).trim();
      if (/^item name$/i.test(t) || /^item name\s*\*?$/i.test(t)) {
        colIdx = i;
        break;
      }
    }

    if (colIdx >= 0 && (await thead.locator("tr").count()) > 1) {
      const filterRow = thead.locator("tr").nth(1);
      const cell = filterRow.locator("th, td").nth(colIdx);
      const inp = cell.locator('input[type="text"], input[type="search"]').first();
      if ((await inp.count()) > 0) {
        await inp.fill(itemName);
      }
    } else {
      const headerInputs = thead.locator('input[type="text"], input[type="search"]');
      const count = await headerInputs.count();
      if (count > 0) {
        await headerInputs.nth(count - 1).fill(itemName);
      }
    }

    await expect(async () => {
      await expect(this.page.locator("tbody").getByText(itemName, { exact: false }).first()).toBeVisible();
    }).toPass({ timeout: 45_000 });
  }
}

module.exports = { ManufacturerItemPage };
