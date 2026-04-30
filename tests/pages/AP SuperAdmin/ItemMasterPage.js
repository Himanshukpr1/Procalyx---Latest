const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * **Affordplan Master** → **Item Master** — `/dashboard/item-master`
 */
class ItemMasterPage extends BasePage {
  constructor(page) {
    super(page);
    this.addNewButton = page.getByRole("button", { name: /add new/i });
    this.table = page.locator("table").first();
  }

  /** TC02 — expand **Affordplan Master** in the left menu (same pattern as **AffordplanMasterSubmoduleListPage**). */
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

  /** TC03 — sidebar **Item Master**. */
  async clickItemMasterSidebar() {
    const byLink = this.page.getByRole("link", { name: /item master/i });
    if ((await byLink.count()) > 0) {
      await byLink.first().click();
    } else {
      const label = this.page.getByText("Item Master", { exact: true });
      await expect(label.first()).toBeVisible({ timeout: 30_000 });
      await label.first().click();
    }
    await expect(this.page).toHaveURL(/\/dashboard\/item-master\/?$/);
  }

  async openItemMasterList() {
    await this.goto("/dashboard/item-master");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectItemMasterListVisible() {
    await expect(this.page).toHaveURL(/\/dashboard\/item-master\/?$/);
    await expect(this.page.getByRole("heading", { name: /item master/i }).first()).toBeVisible({ timeout: 30_000 });
  }

  async expectAddNewButtonClickable() {
    await expect(this.addNewButton).toBeVisible({ timeout: 30_000 });
    await expect(this.addNewButton).toBeEnabled();
  }

  async clickAddNew() {
    await this.addNewButton.click();
    await expect(this.page).toHaveURL(/\/dashboard\/item-master\/add$/);
  }

  /**
   * TC06 — filter **Item Name** and assert the row.
   * @param {string} itemName
   */
  async expectItemListedByItemName(itemName) {
    const table = this.table;
    await expect(table).toBeVisible({ timeout: 30_000 });

    const thead = table.locator("thead");
    const headerRow = thead.locator("tr").first();
    const headerCells = headerRow.locator("th, td");
    const n = await headerCells.count();
    let colIdx = -1;
    for (let i = 0; i < n; i++) {
      const t = (await headerCells.nth(i).innerText()).trim();
      if (/^item name$/i.test(t)) {
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
      if (count >= 3) {
        await headerInputs.nth(2).fill(itemName);
      } else if (count > 0) {
        await headerInputs.nth(count - 1).fill(itemName);
      }
    }

    await expect(async () => {
      await expect(this.page.locator("tbody").getByText(itemName, { exact: false }).first()).toBeVisible();
    }).toPass({ timeout: 45_000 });
  }
}

module.exports = { ItemMasterPage };
