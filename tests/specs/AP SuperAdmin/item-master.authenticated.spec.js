/**
 * **Affordplan Master** → **Item Master** (`/dashboard/item-master`, `/add`).
 *
 * Tags: `@login` (TC01), `@item-master` (TC02–TC06).
 * `npx playwright test tests/specs/item-master.authenticated.spec.js --grep '@login|@item-master' --project=chromium-authenticated --workers=1`
 * AP operator: `npm run test:item-master:ap-operator:flow`.
 *
 * Requires a valid stored session for the active `AUTH_PROFILE` (see `data/auth-profiles.js`) or interactive OTP; refresh with `REFRESH_AUTH=1` or the matching `npm run test:auth:save` / `test:auth:save:ap-operator` if TC02+ fail after TC01.
 */
const { test } = require("@playwright/test");
const env = require("../../../data/AP SuperAdmin/env");
const itemData = require("../../../data/AP SuperAdmin/item-master");
const { ItemMasterPage } = require("../../pages/AP SuperAdmin/ItemMasterPage");
const { ItemMasterAddPage } = require("../../pages/AP SuperAdmin/ItemMasterAddPage");
const { getStorageStateForAuthenticatedSuite } = require("../../helpers/auth-storage");
const { ensureAuthenticatedSession } = require("../../helpers/authenticated-session");

test.describe.configure({ mode: "serial" });
test.setTimeout(300_000);

test.describe("Item Master @dashboard", () => {
  /** @type {import('@playwright/test').BrowserContext | undefined} */
  let sharedContext;
  /** @type {import('@playwright/test').Page | undefined} */
  let sharedPage;
  let payload;
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

  test("TC02 — Verify AP admin can click on Affordplan Master @item-master", async () => {
    const list = new ItemMasterPage(sharedPage);
    await list.goto("/dashboard");
    await list.clickAffordplanMasterNav();
  });

  test("TC03 — Verify AP admin can click on Item @item-master", async () => {
    const list = new ItemMasterPage(sharedPage);
    await list.clickItemMasterSidebar();
    await list.expectItemMasterListVisible();
  });

  test("TC04 — Verify Add new Button is Clickable @item-master", async () => {
    const list = new ItemMasterPage(sharedPage);
    await list.openItemMasterList();
    await list.expectAddNewButtonClickable();
  });

  test("TC05 — Verify AP admin is able to add new affordplan item @item-master", async () => {
    const list = new ItemMasterPage(sharedPage);
    const add = new ItemMasterAddPage(sharedPage);
    payload = itemData.buildItemMasterPayload();
    createdItemName = payload.itemName;

    await list.openItemMasterList();
    await list.clickAddNew();
    await add.createItem(payload);
  });

  test("TC06 — Verify AP admin is able to search created item under item master @item-master", async () => {
    const list = new ItemMasterPage(sharedPage);
    if (!createdItemName) {
      throw new Error("TC05 did not set createdItemName — run the suite serially including TC05.");
    }
    await list.openItemMasterList();
    await list.expectItemListedByItemName(createdItemName);
  });
});
