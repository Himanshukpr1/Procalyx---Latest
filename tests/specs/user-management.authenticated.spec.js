/**
 * User Management — **TC01 logs in** with `data/test-data.js` → `login.validEmail` (email + OTP).
 * TC02–TC16 reuse the same browser tab (`sharedPage`).
 *
 * **Tags (grep by relationship / flow)** — run with TC01 so the session exists (`@login`):
 * - `@affordplan` — TC05–TC09 (Affordplan org user creation)
 * - `@hospital` — TC10–TC12 (Hospital relationship + entity assignments)
 * - `@manufacturer` — TC13–TC16 (Manufacturer relationship + entity assignments)
 *
 * Examples:
 * - `npm run test:user-mgmt:affordplan` / `:hospital` / `:manufacturer` (includes login)
 * - `npx playwright test tests/specs/user-management.authenticated.spec.js --grep '@login|@hospital' --project=chromium-authenticated --workers=1`
 *
 * Session: `.auth/qa-session.json` — one OTP per run via global setup; parallel workers share it. `FORCE_OTP_LOGIN=1` forces OTP in TC01.
 */
const { test, expect } = require("@playwright/test");
const env = require("../../data/env");
const umData = require("../../data/user-management");
const { UserManagementPage } = require("../pages/UserManagementPage");
const { buildRandomUserProfile } = require("../../utils/random-user");
const { getStorageStateForAuthenticatedSuite } = require("../helpers/auth-storage");
const { ensureAuthenticatedSession } = require("../helpers/authenticated-session");

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

test.describe("User management @dashboard", () => {
  /** @type {import('@playwright/test').BrowserContext | undefined} */
  let sharedContext;
  /** @type {import('@playwright/test').Page | undefined} */
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext({
      baseURL: env.baseUrl,
      storageState: getStorageStateForAuthenticatedSuite(),
    });
    sharedPage = await sharedContext.newPage();
  });

  test.afterAll(async () => {
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test("TC01 — Verify AP admin can login with valid credentials @login", async () => {
    /** With saved `.auth/qa-session.json`, opens `/dashboard` without OTP; otherwise `performOtpLoginOnPage` via `ensureAuthenticatedSession`. */
    await ensureAuthenticatedSession(sharedPage);
  });

  test("TC02 — Verify that AP admin user can see user management page", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);

    await expect(sharedPage).toHaveURL(/\/dashboard\/user-management/);
    await expect(um.sidebarUserManagementLink.first()).toBeVisible({ timeout: 15_000 });
    await um.expectUserManagementPageLoaded();
    await expect(um.dataGridOrTable).toBeVisible();
  });

  test("TC03 — Verify that AddUser button is clickable", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    await um.expectAddUserButtonClickable();
  });

  test("TC04 — Verify that all the required input fields are present in the User registration form", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    await um.openRegistrationForm();
    await um.expectRequiredRegistrationFieldsPresent();
    await um.dismissRegistrationDialog();
  });

  /**
   * TC05–TC09: `fillRegistrationForm` selects **Affordplan**, role, **Department**, **Country → State → City**
   * (defaults: first real option per dropdown in `data/user-management.js`; override with `UM_*` env vars), then **Create User**.
   */
  test("TC05 — Verify that AP admin can create a new Affordplan Admin user @affordplan", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    const data = buildRandomUserProfile("ap-admin");
    await um.openRegistrationForm();
    await um.fillRegistrationForm(data, umData.roles.affordplanAdmin);
    await um.submitRegistrationForm();
    await um.expectDialogClosedAfterCreate();
  });

  test("TC06 — Verify that AP admin can create a new HKAM Operator user @affordplan", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    const data = buildRandomUserProfile("ap-hkam");
    await um.openRegistrationForm();
    await um.fillRegistrationForm(data, umData.roles.hkamOperator);
    await um.submitRegistrationForm();
    await um.expectDialogClosedAfterCreate();
  });

  test("TC07 — Verify that AP admin can create a new MKAM Operator user @affordplan", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    const data = buildRandomUserProfile("ap-mkam");
    await um.openRegistrationForm();
    await um.fillRegistrationForm(data, umData.roles.mkamOperator);
    await um.submitRegistrationForm();
    await um.expectDialogClosedAfterCreate();
  });

  test("TC08 — Verify that AP admin can create a new Affordplan Operator user @affordplan", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    const data = buildRandomUserProfile("ap-op");
    await um.openRegistrationForm();
    await um.fillRegistrationForm(data, umData.roles.affordplanOperator);
    await um.submitRegistrationForm();
    await um.expectDialogClosedAfterCreate();
  });

  test("TC09 — Verify that AP admin can create a new Affordplan Super Admin user @affordplan", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    const data = buildRandomUserProfile("ap-sa");
    await um.openRegistrationForm();
    await um.fillRegistrationForm(data, umData.roles.affordplanSuperAdmin);
    await um.submitRegistrationForm();
    await um.expectDialogClosedAfterCreate();
  });

  /**
   * TC10–TC12: **Relationship** = Hospital → Entity Assignments: **Hospital Name** + **Hospital Unit Name** (multi-select),
   * then Create User. `hospitalEntityRequired` waits for those controls and fills `UM_HOSPITAL_NAME` / `UM_HOSPITAL_UNIT` (or first option).
   */
  test("TC10 — Verify that AP admin can create a new Hospital CXO user @hospital", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    const data = buildRandomUserProfile("hosp-cxo");
    await um.openRegistrationForm();
    await um.fillRegistrationForm(data, umData.hospitalRoles.cxo, "Hospital", {}, { hospitalEntityRequired: true });
    await um.submitRegistrationForm();
    await um.expectDialogClosedAfterCreate();
  });

  test("TC11 — Verify that AP admin can create a new Hospital Operator user @hospital", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    const data = buildRandomUserProfile("hosp-op");
    await um.openRegistrationForm();
    await um.fillRegistrationForm(data, umData.hospitalRoles.operator, "Hospital", {}, { hospitalEntityRequired: true });
    await um.submitRegistrationForm();
    await um.expectDialogClosedAfterCreate();
  });

  test("TC12 — Verify that AP admin can create a new Hospital Super Admin user @hospital", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    const data = buildRandomUserProfile("hosp-sa");
    await um.openRegistrationForm();
    await um.fillRegistrationForm(data, umData.hospitalRoles.superAdmin, "Hospital", {}, { hospitalEntityRequired: true });
    await um.submitRegistrationForm();
    await um.expectDialogClosedAfterCreate();
  });

  /**
   * TC13–TC16: **Relationship** = Manufacturer → **Manufacturer**, **Hospital Unit**, **Division**, **Therapy Area** (`manufacturerEntityRequired`).
   */
  test("TC13 — Verify that AP admin can create a new Manufacturer Business Head user @manufacturer", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    const data = buildRandomUserProfile("mfg-bh");
    await um.openRegistrationForm();
    await um.fillRegistrationForm(data, umData.manufacturerRoles.businessHead, "Manufacturer", {}, { manufacturerEntityRequired: true });
    await um.submitRegistrationForm();
    await um.expectDialogClosedAfterCreate();
  });

  test("TC14 — Verify that AP admin can create a new Manufacturer CXO user @manufacturer", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    const data = buildRandomUserProfile("mfg-cxo");
    await um.openRegistrationForm();
    await um.fillRegistrationForm(data, umData.manufacturerRoles.cxo, "Manufacturer", {}, { manufacturerEntityRequired: true });
    await um.submitRegistrationForm();
    await um.expectDialogClosedAfterCreate();
  });

  test("TC15 — Verify that AP admin can create a new Manufacturer Operator user @manufacturer", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    const data = buildRandomUserProfile("mfg-op");
    await um.openRegistrationForm();
    await um.fillRegistrationForm(data, umData.manufacturerRoles.operator, "Manufacturer", {}, { manufacturerEntityRequired: true });
    await um.submitRegistrationForm();
    await um.expectDialogClosedAfterCreate();
  });

  test("TC16 — Verify that AP admin can create a new Manufacturer Super Admin user @manufacturer", async () => {
    const um = new UserManagementPage(sharedPage);
    await um.openUserManagement(env.userManagementPath);
    const data = buildRandomUserProfile("mfg-sa");
    await um.openRegistrationForm();
    await um.fillRegistrationForm(data, umData.manufacturerRoles.superAdmin, "Manufacturer", {}, { manufacturerEntityRequired: true });
    await um.submitRegistrationForm();
    await um.expectDialogClosedAfterCreate();
  });
});
