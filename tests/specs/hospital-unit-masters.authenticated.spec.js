/**
 * Hospital Unit Master — Super Admin: `/dashboard/hospital-unit-masters`; HKAM: `/hkam/hospital-unit-management` (+ `/add`).
 * Reuses `HospitalAddPage` with **Hospital Unit** variant (extra **Hospital Selection** step).
 *
 * **TC05** orders hospitals (**Auto Hospital …** newest first), then picks the first. **TC14** retries submit with the
 * **next** hospitals (full form refill) if creation fails.
 *
 * Tags: `@login` (TC01), `@hospital-unit-master` (TC02–TC16).
 * `npx playwright test tests/specs/hospital-unit-masters.authenticated.spec.js --grep '@login|@hospital-unit-master' --project=chromium-authenticated --workers=1`
 *
 * Session: `.auth/qa-session.json` from global setup — parallel workers reuse one login. `beforeAll` calls `ensureAuthenticatedSession` before TC01 (light `@login` check only).
 * **HKAM operator** (`AUTH_PROFILE=hkam_operator`): **TC02** skipped (no Hospital Onboarding nav); **TC10** skipped via `testInfo.skip` (AP KAM Info auto-filled). Sidebar label **Hospital Unit Masters** — see `HospitalUnitMastersPage.clickHospitalUnitSidebarLink`.
 */
const { test, expect } = require("@playwright/test");
const env = require("../../data/env");
const hmData = require("../../data/hospital-masters");
const { HospitalMastersPage } = require("../pages/HospitalMastersPage");
const { HospitalUnitMastersPage } = require("../pages/HospitalUnitMastersPage");
const { HospitalAddPage, getFormVariants } = require("../pages/HospitalAddPage");
const { getStorageStateForAuthenticatedSuite } = require("../helpers/auth-storage");
const { ensureAuthenticatedSession } = require("../helpers/authenticated-session");
const { getAuthProfile } = require("../../data/auth-profiles");

test.describe.configure({ mode: "serial" });
test.setTimeout(600_000);
const UNIT_VARIANT = getFormVariants().HOSPITAL_UNIT;

/**
 * TC06–TC13 — after Hospital Selection (used again inside TC14 when switching hospitals).
 * @param {HospitalAddPage} add
 * @param {ReturnType<typeof hmData.buildHospitalCreatePayload>} hospitalPayload
 */
async function fillHospitalUnitFormAfterSelection(add, hospitalPayload) {
  await add.fillHospitalKybSection(hospitalPayload);
  await add.fillHospitalInformationSection(hospitalPayload);
  await add.fillHospitalHisSection();
  await add.fillHospitalInfrastructureSection(hospitalPayload);
  await add.fillApKamInfoSection();
  await add.expectApKamAutoFilledEmailAndDesignation();
  await add.fillHospitalSpocSection(hospitalPayload);
  await add.fillHospitalContractDetailsSection();
  await add.fillHospitalCommercialsSection();
}

test.describe("Hospital Unit Master @dashboard", () => {
  /** @type {import('@playwright/test').BrowserContext | undefined} */
  let sharedContext;
  /** @type {import('@playwright/test').Page | undefined} */
  let sharedPage;
  let hospitalPayload;
  /** `info.hospitalUnitName` / list search string for TC15 */
  let createdUnitName = "";
  /** Set in TC05 — used by TC14 for submit retries */
  let hospitalSelectionCandidates = [];

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

  test("TC01 — Verify AP admin can login with valid credentials @login", async () => {
    const { urlPathIsLoginPage } = require("../../data/auth-profiles");
    await expect(async () => {
      expect(urlPathIsLoginPage(sharedPage.url())).toBe(false);
    }).toPass({ timeout: 15_000 });
  });

  test("TC02 — Verify AP admin can click on Hospital Onboarding @hospital-unit-master", async ({}, testInfo) => {
    testInfo.skip(
      getAuthProfile() === "hkam_operator",
      "HKAM Operator: sidebar has no Hospital Onboarding expand step — TC02 not applicable"
    );
    const list = new HospitalMastersPage(sharedPage);
    await list.goto(env.appHomePath, { waitUntil: "domcontentloaded" });
    await list.clickHospitalOnboardingNav();
  });

  test("TC03 — Verify AP admin can click on Hospital Unit @hospital-unit-master", async () => {
    const list = new HospitalUnitMastersPage(sharedPage);
    await list.clickHospitalUnitSidebarLink();
    await list.expectHospitalUnitMasterListVisible();
  });

  test("TC04 — Verify Add new Hospital Unit Button is Clickable @hospital-unit-master", async () => {
    const list = new HospitalUnitMastersPage(sharedPage);
    await list.openHospitalUnitMastersList(env.hospitalUnitMastersPath);
    await list.expectAddNewHospitalUnitButtonClickable();
  });

  test("TC05 — Verify AP admin is able to fill Hospital Selection section @hospital-unit-master", async () => {
    const list = new HospitalUnitMastersPage(sharedPage);
    const add = new HospitalAddPage(sharedPage, UNIT_VARIANT);
    hospitalPayload = hmData.buildHospitalCreatePayload();
    createdUnitName = hospitalPayload.hospitalName;

    await list.openHospitalUnitMastersList(env.hospitalUnitMastersPath);
    await list.clickAddNewHospitalUnit();
    await add.expectAddHospitalScreenLoaded();

    hospitalSelectionCandidates = await add.collectAndOrderHospitalSelectionCandidates();
    if (!hospitalSelectionCandidates.length) {
      throw new Error(
        "No hospitals in Hospital Selection dropdown — create a Hospital (e.g. Auto Hospital …) in QA first."
      );
    }
    await add.fillHospitalSelectionSectionForLabel(hospitalSelectionCandidates[0]);
  });

  test("TC06 — Verify AP admin is able to fill Hospital Unit KYB section @hospital-unit-master", async () => {
    const add = new HospitalAddPage(sharedPage, UNIT_VARIANT);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalKybSection(hospitalPayload);
  });

  test("TC07 — Verify AP admin is able to fill Hospital Unit Information section @hospital-unit-master", async () => {
    const add = new HospitalAddPage(sharedPage, UNIT_VARIANT);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalInformationSection(hospitalPayload);
  });

  test("TC08 — Verify AP admin is able to fill Hospital Unit HIS section @hospital-unit-master", async () => {
    const add = new HospitalAddPage(sharedPage, UNIT_VARIANT);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalHisSection();
  });

  test("TC09 — Verify AP admin is able to fill Hospital Unit Infrastructure section @hospital-unit-master", async () => {
    const add = new HospitalAddPage(sharedPage, UNIT_VARIANT);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalInfrastructureSection(hospitalPayload);
  });

  test("TC10 — Verify AP admin is able to fill AP KAM Info section @hospital-unit-master", async ({}, testInfo) => {
    testInfo.skip(
      getAuthProfile() === "hkam_operator",
      "HKAM Operator: AP KAM Info is auto-filled — TC10 not applicable"
    );
    const add = new HospitalAddPage(sharedPage, UNIT_VARIANT);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillApKamInfoSection();
    await add.expectApKamAutoFilledEmailAndDesignation();
  });

  test("TC11 — Verify AP admin is able to fill Hospital Unit SPOC Info section @hospital-unit-master", async () => {
    const add = new HospitalAddPage(sharedPage, UNIT_VARIANT);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalSpocSection(hospitalPayload);
  });

  test("TC12 — Verify AP admin is able to fill Hospital Unit Contract Details section @hospital-unit-master", async () => {
    const add = new HospitalAddPage(sharedPage, UNIT_VARIANT);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalContractDetailsSection();
  });

  test("TC13 — Verify AP admin is able to fill Hospital Unit Commercials section @hospital-unit-master", async () => {
    const add = new HospitalAddPage(sharedPage, UNIT_VARIANT);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalCommercialsSection();
  });

  test("TC14 — Verify AP admin is able to fill Hospital Unit Bank Account details section @hospital-unit-master", async () => {
    const list = new HospitalUnitMastersPage(sharedPage);
    const add = new HospitalAddPage(sharedPage, UNIT_VARIANT);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    if (!hospitalSelectionCandidates.length) throw new Error("Run TC05 first — hospitalSelectionCandidates is missing.");

    for (let attempt = 0; attempt < hospitalSelectionCandidates.length; attempt++) {
      if (attempt > 0) {
        hospitalPayload = hmData.buildHospitalCreatePayload();
        createdUnitName = hospitalPayload.hospitalName;
        await list.openHospitalUnitMastersList(env.hospitalUnitMastersPath);
        await list.clickAddNewHospitalUnit();
        await add.expectAddHospitalScreenLoaded();
        await add.fillHospitalSelectionSectionForLabel(hospitalSelectionCandidates[attempt]);
        await fillHospitalUnitFormAfterSelection(add, hospitalPayload);
      }

      await add.fillHospitalBankAccountSection(hospitalPayload);
      await add.submitCreateHospital();
      try {
        await add.expectCreateSucceeded();
        break;
      } catch (e) {
        if (attempt === hospitalSelectionCandidates.length - 1) {
          throw e;
        }
      }
    }
  });

  test("TC15 — Verify the Hospital Unit created is search under Hospital Unit screen @hospital-unit-master", async () => {
    const list = new HospitalUnitMastersPage(sharedPage);
    if (!createdUnitName) {
      throw new Error("TC05 / TC14 did not set createdUnitName — run the suite serially.");
    }
    await list.openHospitalUnitMastersList(env.hospitalUnitMastersPath);
    await list.expectHospitalUnitListedByName(createdUnitName);
  });

  test("TC16 — Verify user session remains on dashboard after Hospital Unit flow @hospital-unit-master", async () => {
    await expect(sharedPage).not.toHaveURL(/\/login/);
  });
});
