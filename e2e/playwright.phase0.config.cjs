// Phase 0 baseline: reuse local dev server (localhost:3000 + localhost:8010 API).
const base = require("./playwright.config.cjs");

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  ...base,
  use: {
    ...base.use,
    baseURL: "http://localhost:3000",
  },
  webServer: undefined,
};
