/**
 * MKAM operator — Manufacturer Management (`/mkam/manufacturer-management`).
 *
 * Tags: `@login` (TC01), `@mkam-manufacturer` (TC02–TC11).
 * `AUTH_PROFILE=mkam_operator npx playwright test tests/specs/mkam-manufacturer.authenticated.spec.js --grep '@login|@mkam-manufacturer' --project=chromium-authenticated --workers=1`
 *
 * Session: `.auth/qa-mkam-operator-session.json`. Reuses OTP + **Manufacturer Unit** → **My Dashboard** from `login.spec`.
 */
const { test, expect } = require("@playwright/test");
const env = require("../../../data/AP SuperAdmin/env");
const { urlPathIsLoginPage } = require("../../../data/AP SuperAdmin/auth-profiles");
const { buildMkamManufacturerPayload } = require("../../../data/AP SuperAdmin/mkam-manufacturer");
const { MkamManufacturerManagementPage } = require("../../pages/AP SuperAdmin/MkamManufacturerManagementPage");
const { MkamManufacturerAddPage } = require("../../pages/AP SuperAdmin/MkamManufacturerAddPage");
const { getStorageStateForAuthenticatedSuite } = require("../../helpers/auth-storage");
const { ensureAuthenticatedSession } = require("../../helpers/authenticated-session");

test.describe.configure({ mode: "serial" });
test.setTimeout(600_000);

test.describe("MKAM Manufacturer Management @dashboard", () => {
  /** @type {import('@playwright/test').BrowserContext | undefined} */
  let sharedContext;
  /** @type {import('@playwright/test').Page | undefined} */
  let sharedPage;
  /** Set in TC05 — searched in TC11 */
  let manufacturerPayload;

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext({
      baseURL: env.baseUrl,
      storageState: getStorageStateForAuthenticatedSuite(),
    });
    sharedPage = await sharedContext.newPage();
    await ensureAuthenticatedSession(sharedPage);
  });

  test.afterAll(async () => {
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test("TC01 — Verify MKAM operator can login with valid credentials @login", async () => {
    await expect(async () => {
      expect(urlPathIsLoginPage(sharedPage.url())).toBe(false);
    }).toPass({ timeout: 15_000 });
  });

  test("TC02 — Verify MKAM operator can click on Manufacturer Masters @mkam-manufacturer", async () => {
    const list = new MkamManufacturerManagementPage(sharedPage);
    await list.gotoHomeAndOpenManufacturerManagement();
    await list.expectManufacturerManagementListVisible();
  });

  test("TC03 — Verify MKAM operator can click on \"Add New MFG\" button @mkam-manufacturer", async () => {
    const list = new MkamManufacturerManagementPage(sharedPage);
    await list.expectAddNewMfgButtonVisibleAndEnabled();
    await list.clickAddNewMfgButton();
  });

  test("TC04 — Verify MKAM operator lands on Add New Manufacturer Screen @mkam-manufacturer", async () => {
    const add = new MkamManufacturerAddPage(sharedPage);
    await add.expectAddManufacturerScreenLoaded();
  });

  test("TC05 — Verify MKAM operator is able to fill MFG KYB section @mkam-manufacturer", async () => {
    manufacturerPayload = buildMkamManufacturerPayload();
    const add = new MkamManufacturerAddPage(sharedPage);
    await add.fillMfgKybSection(manufacturerPayload);
  });

  test("TC06 — Verify MKAM operator is able to fill MFG Information section @mkam-manufacturer", async () => {
    const add = new MkamManufacturerAddPage(sharedPage);
    if (!manufacturerPayload) throw new Error("Run TC05 first.");
    await add.fillMfgInformationSection(manufacturerPayload);
  });

  test("TC07 — Verify MKAM operator is able to fill MFG SPOC Info section @mkam-manufacturer", async () => {
    const add = new MkamManufacturerAddPage(sharedPage);
    if (!manufacturerPayload) throw new Error("Run TC05 first.");
    await add.fillMfgSpocInfoSection(manufacturerPayload);
  });

  test("TC08 — Verify MKAM operator is able to fill MFG Contract Details section @mkam-manufacturer", async () => {
    const add = new MkamManufacturerAddPage(sharedPage);
    if (!manufacturerPayload) throw new Error("Run TC05 first.");
    await add.fillMfgContractSection(manufacturerPayload);
  });

  test("TC09 — Verify MKAM operator is able to fill MFG Commercials section @mkam-manufacturer", async () => {
    const add = new MkamManufacturerAddPage(sharedPage);
    if (!manufacturerPayload) throw new Error("Run TC05 first.");
    await add.fillMfgCommercialsSection(manufacturerPayload);
  });

  test("TC10 — Verify MKAM operator is able to fill MFG Bank Account details section @mkam-manufacturer", async () => {
    const add = new MkamManufacturerAddPage(sharedPage);
    if (!manufacturerPayload) throw new Error("Run TC05 first.");
    await add.fillMfgBankSection(manufacturerPayload);
    await add.submitCreate();
  });

  test("TC11 — Verify MKAM operator is able to search created MFG under Manufacturer Masters > Pending @mkam-manufacturer", async () => {
    const list = new MkamManufacturerManagementPage(sharedPage);
    if (!manufacturerPayload?.mfgLegalName) {
      throw new Error("TC05–TC10 did not set manufacturerPayload — run serially.");
    }
    const searchText = manufacturerPayload.mfgLegalName;
    await list.openManufacturerManagementList();
    await list.expectCreatedMfgListedUnderPendingByLegalName(searchText);
  });
});
