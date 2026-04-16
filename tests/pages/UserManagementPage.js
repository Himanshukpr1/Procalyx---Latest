const { expect } = require("@playwright/test");
const { BasePage } = require("./BasePage");
const umData = require("../../data/user-management");
const {
  superadminUserManagementLocators,
  UM_TEXT,
} = require("../locators/superadmin-user-management.locators");

function escapeRx(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Waits until a native `<select>` has at least `minOptions` `<option>` rows (API-loaded lists).
 * @param {import('@playwright/test').Locator} selectLocator
 */
async function waitForSelectOptionsLoaded(selectLocator, minOptions = 2) {
  await expect(selectLocator).toBeVisible();
  await expect(async () => {
    const n = await selectLocator.locator("option").count();
    expect(n).toBeGreaterThanOrEqual(minOptions);
  }).toPass({ timeout: 45_000 });
}

/**
 * Picks an option by visible label (exact, then case-insensitive substring), or `index: 1` when
 * `preferred` is `first` / empty — relationship options are **org names**, not `defaultRelationship: "hospital"`.
 * @param {import('@playwright/test').Locator} selectLocator
 * @param {string} preferred
 */
async function selectNativeOptionByLabelOrFirst(selectLocator, preferred) {
  await waitForSelectOptionsLoaded(selectLocator);
  const raw = await selectLocator.locator("option").allInnerTexts();
  const labels = raw.map((t) => t.trim()).filter(Boolean);

  const want = (preferred || "").trim().toLowerCase();
  if (!want || want === "first") {
    await selectLocator.selectOption({ index: 1 });
    return;
  }

  const exact = labels.find((t) => t.toLowerCase() === want);
  if (exact) {
    await selectLocator.selectOption({ label: exact });
    return;
  }
  const partial = labels.find((t) => t.toLowerCase().includes(want));
  if (partial) {
    await selectLocator.selectOption({ label: partial });
    return;
  }

  await selectLocator.selectOption({ index: 1 });
}

/** After country/state change, waits until `<select>` is enabled and has ≥2 options (placeholder + data). */
async function waitForSelectEnabledWithOptions(selectLocator, minOptions = 2) {
  await expect(async () => {
    await expect(selectLocator).toBeEnabled();
    const n = await selectLocator.locator("option").count();
    expect(n).toBeGreaterThanOrEqual(minOptions);
  }).toPass({ timeout: 45_000 });
}

/**
 * Order of `<option>` indices for native `<select>` data lists (Hospital Name, Manufacturer, …).
 * @param {string[]} labels — `option` inner texts (index 0 = placeholder)
 * @param {string} preferred — substring or `"first"`
 */
function buildNativeSelectOptionIndices(labels, preferred) {
  const want = (preferred || "").trim().toLowerCase();
  const ordered = [];
  const seen = new Set();
  if (want && want !== "first") {
    for (let i = 1; i < labels.length; i += 1) {
      const t = labels[i].trim().toLowerCase();
      if (t === want || t.includes(want) || want.includes(t)) {
        ordered.push(i);
        seen.add(i);
        break;
      }
    }
  }
  for (let i = 1; i < labels.length; i += 1) {
    if (!seen.has(i)) ordered.push(i);
  }
  return ordered;
}

/**
 * User Management — `/dashboard/user-management` (Procalyx QA).
 * “Create New User” modal: basic fields, Relationship, Role, Department, Geography, then (if Relationship is Hospital)
 * **Entity Assignments**: Hospital (**Hospital Name** + **Hospital Unit Name**) or Manufacturer (**Manufacturer**, **Hospital Unit**, **Division**, **Therapy Area**), then Create User.
 */
class UserManagementPage extends BasePage {
  constructor(page) {
    super(page);

    /** Single source of truth from `tests/locators/superadmin-user-management.locators.js`. */
    this.um = superadminUserManagementLocators(page);

    // ——— App shell ———
    this.brandLogo = page.getByText("PROCALYX", { exact: false }).first();
    this.sidebarNavigation = page.locator("nav").first().or(page.getByRole("navigation").first());

    this.sidebarUserManagementLink = page
      .getByRole("link", { name: /user management/i })
      .or(page.getByRole("button", { name: /user management/i }))
      .or(
        this.sidebarNavigation.getByText("User Management", { exact: true }).or(
          page.getByText("User Management", { exact: true })
        )
      );

    this.dataGridOrTable = page.locator('[role="grid"], table').first();

    this.columnHeaderName = page.getByRole("columnheader", { name: new RegExp(`^${escapeRx(UM_TEXT.nameColumn)}$`, "i") });
    this.columnHeaderEmail = page.getByRole("columnheader", { name: new RegExp(`^${escapeRx(UM_TEXT.emailColumn)}$`, "i") });
    this.columnHeaderRelationship = page.getByRole("columnheader", { name: new RegExp(`^${escapeRx(UM_TEXT.relationshipColumn)}$`, "i") });
    this.columnHeaderDepartment = page.getByRole("columnheader", { name: new RegExp(`^${escapeRx(UM_TEXT.departmentColumn)}$`, "i") });
    this.columnHeaderDesignation = page.getByRole("columnheader", { name: new RegExp(`^${escapeRx(UM_TEXT.designationColumn)}$`, "i") });

    this.addUserButton = this.um.addUserButton;

    this.settingsIcon = page.getByRole("button", { name: /settings/i }).or(page.locator('[aria-label*="Setting" i]'));
    this.notificationBell = page
      .getByRole("button", { name: /notification/i })
      .or(page.locator('[aria-label*="notif" i]'));

    // ——— “Create New User” — custom modal; scope to `<form>` that contains the full-name field (not `[role=dialog]`). ———
    this.registrationDialog = page.locator("form").filter({ has: page.getByPlaceholder(new RegExp(`^${escapeRx(UM_TEXT.enterFullName)}$`, "i")) });

    /** Basic Information — placeholders preferred (labels are not `htmlFor`-linked). */
    this.fieldFullName = this.um.fullNameInput;
    this.fieldDesignation = this.um.designationInput;
    this.fieldEmail = this.um.emailInput;
    this.fieldContact = this.um.contactNumberInput;

    /** Organization Details — native `<select>` (use `selectOption`, not MUI listbox options). */
    this.fieldRole = this.um.roleSelect();
    this.fieldRelationship = this.um.relationshipSelect();
    this.fieldDepartment = this.um.departmentSelect();
    this.fieldCountry = this.um.countrySelect();
    this.fieldState = this.um.stateSelect();
    this.fieldCity = this.um.citySelect();

    this.saveUserButton = this.um.submitCreateOrUpdateButton;
    this.cancelUserButton = this.um.cancelButton;
  }

  async openUserManagement(path = "/dashboard/user-management") {
    await this.goto(path);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectSessionShowsAdminUser() {
    const logInHeading = this.page.getByRole("heading", { name: /^Log in$/i });
    if (await logInHeading.isVisible().catch(() => false)) {
      throw new Error("Not logged in — “Log in” heading is still visible.");
    }

    const verifyOtpHeading = this.page.getByRole("heading", { name: /verify otp/i });
    if (await verifyOtpHeading.isVisible().catch(() => false)) {
      throw new Error("Still on OTP — “Verify OTP” heading is visible.");
    }

    await this.page.waitForLoadState("domcontentloaded");
  }

  /** TC02 — grid columns match User Management table on QA. */
  async expectUserManagementPageLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/user-management/);
    await expect(this.addUserButton).toBeVisible({ timeout: 30_000 });
    await expect(this.columnHeaderName).toBeVisible();
    await expect(this.columnHeaderEmail).toBeVisible();
    await expect(this.columnHeaderRelationship).toBeVisible();
  }

  async expectAddUserButtonClickable() {
    const btn = this.addUserButton;
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  }

  async openRegistrationForm() {
    await this.addUserButton.click();
    await this.um.createUserHeading.waitFor({ state: "visible", timeout: 30_000 });
    await this.fieldFullName.waitFor({ state: "visible", timeout: 15_000 });
  }

  /** TC04 — required controls visible (incl. Department + Geography). */
  async expectRequiredRegistrationFieldsPresent() {
    const t = { timeout: 30_000 };
    await expect(this.fieldFullName.first()).toBeVisible(t);
    await expect(this.fieldEmail.first()).toBeVisible(t);
    await expect(this.fieldContact.first()).toBeVisible(t);
    await expect(this.fieldRelationship.first()).toBeVisible(t);
    await expect(this.fieldRole.first()).toBeVisible(t);
    await expect(this.fieldDepartment.first()).toBeVisible(t);
    await expect(this.fieldCountry.first()).toBeVisible(t);
    await expect(this.fieldState.first()).toBeVisible(t);
    await expect(this.fieldCity.first()).toBeVisible(t);
  }

  /** Closes an open `MultiSelectDropdown` by clicking the Geography heading (mousedown-outside). */
  async closeMultiSelectDropdown() {
    await this.registrationDialog.getByRole("heading", { name: UM_TEXT.geographySection }).click();
  }

  /**
   * Opens a **MultiSelectDropdown** root and returns whether any option can be selected (“No options found” vs checkboxes).
   * @param {import('@playwright/test').Locator} root
   */
  async multiSelectDropdownHasSelectableUnits(root) {
    await root.locator("> div").first().click();
    try {
      await expect(async () => {
        const noFound = await root.getByText("No options found").isVisible().catch(() => false);
        const n = await root.locator('input[type="checkbox"]').count();
        expect(noFound || n > 0).toBe(true);
      }).toPass({ timeout: 45_000 });
    } catch {
      await this.closeMultiSelectDropdown();
      return false;
    }
    const noFound = await root.getByText("No options found").isVisible().catch(() => false);
    const n = await root.locator('input[type="checkbox"]').count();
    await this.closeMultiSelectDropdown();
    return !noFound && n > 0;
  }

  /**
   * @param {import('@playwright/test').Locator} root
   * @param {string} preferred — `"first"` or substring of option label
   */
  async pickMultiSelectFirstOption(root, preferred) {
    await root.locator("> div").first().click();
    await expect(async () => {
      expect(await root.locator('input[type="checkbox"]').count()).toBeGreaterThan(0);
    }).toPass({ timeout: 45_000 });

    const want = (preferred || "").trim().toLowerCase();
    if (!want || want === "first") {
      await root.getByRole("checkbox").first().click();
    } else {
      await root.getByText(new RegExp(escapeRx(preferred), "i")).first().click();
    }
    await this.closeMultiSelectDropdown();
  }

  /**
   * After **Hospital Name** is known to have units, opens **Hospital Unit Name** and checks one unit.
   * @param {string} preferred — `"first"` or substring of unit label
   */
  async pickHospitalUnitMultiSelect(preferred) {
    await this.pickMultiSelectFirstOption(this.um.hospitalUnitMultiSelectRoot(), preferred);
  }

  /**
   * Picks **Hospital Name** and **Hospital Unit Name**. If the chosen hospital has no units, tries other hospitals in order until one has units or fails.
   * @param {{ hospitalName?: string, hospitalUnit?: string }} [geo]
   */
  async fillHospitalEntityAssignments(geo) {
    const g = geo || {};
    await this.um.sectionEntityAssignments.scrollIntoViewIfNeeded();
    const hn = this.um.hospitalNameSelect();
    await waitForSelectOptionsLoaded(hn);

    const labels = (await hn.locator("option").allInnerTexts()).map((t) => t.trim());
    const indices = buildNativeSelectOptionIndices(labels, g.hospitalName ?? umData.defaultHospitalName);
    if (indices.length === 0) {
      throw new Error("Hospital Name dropdown has no hospitals to select (only placeholder or empty list).");
    }

    const root = this.um.hospitalUnitMultiSelectRoot();
    for (const idx of indices) {
      await hn.selectOption({ index: idx });
      await expect(async () => {
        const cls = await root.locator("> div").first().getAttribute("class");
        expect(cls == null || !String(cls).includes("disabled")).toBe(true);
      }).toPass({ timeout: 45_000 });

      const hasUnits = await this.multiSelectDropdownHasSelectableUnits(root);
      if (hasUnits) {
        await this.pickHospitalUnitMultiSelect(g.hospitalUnit ?? umData.defaultHospitalUnit);
        return;
      }
    }

    throw new Error(
      `No hospital with at least one unit found — tried ${indices.length} hospital(s). Set UM_HOSPITAL_NAME or seed data with units.`
    );
  }

  /**
   * **Manufacturer** relationship: Manufacturer → Hospital Unit (multi) → Division → Therapy Area (multi).
   * Retries **Manufacturer** until **Hospital Unit** has at least one row (same idea as hospital / hospital units).
   * @param {{ manufacturer?: string, manufacturerHospitalUnit?: string, division?: string, therapyArea?: string }} [geo]
   */
  async fillManufacturerEntityAssignments(geo) {
    const g = geo || {};
    await this.um.sectionEntityAssignments.scrollIntoViewIfNeeded();
    const mfg = this.um.manufacturerSelect();
    await waitForSelectOptionsLoaded(mfg);

    const labels = (await mfg.locator("option").allInnerTexts()).map((t) => t.trim());
    const indices = buildNativeSelectOptionIndices(labels, g.manufacturer ?? umData.defaultManufacturer);
    if (indices.length === 0) {
      throw new Error("Manufacturer dropdown has no options (empty list).");
    }

    const unitRoot = this.um.manufacturerHospitalUnitMultiSelectRoot();
    for (const idx of indices) {
      await mfg.selectOption({ index: idx });
      await expect(async () => {
        const cls = await unitRoot.locator("> div").first().getAttribute("class");
        expect(cls == null || !String(cls).includes("disabled")).toBe(true);
      }).toPass({ timeout: 45_000 });

      const hasUnits = await this.multiSelectDropdownHasSelectableUnits(unitRoot);
      if (hasUnits) {
        await this.pickMultiSelectFirstOption(
          unitRoot,
          g.manufacturerHospitalUnit ?? umData.defaultManufacturerHospitalUnit
        );
        await expect(this.um.divisionSelect()).toBeEnabled({ timeout: 45_000 });
        await selectNativeOptionByLabelOrFirst(this.um.divisionSelect(), g.division ?? umData.defaultDivision);
        const therapyRoot = this.um.therapyAreaMultiSelectRoot();
        await expect(async () => {
          const cls = await therapyRoot.locator("> div").first().getAttribute("class");
          expect(cls == null || !String(cls).includes("disabled")).toBe(true);
        }).toPass({ timeout: 45_000 });
        await this.pickMultiSelectFirstOption(therapyRoot, g.therapyArea ?? umData.defaultTherapyArea);
        return;
      }
    }

    throw new Error(
      `No manufacturer with at least one hospital unit found — tried ${indices.length} manufacturer(s). Set UM_MFG_NAME or seed data.`
    );
  }

  /**
   * @param {{ fullName: string, email: string, mobile: string, designation?: string }} data
   * @param {string} roleOptionText
   * @param {string} [relationshipLabel]
   * @param {{ department?: string, country?: string, state?: string, city?: string, hospitalName?: string, hospitalUnit?: string, manufacturer?: string, manufacturerHospitalUnit?: string, division?: string, therapyArea?: string }} [geo]
   * @param {{ hospitalEntityRequired?: boolean, manufacturerEntityRequired?: boolean }} [options] — TC10–TC12 / TC13–TC16
   */
  async fillRegistrationForm(data, roleOptionText, relationshipLabel, geo, options) {
    await this.fieldFullName.fill(data.fullName);

    if (data.designation && (await this.fieldDesignation.count()) > 0) {
      await this.fieldDesignation.fill(data.designation);
    }

    await this.fieldEmail.fill(data.email);
    await this.fieldContact.fill(data.mobile);

    const rel = relationshipLabel || umData.defaultRelationship;
    await selectNativeOptionByLabelOrFirst(this.fieldRelationship, rel);

    await expect(this.fieldRole).toBeEnabled({ timeout: 45_000 });
    await waitForSelectOptionsLoaded(this.fieldRole);
    await this.fieldRole.selectOption({ label: roleOptionText });

    const g = geo || {};
    const deptLabel = g.department ?? umData.defaultDepartment;
    const countryLabel = g.country ?? umData.defaultCountry;
    const stateLabel = g.state ?? umData.defaultState;
    const cityLabel = g.city ?? umData.defaultCity;

    await expect(this.fieldDepartment).toBeEnabled({ timeout: 45_000 });
    await selectNativeOptionByLabelOrFirst(this.fieldDepartment, deptLabel);

    await waitForSelectOptionsLoaded(this.fieldCountry);
    await selectNativeOptionByLabelOrFirst(this.fieldCountry, countryLabel);

    await waitForSelectEnabledWithOptions(this.fieldState);
    await selectNativeOptionByLabelOrFirst(this.fieldState, stateLabel);

    await waitForSelectEnabledWithOptions(this.fieldCity);
    await selectNativeOptionByLabelOrFirst(this.fieldCity, cityLabel);

    const hn = this.um.hospitalNameSelect();
    const mfgSel = this.um.manufacturerSelect();
    const hospitalRequired = options?.hospitalEntityRequired === true;
    const manufacturerRequired = options?.manufacturerEntityRequired === true;

    if (hospitalRequired) {
      await expect(hn).toBeVisible({ timeout: 45_000 });
      await this.fillHospitalEntityAssignments(geo);
      return;
    }
    if (manufacturerRequired) {
      await expect(mfgSel).toBeVisible({ timeout: 45_000 });
      await this.fillManufacturerEntityAssignments(geo);
      return;
    }

    let mfgVisible = false;
    try {
      await mfgSel.waitFor({ state: "visible", timeout: 3000 });
      mfgVisible = true;
    } catch {
      mfgVisible = false;
    }
    if (mfgVisible) {
      await this.fillManufacturerEntityAssignments(geo);
      return;
    }

    try {
      await hn.waitFor({ state: "visible", timeout: 3000 });
    } catch {
      return;
    }
    await this.fillHospitalEntityAssignments(geo);
  }

  async submitRegistrationForm() {
    await this.saveUserButton.click();
  }

  async dismissRegistrationDialog() {
    if (await this.cancelUserButton.isVisible().catch(() => false)) {
      await this.cancelUserButton.click();
    } else if (await this.um.closeModalButton.isVisible().catch(() => false)) {
      await this.um.closeModalButton.click();
    } else {
      await this.page.keyboard.press("Escape");
    }
    await this.registrationDialog.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {});
  }

  async expectDialogClosedAfterCreate() {
    await Promise.race([
      this.fieldFullName.first().waitFor({ state: "hidden", timeout: 45_000 }),
      this.registrationDialog.waitFor({ state: "hidden", timeout: 45_000 }),
    ]).catch(() => {});
  }
}

module.exports = { UserManagementPage };
