const { test, expect } = require("../fixtures/base");

test.describe("Home (custom fixture)", () => {
  test("opens home via page object", async ({ homePage, page }) => {
    await homePage.open();
    await expect(page).toHaveURL(/.+/);
  });
});
