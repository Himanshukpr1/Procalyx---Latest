const { expect } = require("@playwright/test");
const env = require("../../../data/AP SuperAdmin/env");
const { getAuthProfile } = require("../../../data/AP SuperAdmin/auth-profiles");
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
    /** MUI DataGrid uses `role="grid"`; legacy builds may still render `<table>`. */
    this.dataGrid = page.locator('[role="grid"], table').first();
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
    await expect(this.dataGrid).toBeVisible({ timeout: 45_000 });
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
   * Headless often differs from headed when only `<table>` is targeted while QA uses **MUI DataGrid**
   * (`role="grid"`), or when row cells live outside `<tbody>` — scope searches + virtualization-friendly polls.
   * @param {string} unitName — `hospitalPayload.hospitalName` from create flow
   */
  async expectHospitalUnitListedByName(unitName) {
    const grid = this.dataGrid;
    await expect(grid).toBeVisible({ timeout: 45_000 });

    const thead = grid.locator("thead");
    if ((await thead.count()) > 0) {
      const headerRow = thead.locator("tr").first();
      const headerCells = headerRow.locator("th, td");
      const hCount = await headerCells.count();
      let colIdx = -1;
      for (let i = 0; i < hCount; i += 1) {
        const t = (await headerCells.nth(i).innerText()).trim();
        if (
          /hospital\s*unit\s*name/i.test(t) ||
          /^unit\s*name$/i.test(t) ||
          /^hospital\s*name$/i.test(t)
        ) {
          colIdx = i;
          break;
        }
      }

      if (colIdx >= 0 && (await thead.locator("tr").count()) > 1) {
        const filterRow = thead.locator("tr").nth(1);
        const inp = filterRow.locator("th, td").nth(colIdx).locator('input[type="text"], input[type="search"]').first();
        if ((await inp.count()) > 0) {
          await inp.fill(unitName);
        }
      } else {
        const headerInputs = thead.locator('input[type="text"], input[type="search"]');
        const count = await headerInputs.count();
        if (count > 0) {
          await headerInputs.first().fill(unitName);
        }
      }
    } else {
      const muiHdrInputs = grid.locator(".MuiDataGrid-columnHeaders").locator('input[type="text"], input[type="search"]');
      if ((await muiHdrInputs.count()) > 0) {
        await muiHdrInputs.first().fill(unitName);
      } else {
        const fallback = grid.locator('input[type="text"], input[type="search"]').first();
        if ((await fallback.count()) > 0) {
          await fallback.fill(unitName);
        }
      }
    }

    await expect
      .poll(
        async () => {
          const hit = grid.getByText(unitName, { exact: false }).first();
          await hit.scrollIntoViewIfNeeded().catch(() => {});
          return hit.isVisible().catch(() => false);
        },
        { timeout: 60_000, intervals: [300, 600, 1200] }
      )
      .toBe(true);
  }
}

module.exports = { HospitalUnitMastersPage };
