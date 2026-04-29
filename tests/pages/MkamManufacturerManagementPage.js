const { expect } = require("@playwright/test");
const env = require("../../data/env");
const { BasePage } = require("./BasePage");

/**
 * MKAM operator — **Manufacturer Management** (`/mkam/manufacturer-management`).
 */
class MkamManufacturerManagementPage extends BasePage {
  constructor(page) {
    super(page);
    this.pageHeading = page.getByRole("heading", { name: /manufacturer management/i });
    this.table = page.locator("table").first();
  }

  async gotoHomeAndOpenManufacturerManagement() {
    await this.page.goto(env.appHomePath, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("domcontentloaded");
    await this.waitForAppShellSidebarReady();

    const nav = this.page
      .getByRole("link", { name: /^Manufacturer Masters$/i })
      .or(this.page.getByRole("button", { name: /^Manufacturer Masters$/i }));
    await expect(nav.first()).toBeVisible({ timeout: 30_000 });
    await nav.first().click();
    await expect(this.page).toHaveURL(env.mkamManufacturerManagementListUrlRe);
  }

  async expectManufacturerManagementListVisible() {
    await expect(this.page).toHaveURL(env.mkamManufacturerManagementListUrlRe);
    await expect(this.pageHeading).toBeVisible({ timeout: 30_000 });
  }

  async clickAddNewMfgButton() {
    await this.page.getByRole("button", { name: /add new mfg/i }).click();
  }

  async openManufacturerManagementList() {
    await this.goto(env.mkamManufacturerManagementPath);
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.page).toHaveURL(env.mkamManufacturerManagementListUrlRe);
    await expect(this.pageHeading).toBeVisible({ timeout: 30_000 });
  }

  async expectAddNewMfgButtonVisibleAndEnabled() {
    const btn = this.page.getByRole("button", { name: /add new mfg/i });
    await expect(btn).toBeVisible({ timeout: 30_000 });
    await expect(btn).toBeEnabled();
  }

  /** Status chips/tabs — **Pending**, **Approved**, etc. */
  async clickPendingStatusTab() {
    const byRoleTab = this.page.getByRole("tab", { name: /\bPending\b/i });
    if ((await byRoleTab.count()) > 0) {
      await byRoleTab.first().click();
      return;
    }
    const byButton = this.page.getByRole("button", { name: /\bPending\b/i });
    if ((await byButton.count()) > 0) {
      await byButton.first().click();
      return;
    }
    await this.page.locator('[role="tab"], button').filter({ hasText: /^\s*Pending\s*\(/i }).first().click();
  }

  /**
   * TC11 — **Manufacturer Masters** list: open **Pending**, filter **MFG Legal Name**, assert row visible.
   * @param {string} legalNameSubstring — typically `manufacturerPayload.mfgLegalName`
   */
  async expectCreatedMfgListedUnderPendingByLegalName(legalNameSubstring) {
    const table = this.table;
    await expect(table).toBeVisible({ timeout: 30_000 });

    await this.clickPendingStatusTab();
    await this.page.waitForLoadState("domcontentloaded");

    const thead = table.locator("thead");
    const legalHeader = thead.locator("th, [role='columnheader']").filter({ hasText: /mfg legal name/i }).first();
    const legalColFilter = legalHeader.locator('input[type="text"], input[type="search"]').first();

    if ((await legalColFilter.count()) > 0 && (await legalColFilter.isVisible().catch(() => false))) {
      await legalColFilter.fill(legalNameSubstring);
    } else {
      /** Fallback: fourth header filter matches typical column order (Name, Code, Cloud ID, Legal …). */
      const headerInputs = thead.locator('input[type="text"], input[type="search"]');
      const n = await headerInputs.count();
      const idx = n >= 4 ? 3 : 0;
      if (n >= 1) await headerInputs.nth(idx).fill(legalNameSubstring);
    }

    await expect(async () => {
      await expect(this.page.locator("tbody").getByText(legalNameSubstring, { exact: false }).first()).toBeVisible();
    }).toPass({ timeout: 45_000 });
  }

  /**
   * Legacy — filter first header column (still usable when not scoped to Pending / Legal Name).
   * @param {string} mfgNameSubstring
   */
  async expectManufacturerListedByMfgName(mfgNameSubstring) {
    const table = this.table;
    await expect(table).toBeVisible({ timeout: 30_000 });

    const headerInputs = table.locator("thead").locator('input[type="text"], input[type="search"]');
    const count = await headerInputs.count();
    if (count >= 1) {
      await headerInputs.first().fill(mfgNameSubstring);
    }

    await expect(async () => {
      await expect(this.page.locator("tbody").getByText(mfgNameSubstring, { exact: false }).first()).toBeVisible();
    }).toPass({ timeout: 45_000 });
  }
}

module.exports = { MkamManufacturerManagementPage };
