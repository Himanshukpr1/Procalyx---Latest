/**
 * Hospital Master — Hospital Onboarding → **Hospital** (`/dashboard/hospital-masters`, `/add`).
 * Serial + shared page; **TC01** is skipped (storage state from global setup; `@login` covered elsewhere).
 *
 * Tags: `@login` (TC01), `@hospital-master` (TC02–TC14). Example:
 * `npx playwright test tests/specs/hospital-masters.authenticated.spec.js --grep '@login|@hospital-master' --project=chromium-authenticated --workers=1`
 *
 * Session: `tests/global-setup.js` + `.auth/qa-session.json` — one OTP before the run; parallel workers reuse it. **TC01** is skipped (storage state from global setup).
 * **HKAM operator** (`AUTH_PROFILE=hkam_operator`): session `.auth/qa-hkam-operator-session.json`; **TC10** skipped (SPOC auto-filled).
 */
const { test, expect } = require("@playwright/test");
const env = require("../../data/env");
const hmData = require("../../data/hospital-masters");
const { HospitalMastersPage } = require("../pages/HospitalMastersPage");
const { HospitalAddPage } = require("../pages/HospitalAddPage");
const { getStorageStateForAuthenticatedSuite } = require("../helpers/auth-storage");
const { ensureAuthenticatedSession } = require("../helpers/authenticated-session");
const { getAuthProfile } = require("../../data/auth-profiles");

test.describe.configure({ mode: "serial" });
test.setTimeout(300_000);

test.describe("Hospital Master @dashboard", () => {
  /** @type {import('@playwright/test').BrowserContext | undefined} */
  let sharedContext;
  /** @type {import('@playwright/test').Page | undefined} */
  let sharedPage;
  /** Built in TC05; TC06–TC13 fill the add form; TC14 asserts list. */
  let hospitalPayload;
  /** Hospital display name for TC14 (set with payload in TC05). */
  let createdHospitalName = "";

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

  test.skip(
    true,
    "TC01 skipped — authenticated context uses global setup / saved storage state (@login covered elsewhere)"
  );

  test("TC01 — Verify AP admin can login with valid credentials @login", async () => {
    await ensureAuthenticatedSession(sharedPage);
  });

  test("TC02 — Verify AP admin can click on Hospital Onboarding @hospital-master", async () => {
    const list = new HospitalMastersPage(sharedPage);
    await list.goto("/dashboard");
    await list.clickHospitalOnboardingNav();
  });

  test("TC03 — Verify AP admin can click on Hospital @hospital-master", async () => {
    const list = new HospitalMastersPage(sharedPage);
    await list.clickHospitalSidebarLink(env.hospitalMastersPath);
    await list.expectHospitalMasterListVisible();
  });

  test("TC04 — Verify Add new Hospital Button is Clickable @hospital-master", async () => {
    const list = new HospitalMastersPage(sharedPage);
    await list.openHospitalMastersList(env.hospitalMastersPath);
    await list.expectAddNewHospitalButtonClickable();
  });

  test("TC05 — Verify AP admin is able to fill Hospital KYB section @hospital-master", async () => {
    const list = new HospitalMastersPage(sharedPage);
    const add = new HospitalAddPage(sharedPage);
    hospitalPayload = hmData.buildHospitalCreatePayload();
    createdHospitalName = hospitalPayload.hospitalName;

    await list.openHospitalMastersList(env.hospitalMastersPath);
    await list.clickAddNewHospital();
    await add.expectAddHospitalScreenLoaded();
    await add.fillHospitalKybSection(hospitalPayload);
  });

  test("TC06 — Verify AP admin is able to fill Hospital Information section @hospital-master", async () => {
    const add = new HospitalAddPage(sharedPage);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalInformationSection(hospitalPayload);
  });

  test("TC07 — Verify AP admin is able to fill Hospital HIS section @hospital-master", async () => {
    const add = new HospitalAddPage(sharedPage);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalHisSection();
  });

  test("TC08 — Verify AP admin is able to fill Hospital Infrastructure section @hospital-master", async () => {
    const add = new HospitalAddPage(sharedPage);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalInfrastructureSection(hospitalPayload);
  });

  test("TC09 — Verify AP admin is able to fill AP KAM Info section @hospital-master", async () => {
    const add = new HospitalAddPage(sharedPage);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillApKamInfoSection();
    await add.expectApKamAutoFilledEmailAndDesignation();
  });

  test.skip(
    getAuthProfile() === "hkam_operator",
    "HKAM Operator: Hospital SPOC Info is auto-filled — TC10 not applicable"
  );

  test("TC10 — Verify AP admin is able to fill Hospital SPOC Info section @hospital-master", async () => {
    const add = new HospitalAddPage(sharedPage);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalSpocSection(hospitalPayload);
  });

  test("TC11 — Verify AP admin is able to fill Hospital Contract Details section @hospital-master", async () => {
    const add = new HospitalAddPage(sharedPage);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalContractDetailsSection();
  });

  test("TC12 — Verify AP admin is able to fill Hospital Commercials section @hospital-master", async () => {
    const add = new HospitalAddPage(sharedPage);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalCommercialsSection();
  });

  test("TC13 — Verify AP admin is able to fill Hospital Bank Account details section @hospital-master", async () => {
    const add = new HospitalAddPage(sharedPage);
    if (!hospitalPayload) throw new Error("Run TC05 first — hospitalPayload is missing.");
    await add.fillHospitalBankAccountSection(hospitalPayload);
    await add.submitCreateHospital();
    await add.expectCreateSucceeded();
  });

  test("TC14 — Verify the Hospital created is search under Hospital screen @hospital-master", async () => {
    const list = new HospitalMastersPage(sharedPage);
    if (!createdHospitalName) {
      throw new Error("TC05 did not set createdHospitalName — run the suite serially including TC05.");
    }
    await list.openHospitalMastersList(env.hospitalMastersPath);
    await list.expectHospitalListedByName(createdHospitalName);
  });
});
