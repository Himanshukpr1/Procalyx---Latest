/**
 * Manufacturer Masters → **Manufacturer Item** (`/dashboard/manufacturer-item`, `/add`).
 *
 * Tags: `@login` (TC01), `@manufacturer-item` (TC02–TC10).
 * `npx playwright test tests/specs/manufacturer-item.authenticated.spec.js --grep '@login|@manufacturer-item' --project=chromium-authenticated --workers=1`
 */
const { test } = require("@playwright/test");
const env = require("../../data/env");
const itemData = require("../../data/manufacturer-item");
const { ManufacturerItemPage } = require("../pages/ManufacturerItemPage");
const { ManufacturerItemAddPage } = require("../pages/ManufacturerItemAddPage");
const { getStorageStateForAuthenticatedSuite } = require("../helpers/auth-storage");
const { ensureAuthenticatedSession } = require("../helpers/authenticated-session");

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

  test("TC04 — Verify Add new Button is Clickable @manufacturer-item", async () => {
    const list = new ManufacturerItemPage(sharedPage);
    await list.openManufacturerItemList(env.manufacturerItemPath);
    await list.expectAddNewButtonClickable();
  });

  test("TC05 — Verify AP admin is able to search and fill AffordPlan Generic Item @manufacturer-item", async () => {
    const list = new ManufacturerItemPage(sharedPage);
    const add = new ManufacturerItemAddPage(sharedPage);
    itemPayload = itemData.buildManufacturerItemPayload();
    createdItemName = itemPayload.itemName;

    await list.openManufacturerItemList(env.manufacturerItemPath);
    await list.clickAddNew();
    await add.expectAddManufacturerItemFormLoaded();
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
