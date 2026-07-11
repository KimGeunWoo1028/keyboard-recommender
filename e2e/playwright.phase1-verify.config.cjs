// Phase 1 verify: isolated stack on localhost:3020 + API :8020 (manual start).
const base = require("./playwright.config.cjs");

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  ...base,
  use: {
    ...base.use,
    baseURL: "http://localhost:3020",
  },
  webServer: undefined,
};
