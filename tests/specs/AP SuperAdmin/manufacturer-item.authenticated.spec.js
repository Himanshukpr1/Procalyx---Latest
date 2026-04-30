/**
 * Manufacturer Masters → **Manufacturer Item** (`/dashboard/manufacturer-item`). List has no **Add New**; open a row via **Actions** → edit (random row).
 *
 * Tags: `@login` (TC01), `@manufacturer-item` (TC02–TC10). TC04 opens **Edit** once; TC05 continues on the same form (no second list navigation / edit click).
 * `npx playwright test tests/specs/manufacturer-item.authenticated.spec.js --grep '@login|@manufacturer-item' --project=chromium-authenticated --workers=1`
 * AP operator: `npm run test:manufacturer-item:ap-operator:flow` (sets `AUTH_PROFILE=ap_operator`; see `data/auth-profiles.js`).
 */
const { test } = require("@playwright/test");
const env = require("../../../data/AP SuperAdmin/env");
const itemData = require("../../../data/AP SuperAdmin/manufacturer-item");
const { ManufacturerItemPage } = require("../../pages/AP SuperAdmin/ManufacturerItemPage");
const { ManufacturerItemAddPage } = require("../../pages/AP SuperAdmin/ManufacturerItemAddPage");
const { getStorageStateForAuthenticatedSuite } = require("../../helpers/auth-storage");
const { ensureAuthenticatedSession } = require("../../helpers/authenticated-session");

test.describe.configure({ mode: "serial" });
test.setTimeout(300_000);

test.describe("Manufacturer Item @dashboard", () => {
  /** @type {import('@playwright/test').BrowserContext | undefined} */
  let sharedContext;
  /** @type {import('@playwright/test').Page | undefined} */
  let sharedPage;
  /** Set in TC05 — used for TC06–TC10. */
  let itemPayload;
  /** TC10 — search **Item Name** column for this value. */
  let createdItemName = "";

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext({
      baseURL: env.baseUrl,
      storageState: getStorageStateForAuthenticatedSuite(),
      /** Align with typical headed window — smaller defaults break MUI virtualized rows / Autocomplete portal in headless. */
      viewport: { width: 1920, height: 1080 },
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

  test("TC02 — Verify AP admin can click on Manufacturers Master @manufacturer-item", async () => {
    const list = new ManufacturerItemPage(sharedPage);
    await list.goto("/dashboard");
    await list.clickManufacturerMastersNav();
  });

  test("TC03 — Verify AP admin can click on Manufacturer Item @manufacturer-item", async () => {
    const list = new ManufacturerItemPage(sharedPage);
    await list.clickManufacturerItemSidebarLink();
    await list.expectManufacturerItemListVisible();
  });

  test("TC04 — Verify AP admin is able to click on edit icon under Actions @manufacturer-item", async () => {
    const list = new ManufacturerItemPage(sharedPage);
    await list.openManufacturerItemList(env.manufacturerItemPath);
    await list.clickRandomRowEditInActions();
  });

  test("TC05 — Verify AP admin is able to search and fill AffordPlan Generic Item @manufacturer-item", async () => {
    const list = new ManufacturerItemPage(sharedPage);
    const add = new ManufacturerItemAddPage(sharedPage);
    itemPayload = itemData.buildManufacturerItemPayload();
    createdItemName = itemPayload.itemName;

    if (!(await add.isOnEditView())) {
      await list.openManufacturerItemList(env.manufacturerItemPath);
      /** First row avoids virtualized-grid randomness that differs headless vs headed. */
      await list.clickEditInActionsForRowIndex(0);
    }
    await add.expectEditManufacturerItemFormLoaded();
    await add.fillAffordplanGenericItem(itemData.affordplanGenericItemSearch);
  });

  test("TC06 — Verify AP admin is able to fill Item code @manufacturer-item", async () => {
    const add = new ManufacturerItemAddPage(sharedPage);
    if (!itemPayload) {
      throw new Error("TC05 did not set itemPayload — run the suite serially including TC05.");
    }
    await add.fillItemCode(itemPayload.itemCode);
  });

  test("TC07 — Verify AP admin is able to fill Item Name @manufacturer-item", async () => {
    const add = new ManufacturerItemAddPage(sharedPage);
    if (!itemPayload) {
      throw new Error("TC05 did not set itemPayload — run the suite serially including TC05.");
    }
    await add.fillItemName(itemPayload.itemName);
  });

  test("TC08 — Verify AP admin is able to enter Remarks @manufacturer-item", async () => {
    const add = new ManufacturerItemAddPage(sharedPage);
    await add.fillRemarks(itemData.remarksText);
  });

  test("TC09 — Verify AP admin is able to click on save Button @manufacturer-item", async () => {
    const add = new ManufacturerItemAddPage(sharedPage);
    await add.clickSave();
    await add.expectSaveSucceeded();
  });

  test("TC10 — Verify AP admin is able to search created item under Manufacturer Item @manufacturer-item", async () => {
    const list = new ManufacturerItemPage(sharedPage);
    if (!createdItemName) {
      throw new Error("TC05 did not set createdItemName — run the suite serially including TC05.");
    }
    await list.openManufacturerItemList(env.manufacturerItemPath);
    await list.expectItemListedByItemName(createdItemName);
  });
});
