const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");

/**
 * Hospital Master list — `/dashboard/hospital-masters`
 */
class HospitalMastersPage extends BasePage {
  constructor(page) {
    super(page);
    this.addNewHospitalButton = page.getByRole("button", { name: /add new hospital/i });
    this.pageHeading = page.getByRole("heading", { name: /hospital master/i });
    this.hospitalMasterTable = page.locator("table").first();
  }

  /**
   * TC02 — expand **Hospital Onboarding** in the left menu (accordion / list item).
   * Avoid `nav, aside`).first()` — the first `<nav>` in the DOM is often the **top bar**, not the sidebar,
   * so scoped `getByText` never matched. Prefer accessible roles, then visible text on the page.
   */
  async clickHospitalOnboardingNav() {
    await this.page.waitForLoadState("domcontentloaded");

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

  /**
   * TC03 — open Hospital list via the sidebar link (href match; works whether the link is in `aside`, `div`, or `nav`).
   * @param {string} listPath — e.g. `/dashboard/hospital-masters`
   */
  async clickHospitalSidebarLink(listPath) {
    const href = listPath || "/dashboard/hospital-masters";
    const link = this.page.getByText('Hospital', { exact: true }).first();
    await expect(link).toBeVisible({ timeout: 30_000 });
    await link.click();
  }

  async openHospitalMastersList(listPath = "/dashboard/hospital-masters") {
    await this.goto(listPath);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectHospitalMasterListVisible() {
    await expect(this.page).toHaveURL(/\/dashboard\/hospital-masters$/);
    await expect(this.pageHeading).toBeVisible({ timeout: 30_000 });
  }

  async expectAddNewHospitalButtonClickable() {
    await expect(this.addNewHospitalButton).toBeVisible({ timeout: 30_000 });
    await expect(this.addNewHospitalButton).toBeEnabled();
  }

  async clickAddNewHospital() {
    await this.addNewHospitalButton.click();
    await expect(this.page).toHaveURL(/\/dashboard\/hospital-masters\/add/);
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
