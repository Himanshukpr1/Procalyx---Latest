const { test, expect } = require("../../fixtures/base");

/** Optional: support & legal triggers (same locators as Login page) */
test.describe("Login page — footer & support", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open("/login");
  });

  test("Contact Support opens mailto, modal, or new page", async ({ page, loginPage, context }) => {
    const popupPromise = context.waitForEvent("page", { timeout: 8000 }).catch(() => null);
    await loginPage.contactSupportTrigger.click();
    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState("domcontentloaded");
      expect(popup.url().length).toBeGreaterThan(0);
      await popup.close();
    } else {
      await page.waitForLoadState("networkidle");
      expect(page.url()).not.toMatch(/\/login$/);
    }
  });

  test("Terms of Use opens policy or new tab", async ({ page, loginPage, context }) => {
    const popupPromise = context.waitForEvent("page", { timeout: 8000 }).catch(() => null);
    await loginPage.termsOfUseTrigger.click();
    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState("domcontentloaded");
      expect(popup.url().length).toBeGreaterThan(0);
      await popup.close();
    } else {
      await page.waitForLoadState("networkidle");
      expect(page.url()).not.toMatch(/\/login$/);
    }
  });

  test("Privacy Policy opens policy or new tab", async ({ page, loginPage, context }) => {
    const popupPromise = context.waitForEvent("page", { timeout: 8000 }).catch(() => null);
    await loginPage.privacyPolicyTrigger.click();
    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState("domcontentloaded");
      expect(popup.url().length).toBeGreaterThan(0);
      await popup.close();
    } else {
      await page.waitForLoadState("networkidle");
      expect(page.url()).not.toMatch(/\/login$/);
    }
  });
});
