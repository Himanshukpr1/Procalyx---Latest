const { test, expect } = require("@playwright/test");

/**
 * Smoke example using default test fixture.
 * Point BASE_URL at your app; example.com is a placeholder.
 */
test.describe("Example", () => {
  test("loads the configured base URL", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.+/);
  });
});
