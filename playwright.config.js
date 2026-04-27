// @ts-check
const fs = require("fs");
const { defineConfig, devices } = require("@playwright/test");
const { resolveAuthStoragePath } = require("./data/auth-profiles");

const authStoragePath = resolveAuthStoragePath();
const authenticatedStorage = fs.existsSync(authStoragePath) ? { storageState: authStoragePath } : {};

/** @see https://playwright.dev/docs/test-configuration */
module.exports = defineConfig({
  testDir: "./tests/specs",
  globalSetup: require.resolve("./tests/global-setup.js"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "on-failure" }],
    ["list"],
  ],
  use: {
    baseURL: process.env.BASE_URL || "https://qa.procalyx.net",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      testIgnore: ["**/*.authenticated.spec.js"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-authenticated",
      testMatch: ["**/*.authenticated.spec.js"],
      use: {
        ...devices["Desktop Chrome"],
        ...authenticatedStorage,
      },
    },
  ],
});
