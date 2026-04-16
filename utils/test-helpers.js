/**
 * Shared helpers used across specs and page objects.
 */

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function waitForVisible(page, selector) {
  await page.locator(selector).waitFor({ state: "visible" });
}

/**
 * @param {number} ms
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { waitForVisible, delay };
