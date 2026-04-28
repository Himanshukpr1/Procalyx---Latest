const { expect } = require("@playwright/test");
const env = require("../../data/env");
const { getAuthProfile } = require("../../data/auth-profiles");
const { BasePage } = require("./BasePage");

/**
 * Hospital Master list — Super Admin `/dashboard/hospital-masters`; HKAM `/hkam/hospital-management`.
 */
class HospitalMastersPage extends BasePage {
  constructor(page) {
    super(page);
    this.addNewHospitalButton = page.getByRole("button", { name: /add new hospital/i });
    /** Super Admin: "Hospital Master"; HKAM: often "Hospital Management" on `/hkam/hospital-management`. */
    this.pageHeading = page.getByRole("heading", { name: /hospital\s+(master|masters|management)/i });
    this.hospitalMasterTable = page.locator("table").first();
  }

  /**
   * TC02 — expand **Hospital Onboarding** in the left menu (accordion / list item).
   * Avoid `nav, aside`).first()` — the first `<nav>` in the DOM is often the **top bar**, not the sidebar,
   * so scoped `getByText` never matched. Prefer accessible roles, then visible text on the page.
   */
  async clickHospitalOnboardingNav() {
    await this.page.waitForLoadState("domcontentloaded");
    await expect(async () => {
      const p = this.page;
      const onboarding = p
        .getByRole("button", { name: /hospital onboarding/i })
        .or(p.getByRole("treeitem", { name: /hospital onboarding/i }))
        .or(p.getByText("Hospital Onboarding", { exact: false }));
      const n = await onboarding.count();
      expect(n).toBeGreaterThan(0);
      let visible = false;
      for (let i = 0; i < n; i++) {
        if (await onboarding.nth(i).isVisible().catch(() => false)) {
          visible = true;
          break;
        }
      }
      expect(visible).toBe(true);
    }).toPass({ timeout: 45_000 });

    const byButton = this.page.getByRole("button", { name: /hospital onboarding/i });
    if ((await byButton.count()) > 0) {
      await byButton.first().click();
      return;
    }

    const byTree = this.page.getByRole("treeitem", { name: /hospital onboarding/i });
    if ((await byTree.count()) > 0) {
      await byTree.first().click();
      return;
    }

    const text = this.page.getByText("Hospital Onboarding", { exact: false });
    await expect(text.first()).toBeVisible({ timeout: 30_000 });
    await text.first().click();
  }

  /** MUI left nav — avoids matching main-content links. Falls back to full page if no drawer. */
  navScope() {
    return this.page.locator(".MuiDrawer-root").first();
  }

  /**
   * Exact list route only — `href*="/dashboard/hospital-masters"` also matches **hospital-masters-ap** and other modules.
   */
  hospitalMasterHrefLocator(scope, path) {
    const p = path || env.hospitalMastersPath;
    return scope.locator(`a[href="${p}"], a[href="${p}/"], a[href="#${p}"], a[href="#${p}/"]`);
  }

  /**
   * Super Admin: **^Hospital$** only — the broad `/Hospital(\\s+Master(s)?)?/` also matches the separate **Hospital masters** row (different module) and can navigate wrong (e.g. user-management). HKAM: **Hospital Master(s)** top-level label.
   */
  hospitalMasterNavRoleLocator(scope) {
    const isHkam = getAuthProfile() === "hkam_operator";
    const nameRe = isHkam ? /^Hospital(\s+Master(s)?)?$/i : /^Hospital$/;
    return scope
      .getByRole("link", { name: nameRe })
      .or(scope.getByRole("button", { name: nameRe }))
      .or(scope.getByRole("treeitem", { name: nameRe }))
      .or(scope.getByRole("listitem", { name: nameRe }));
  }

  /**
   * True if a sidebar/list target for Hospital Master is already visible (href, role, or legacy **Hospital**).
   */
  async hospitalSidebarTargetVisible(listPath) {
    const path = listPath || env.hospitalMastersPath;
    const drawer = this.navScope();
    const scope = (await drawer.count()) > 0 && (await drawer.isVisible().catch(() => false)) ? drawer : this.page;

    if (await this.anyLocatorVisible(this.hospitalMasterHrefLocator(scope, path))) return true;
    if (await this.anyLocatorVisible(this.hospitalMasterNavRoleLocator(scope))) return true;
    const legacy = scope.getByText("Hospital", { exact: true });
    return this.anyLocatorVisible(legacy);
  }

  /**
   * TC03 — open Hospital list via the sidebar.
   * - Super Admin: TC02 expands onboarding, then TC03 `goto` **reloads** `/dashboard` and **collapses** the menu — expand again if the Hospital row is hidden.
   * - HKAM: top-level **Hospital Masters**; onboarding expand is skipped when control is absent.
   * @param {string} listPath — e.g. `/dashboard/hospital-masters`
   */
  async clickHospitalSidebarLink(listPath) {
    const path = listPath || env.hospitalMastersPath;
    await this.page.goto(env.appHomePath, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("domcontentloaded");
    await this.waitForAppShellSidebarReady();

    if (!(await this.hospitalSidebarTargetVisible(path))) {
      const expanded = await this.tryExpandHospitalOnboardingSidebar();
      if (expanded) {
        await expect(async () => {
          expect(await this.hospitalSidebarTargetVisible(path)).toBe(true);
        }).toPass({ timeout: 20_000 });
      }
    }

    const listUrlRe = env.hospitalMastersListUrlRe;

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

      const hrefLoc = this.hospitalMasterHrefLocator(scope, path);
      if (await clickFirstVisible(hrefLoc)) {
        await expect(p).toHaveURL(listUrlRe, { timeout: 25_000 });
        return;
      }

      const roleLoc = this.hospitalMasterNavRoleLocator(scope);
      if (await clickFirstVisible(roleLoc)) {
        await expect(p).toHaveURL(listUrlRe, { timeout: 25_000 });
        return;
      }

      const legacy = scope.getByText("Hospital", { exact: true });
      if (await clickFirstVisible(legacy)) {
        await expect(p).toHaveURL(listUrlRe, { timeout: 25_000 });
        return;
      }

      throw new Error("Hospital nav item not visible or not clickable yet");
    }).toPass({ timeout: 40_000 });
  }

  async openHospitalMastersList(listPath = env.hospitalMastersPath) {
    await this.goto(listPath);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectHospitalMasterListVisible() {
    await expect(this.page).toHaveURL(env.hospitalMastersListUrlRe);
    await expect(this.pageHeading).toBeVisible({ timeout: 30_000 });
  }

  async expectAddNewHospitalButtonClickable() {
    await expect(this.addNewHospitalButton).toBeVisible({ timeout: 30_000 });
    await expect(this.addNewHospitalButton).toBeEnabled();
  }

  async clickAddNewHospital() {
    await this.addNewHospitalButton.click();
    await expect(this.page).toHaveURL(env.hospitalMastersAddUrlRe);
  }

  /**
   * TC06 — assert **Hospital Name** appears in the grid (header filter if present, else row text).
   * @param {string} hospitalName
   */
  async expectHospitalListedByName(hospitalName) {
    const table = this.hospitalMasterTable;
    await expect(table).toBeVisible({ timeout: 30_000 });

    const headerInputs = table.locator("thead").locator('input[type="text"], input[type="search"]');
    if ((await headerInputs.count()) > 0) {
      await headerInputs.first().fill(hospitalName);
    }

    await expect(async () => {
      await expect(this.page.locator("tbody").getByText(hospitalName, { exact: false }).first()).toBeVisible();
    }).toPass({ timeout: 45_000 });
  }
}

module.exports = { HospitalMastersPage };
