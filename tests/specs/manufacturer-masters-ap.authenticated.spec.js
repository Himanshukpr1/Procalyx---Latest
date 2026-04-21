/**
 * Manufacturer Onboarding — Affordplan Master → **Manufacturer Masters** (`/dashboard/manufacturer-masters-ap`).
 *
 * Tags: `@login` (TC01), `@manufacturer-masters-ap` (TC02–TC06), `@manufacturer-onboarding` (TC07–TC17).
 * `npx playwright test tests/specs/manufacturer-masters-ap.authenticated.spec.js --grep '@login|@manufacturer-masters-ap|@manufacturer-onboarding' --project=chromium-authenticated --workers=1`
 */
const { test, expect } = require("@playwright/test");
const env = require("../../data/env");
const mfgData = require("../../data/manufacturer-masters");
const { ManufacturerMastersPage } = require("../pages/ManufacturerMastersPage");
const { ManufacturerMastersAddPage } = require("../pages/ManufacturerMastersAddPage");
const { ManufacturerOnboardingPage } = require("../pages/ManufacturerOnboardingPage");
const { ManufacturerOnboardingEditPage } = require("../pages/ManufacturerOnboardingEditPage");
const { getStorageStateForAuthenticatedSuite } = require("../helpers/auth-storage");
const { ensureAuthenticatedSession } = require("../helpers/authenticated-session");

test.describe.configure({ mode: "serial" });
test.setTimeout(300_000);

test.describe("Manufacturer Masters (AP) @dashboard", () => {
  /** @type {import('@playwright/test').BrowserContext | undefined} */
  let sharedContext;
  /** @type {import('@playwright/test').Page | undefined} */
  let sharedPage;
  let manufacturerPayload;
  /** `mfgSubsidiaryName` for TC06 / TC08 (onboarding list **MFG Name**). */
  let createdSubsidiaryName = "";
  /** Built in TC11 — shared by TC12–TC17 on the same edit screen. */
  let onboardingEditPayload;

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
    await ensureAuthenticatedSession(sharedPage);
  });

  test("TC02 — Verify AP admin can click on Affordplan Master @manufacturer-masters-ap", async () => {
    const list = new ManufacturerMastersPage(sharedPage);
    await list.goto("/dashboard");
    await list.clickAffordplanMasterNav();
  });

  test("TC03 — Verify AP admin can click on Manufacturer Master @manufacturer-masters-ap", async () => {
    const list = new ManufacturerMastersPage(sharedPage);
    await list.clickManufacturerMastersSidebarLink();
    await list.expectManufacturerMastersListVisible();
  });

  test("TC04 — Verify Add new Button is Clickable @manufacturer-masters-ap", async () => {
    const list = new ManufacturerMastersPage(sharedPage);
    await list.openManufacturerMastersList(env.manufacturerMastersApPath);
    await list.expectAddNewButtonClickable();
  });

  test("TC05 — Verify AP admin is able to perform Minimalistic Manufacturer Boarding @manufacturer-masters-ap", async () => {
    const list = new ManufacturerMastersPage(sharedPage);
    const add = new ManufacturerMastersAddPage(sharedPage);
    manufacturerPayload = mfgData.buildMinimalManufacturerPayload();
    createdSubsidiaryName = manufacturerPayload.mfgSubsidiaryName;

    await list.openManufacturerMastersList(env.manufacturerMastersApPath);
    await list.clickAddNewManufacturer();
    await add.expectAddManufacturerFormLoaded();
    await add.fillMinimalManufacturerCreate(manufacturerPayload);
    await add.submitCreate();
    await add.expectCreateSucceeded();
  });

  test("TC06 — Verify Manufacturer created is search under Manufacturer Master screen @manufacturer-masters-ap", async () => {
    const list = new ManufacturerMastersPage(sharedPage);
    if (!createdSubsidiaryName) {
      throw new Error("TC05 did not set createdSubsidiaryName — run the suite serially including TC05.");
    }
    await list.openManufacturerMastersList(env.manufacturerMastersApPath);
    await list.expectManufacturerListedBySubsidiaryName(createdSubsidiaryName);
  });

  test("TC07 — Verify AP admin can click on Manufacturer onboarding @manufacturer-onboarding", async () => {
    const onboarding = new ManufacturerOnboardingPage(sharedPage);
    await onboarding.goto("/dashboard");
    await onboarding.clickManufacturerOnboardingNav();
    await onboarding.expectOnboardingListVisible();
  });

  test("TC08 — Verify Manufacturer created is search under Manufacturer Master (onboarding list) @manufacturer-onboarding", async () => {
    const onboarding = new ManufacturerOnboardingPage(sharedPage);
    if (!createdSubsidiaryName) {
      throw new Error("TC05 did not set createdSubsidiaryName — run the suite serially including TC05.");
    }
    await onboarding.gotoOnboardingList(env.manufacturerOnboardingPath);
    await onboarding.expectOnboardingListVisible();
    await onboarding.expectManufacturerListedByMfgName(createdSubsidiaryName);
  });

  test("TC09 — Verify AP admin is able to click on Edit icon under Action Header @manufacturer-onboarding", async () => {
    const onboarding = new ManufacturerOnboardingPage(sharedPage);
    if (!createdSubsidiaryName) {
      throw new Error("TC05 did not set createdSubsidiaryName — run the suite serially including TC05.");
    }
    await onboarding.gotoOnboardingList(env.manufacturerOnboardingPath);
    await onboarding.expectManufacturerListedByMfgName(createdSubsidiaryName);
    await onboarding.clickEditManufacturerAction(createdSubsidiaryName);
  });

  test("TC10 — Verify AP admin lands on Edit Manufacturer Screen @manufacturer-onboarding", async () => {
    const edit = new ManufacturerOnboardingEditPage(sharedPage);
    await edit.expectEditManufacturerLoaded();
  });

  test("TC11 — Verify AP admin is able to fill MFG KYB section @manufacturer-onboarding", async () => {
    const edit = new ManufacturerOnboardingEditPage(sharedPage);
    if (!createdSubsidiaryName) {
      throw new Error("TC05 did not set createdSubsidiaryName — run the suite serially including TC05.");
    }
    onboardingEditPayload = mfgData.buildManufacturerOnboardingEditPayload(createdSubsidiaryName);
    await edit.fillMfgKybSection(onboardingEditPayload);
  });

  test("TC12 — Verify AP admin is able to fill MFG Information section @manufacturer-onboarding", async () => {
    const edit = new ManufacturerOnboardingEditPage(sharedPage);
    if (!onboardingEditPayload) {
      throw new Error("Run TC11 first — onboardingEditPayload is required.");
    }
    await edit.fillMfgInformationSection(onboardingEditPayload);
  });

  test("TC13 — Verify AP admin is able to fill AP KAM Info section @manufacturer-onboarding", async () => {
    const edit = new ManufacturerOnboardingEditPage(sharedPage);
    if (!onboardingEditPayload) {
      throw new Error("Run TC11 first — onboardingEditPayload is required.");
    }
    await edit.fillApKamInfoSection(onboardingEditPayload.apKamUserLabel);
  });

  test("TC14 — Verify AP admin is able to fill MFG SPOC Info section @manufacturer-onboarding", async () => {
    const edit = new ManufacturerOnboardingEditPage(sharedPage);
    if (!onboardingEditPayload) {
      throw new Error("Run TC11 first — onboardingEditPayload is required.");
    }
    await edit.fillMfgSpocInfoSection(onboardingEditPayload);
  });

  test("TC15 — Verify AP admin is able to fill MFG Contract Details section @manufacturer-onboarding", async () => {
    const edit = new ManufacturerOnboardingEditPage(sharedPage);
    if (!onboardingEditPayload) {
      throw new Error("Run TC11 first — onboardingEditPayload is required.");
    }
    await edit.fillMfgContractSection(onboardingEditPayload);
  });

  test("TC16 — Verify AP admin is able to fill MFG Commercials section @manufacturer-onboarding", async () => {
    const edit = new ManufacturerOnboardingEditPage(sharedPage);
    if (!onboardingEditPayload) {
      throw new Error("Run TC11 first — onboardingEditPayload is required.");
    }
    await edit.fillMfgCommercialsSection(onboardingEditPayload);
  });

  test("TC17 — Verify AP admin is able to fill MFG Bank Account details section and save @manufacturer-onboarding", async () => {
    const edit = new ManufacturerOnboardingEditPage(sharedPage);
    if (!onboardingEditPayload) {
      throw new Error("Run TC11 first — onboardingEditPayload is required.");
    }
    await edit.fillMfgBankSection(onboardingEditPayload);
    await edit.submitSaveAndConfirm();
    await edit.expectReturnedToOnboardingList();
    await expect(sharedPage).toHaveURL(/\/dashboard\/manufacturer-masters\/?$/);
  });
});
