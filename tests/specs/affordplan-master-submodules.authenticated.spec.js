/**
 * **Affordplan Master** → Therapy, Form, Form/Unit Type, Group, Category, Sub Category, ROA,
 * Dosage Type, Hospital Type, UOM (list + add share **Therapy**-style fields).
 *
 * Tags: `@login` (TC01), `@affordplan-master-sub` (TC02–TC42).
 * `npx playwright test tests/specs/affordplan-master-submodules.authenticated.spec.js --grep '@login|@affordplan-master-sub' --project=chromium-authenticated --workers=1`
 * AP operator: `npm run test:affordplan-master-sub:ap-operator:flow`.
 */
const { test } = require("@playwright/test");
const env = require("../../data/env");
const { affordplanMasterSubmodules, buildUniqueDisplayName } = require("../../data/affordplan-master-submodules");
const { AffordplanMasterSubmoduleListPage } = require("../pages/AffordplanMasterSubmoduleListPage");
const { AffordplanMasterSubmoduleAddPage } = require("../pages/AffordplanMasterSubmoduleAddPage");
const { getStorageStateForAuthenticatedSuite } = require("../helpers/auth-storage");
const { ensureAuthenticatedSession } = require("../helpers/authenticated-session");

const SUB = affordplanMasterSubmodules();

/** @param {string} id */
function cfg(id) {
  const c = SUB.find((m) => m.id === id);
  if (!c) {
    throw new Error(`Unknown submodule: ${id}`);
  }
  return c;
}

test.describe.configure({ mode: "serial" });
test.setTimeout(300_000);

test.describe("Affordplan Master sub-modules @dashboard", () => {
  /** @type {import('@playwright/test').BrowserContext | undefined} */
  let sharedContext;
  /** @type {import('@playwright/test').Page | undefined} */
  let sharedPage;
  /** @type {Record<string, string>} */
  const createdDisplayName = {};

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

  test("TC02 — Verify AP admin can click on Affordplan Master @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.goto("/dashboard");
    await list.clickAffordplanMasterNav();
  });

  test("TC03 — Verify AP admin can click on Therapy @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.clickSubmoduleSidebarLink(cfg("therapy").sidebarLabel);
    await list.expectListVisible(cfg("therapy"));
  });

  test("TC04 — Verify Add new Button is Clickable (Therapy) @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.openList(cfg("therapy"));
    await list.expectAddNewButtonClickable();
  });

  test("TC05 — Verify AP admin is able create New Therapy @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    const add = new AffordplanMasterSubmoduleAddPage(sharedPage);
    createdDisplayName.therapy = buildUniqueDisplayName("therapy");
    await list.openList(cfg("therapy"));
    await list.clickAddNew(cfg("therapy"));
    await add.createNewRecordWithDefaultActive(cfg("therapy"), createdDisplayName.therapy);
  });

  test("TC06 — Verify AP admin is able to search created therapy under Therapy @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.expectListedByNameSearch(cfg("therapy"), createdDisplayName.therapy);
  });

  test("TC07 — Verify AP admin can click on Form @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.clickSubmoduleSidebarLink(cfg("form").sidebarLabel);
    await list.expectListVisible(cfg("form"));
  });

  test("TC08 — Verify Add new Button is Clickable (Form) @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.openList(cfg("form"));
    await list.expectAddNewButtonClickable();
  });

  test("TC09 — Verify AP admin is able create New Form @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    const add = new AffordplanMasterSubmoduleAddPage(sharedPage);
    createdDisplayName.form = buildUniqueDisplayName("form");
    await list.openList(cfg("form"));
    await list.clickAddNew(cfg("form"));
    await add.createNewRecordWithDefaultActive(cfg("form"), createdDisplayName.form);
  });

  test("TC10 — Verify AP admin is able to search created Form under Form @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.expectListedByNameSearch(cfg("form"), createdDisplayName.form);
  });

  test("TC11 — Verify AP admin can click on Form/Unit Type @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.clickSubmoduleSidebarLink(cfg("formUnitType").sidebarLabel);
    await list.expectListVisible(cfg("formUnitType"));
  });

  test("TC12 — Verify Add new Button is Clickable (Form/Unit Type) @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.openList(cfg("formUnitType"));
    await list.expectAddNewButtonClickable();
  });

  test("TC13 — Verify AP admin is able create New Form/Unit Type @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    const add = new AffordplanMasterSubmoduleAddPage(sharedPage);
    createdDisplayName.formUnitType = buildUniqueDisplayName("formUnitType");
    await list.openList(cfg("formUnitType"));
    await list.clickAddNew(cfg("formUnitType"));
    await add.createNewRecordWithDefaultActive(cfg("formUnitType"), createdDisplayName.formUnitType);
  });

  test("TC14 — Verify AP admin is able to search created Form/Unit Type under Form/Unit Type @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.expectListedByNameSearch(cfg("formUnitType"), createdDisplayName.formUnitType);
  });

  test("TC15 — Verify AP admin can click on Group @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.clickSubmoduleSidebarLink(cfg("group").sidebarLabel);
    await list.expectListVisible(cfg("group"));
  });

  test("TC16 — Verify Add new Button is Clickable (Group) @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.openList(cfg("group"));
    await list.expectAddNewButtonClickable();
  });

  test("TC17 — Verify AP admin is able create New Group @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    const add = new AffordplanMasterSubmoduleAddPage(sharedPage);
    createdDisplayName.group = buildUniqueDisplayName("group");
    await list.openList(cfg("group"));
    await list.clickAddNew(cfg("group"));
    await add.createNewRecordWithDefaultActive(cfg("group"), createdDisplayName.group);
  });

  test("TC18 — Verify AP admin is able to search created Group under Group @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.expectListedByNameSearch(cfg("group"), createdDisplayName.group);
  });

  test("TC19 — Verify AP admin can click on Category @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.clickSubmoduleSidebarLink(cfg("category").sidebarLabel);
    await list.expectListVisible(cfg("category"));
  });

  test("TC20 — Verify Add new Button is Clickable (Category) @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.openList(cfg("category"));
    await list.expectAddNewButtonClickable();
  });

  test("TC21 — Verify AP admin is able create New Category @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    const add = new AffordplanMasterSubmoduleAddPage(sharedPage);
    createdDisplayName.category = buildUniqueDisplayName("category");
    await list.openList(cfg("category"));
    await list.clickAddNew(cfg("category"));
    await add.createNewRecordWithDefaultActive(cfg("category"), createdDisplayName.category);
  });

  test("TC22 — Verify AP admin is able to search created Category under Category @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.expectListedByNameSearch(cfg("category"), createdDisplayName.category);
  });

  test("TC23 — Verify AP admin can click on Sub Category @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.clickSubmoduleSidebarLink(cfg("subCategory").sidebarLabel);
    await list.expectListVisible(cfg("subCategory"));
  });

  test("TC24 — Verify Add new Button is Clickable (Sub Category) @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.openList(cfg("subCategory"));
    await list.expectAddNewButtonClickable();
  });

  test("TC25 — Verify AP admin is able create New Sub Category @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    const add = new AffordplanMasterSubmoduleAddPage(sharedPage);
    createdDisplayName.subCategory = buildUniqueDisplayName("subCategory");
    await list.openList(cfg("subCategory"));
    await list.clickAddNew(cfg("subCategory"));
    await add.createNewRecordWithDefaultActive(cfg("subCategory"), createdDisplayName.subCategory);
  });

  test("TC26 — Verify AP admin is able to search created Sub Category under Sub Category @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.expectListedByNameSearch(cfg("subCategory"), createdDisplayName.subCategory);
  });

  test("TC27 — Verify AP admin can click on ROA @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.clickSubmoduleSidebarLink(cfg("roa").sidebarLabel);
    await list.expectListVisible(cfg("roa"));
  });

  test("TC28 — Verify Add new Button is Clickable (ROA) @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.openList(cfg("roa"));
    await list.expectAddNewButtonClickable();
  });

  test("TC29 — Verify AP admin is able create New ROA @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    const add = new AffordplanMasterSubmoduleAddPage(sharedPage);
    createdDisplayName.roa = buildUniqueDisplayName("roa");
    await list.openList(cfg("roa"));
    await list.clickAddNew(cfg("roa"));
    await add.createNewRecordWithDefaultActive(cfg("roa"), createdDisplayName.roa);
  });

  test("TC30 — Verify AP admin is able to search created ROA under ROA @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.expectListedByNameSearch(cfg("roa"), createdDisplayName.roa);
  });

  test("TC31 — Verify AP admin can click on Dosage Type @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.clickSubmoduleSidebarLink(cfg("dosageType").sidebarLabel);
    await list.expectListVisible(cfg("dosageType"));
  });

  test("TC32 — Verify Add new Button is Clickable (Dosage Type) @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.openList(cfg("dosageType"));
    await list.expectAddNewButtonClickable();
  });

  test("TC33 — Verify AP admin is able create New Dosage Type @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    const add = new AffordplanMasterSubmoduleAddPage(sharedPage);
    createdDisplayName.dosageType = buildUniqueDisplayName("dosageType");
    await list.openList(cfg("dosageType"));
    await list.clickAddNew(cfg("dosageType"));
    await add.createNewRecordWithDefaultActive(cfg("dosageType"), createdDisplayName.dosageType);
  });

  test("TC34 — Verify AP admin is able to search created Dosage Type under Dosage Type @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.expectListedByNameSearch(cfg("dosageType"), createdDisplayName.dosageType);
  });

  test("TC35 — Verify AP admin can click on Hospital Type @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.clickSubmoduleSidebarLink(cfg("hospitalType").sidebarLabel);
    await list.expectListVisible(cfg("hospitalType"));
  });

  test("TC36 — Verify Add new Button is Clickable (Hospital Type) @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.openList(cfg("hospitalType"));
    await list.expectAddNewButtonClickable();
  });

  test("TC37 — Verify AP admin is able create New Hospital Type @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    const add = new AffordplanMasterSubmoduleAddPage(sharedPage);
    createdDisplayName.hospitalType = buildUniqueDisplayName("hospitalType");
    await list.openList(cfg("hospitalType"));
    await list.clickAddNew(cfg("hospitalType"));
    await add.createNewRecordWithDefaultActive(cfg("hospitalType"), createdDisplayName.hospitalType);
  });

  test("TC38 — Verify AP admin is able to search created Hospital Type under Hospital Type @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.expectListedByNameSearch(cfg("hospitalType"), createdDisplayName.hospitalType);
  });

  test("TC39 — Verify AP admin can click on UOM @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.clickSubmoduleSidebarLink(cfg("uom").sidebarLabel);
    await list.expectListVisible(cfg("uom"));
  });

  test("TC40 — Verify Add new Button is Clickable (UOM) @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.openList(cfg("uom"));
    await list.expectAddNewButtonClickable();
  });

  test("TC41 — Verify AP admin is able create New UOM @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    const add = new AffordplanMasterSubmoduleAddPage(sharedPage);
    createdDisplayName.uom = buildUniqueDisplayName("uom");
    await list.openList(cfg("uom"));
    await list.clickAddNew(cfg("uom"));
    await add.createNewRecordWithDefaultActive(cfg("uom"), createdDisplayName.uom);
  });

  test("TC42 — Verify AP admin is able to search created UOM under UOM @affordplan-master-sub", async () => {
    const list = new AffordplanMasterSubmoduleListPage(sharedPage);
    await list.expectListedByNameSearch(cfg("uom"), createdDisplayName.uom);
  });
});
