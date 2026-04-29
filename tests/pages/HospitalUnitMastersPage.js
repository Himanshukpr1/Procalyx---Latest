const { expect } = require("@playwright/test");
const env = require("../../data/env");
const { getAuthProfile } = require("../../data/auth-profiles");
const { BasePage } = require("./BasePage");

/**
 * Hospital Unit Master list — Super Admin `/dashboard/hospital-unit-masters`; HKAM `/hkam/hospital-unit-management`.
 */
class HospitalUnitMastersPage extends BasePage {
  constructor(page) {
    super(page);
    this.addNewHospitalUnitButton = page.getByRole("button", { name: /add new hospital unit/i });
    /** Super Admin: "Hospital Unit Master"; HKAM: sidebar **Hospital Unit Masters**, heading often **Hospital Unit Management**. */
    this.pageHeading = page.getByRole("heading", {
      name: /hospital\s+unit\s+(master|masters|management)/i,
    });
    this.hospitalUnitTable = page.locator("table").first();
  }

  navScope() {
    return this.page.locator(".MuiDrawer-root").first();
  }

  hospitalUnitHrefLocator(scope, path) {
    const p = path || env.hospitalUnitMastersPath;
    return scope.locator(`a[href="${p}"], a[href="${p}/"], a[href="#${p}"], a[href="#${p}/"]`);
  }

  /** Super Admin: **^Hospital Unit$** under onboarding; HKAM: **Hospital Unit Master(s)** drawer label. */
  hospitalUnitNavRoleLocator(scope) {
    const nameRe = getAuthProfile() === "hkam_operator" ? /^Hospital Unit(\s+Master(s)?)?$/i : /^Hospital Unit$/;
    return scope
      .getByRole("link", { name: nameRe })
      .or(scope.getByRole("button", { name: nameRe }))
      .or(scope.getByRole("treeitem", { name: nameRe }))
      .or(scope.getByRole("listitem", { name: nameRe }));
  }

  /** True if Hospital Unit Master nav target is visible (sidebar href, role, or legacy **Hospital Unit**). */
  async hospitalUnitSidebarTargetVisible() {
    const path = env.hospitalUnitMastersPath;
    const drawer = this.navScope();
    const scope = (await drawer.count()) > 0 && (await drawer.isVisible().catch(() => false)) ? drawer : this.page;

    if (await this.anyLocatorVisible(this.hospitalUnitHrefLocator(scope, path))) return true;
    if (await this.anyLocatorVisible(this.hospitalUnitNavRoleLocator(scope))) return true;
    const legacy = scope.getByText("Hospital Unit", { exact: true });
    return this.anyLocatorVisible(legacy);
  }

  /**
   * TC03 — sidebar to Hospital Unit list.
   * - Super Admin: same **goto** collapse as Hospital Master TC03 — expand **Hospital Onboarding** when the Unit row is hidden.
   * - HKAM: **Hospital Unit Masters** top-level.
   */
  async clickHospitalUnitSidebarLink() {
    const path = env.hospitalUnitMastersPath;
    await this.page.goto(env.appHomePath, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("domcontentloaded");
    await this.waitForAppShellSidebarReady();

    if (!(await this.hospitalUnitSidebarTargetVisible())) {
      const expanded = await this.tryExpandHospitalOnboardingSidebar();
      if (expanded) {
        await expect(async () => {
          expect(await this.hospitalUnitSidebarTargetVisible()).toBe(true);
        }).toPass({ timeout: 20_000 });
      }
    }

    const listUrlRe = env.hospitalUnitMastersListUrlRe;

    await expect(async () => {
      const drawer = this.navScope();
      const scope = (await drawer.count()) > 0 && (await drawer.isVisible().catch(() => false)) ? drawer : this.page;
      const p = this.page;

      const clickFirstVisible = async (loc) => {
        const n = await loc.count();
        for (let i = 0; i < n; i++) {
          const el = loc.nth(i);
          if (await el.isVisible().catch(() => false)) {
            await el.scrollIntoViewIfNeeded().catch(() => {});
            await el.click({ timeout: 10_000 });
            return true;
          }
        }
        return false;
      };

      const hrefLoc = this.hospitalUnitHrefLocator(scope, path);
      if (await clickFirstVisible(hrefLoc)) {
        await expect(p).toHaveURL(listUrlRe, { timeout: 25_000 });
        return;
      }

      const roleLoc = this.hospitalUnitNavRoleLocator(scope);
      if (await clickFirstVisible(roleLoc)) {
        await expect(p).toHaveURL(listUrlRe, { timeout: 25_000 });
        return;
      }

      const legacy = scope.getByText("Hospital Unit", { exact: true });
      if (await clickFirstVisible(legacy)) {
        await expect(p).toHaveURL(listUrlRe, { timeout: 25_000 });
        return;
      }

      throw new Error("Hospital Unit nav item not visible or not clickable yet");
    }).toPass({ timeout: 40_000 });
  }

  async openHospitalUnitMastersList(listPath = env.hospitalUnitMastersPath) {
    await this.goto(listPath);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectHospitalUnitMasterListVisible() {
    await expect(this.page).toHaveURL(env.hospitalUnitMastersListUrlRe);
    await expect(this.pageHeading).toBeVisible({ timeout: 30_000 });
  }

  async expectAddNewHospitalUnitButtonClickable() {
    await expect(this.addNewHospitalUnitButton).toBeVisible({ timeout: 30_000 });
    await expect(this.addNewHospitalUnitButton).toBeEnabled();
  }

  async clickAddNewHospitalUnit() {
    await this.addNewHospitalUnitButton.click();
    await expect(this.page).toHaveURL(env.hospitalUnitMastersAddUrlRe);
  }

  /**
   * TC15 — assert **Hospital Unit** name appears in the grid.
   * @param {string} unitName — `info.hospitalName` from the add form
   */
  async expectHospitalUnitListedByName(unitName) {
    const table = this.hospitalUnitTable;
    await expect(table).toBeVisible({ timeout: 30_000 });

    const headerInputs = table.locator("thead").locator('input[type="text"], input[type="search"]');
    if ((await headerInputs.count()) > 0) {
      await headerInputs.first().fill(unitName);
    }

    await expect(async () => {
      await expect(this.page.locator("tbody").getByText(unitName, { exact: false }).first()).toBeVisible();
    }).toPass({ timeout: 45_000 });
  }
}

module.exports = { HospitalUnitMastersPage };
