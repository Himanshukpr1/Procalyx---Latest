const baseTest = require("@playwright/test").test;
const { HomePage } = require("../pages/AP SuperAdmin/HomePage");
const { LoginPage } = require("../pages/AP SuperAdmin/LoginPage");

/**
 * Custom fixtures: inject page objects into tests.
 * @see https://playwright.dev/docs/test-fixtures
 */
const test = baseTest.extend({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

const expect = require("@playwright/test").expect;

module.exports = { test, expect };
