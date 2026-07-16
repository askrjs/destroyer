import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: "http://127.0.0.1:4179", trace: "retain-on-failure" },
  webServer: {
    command: "PORT=4179 DESTROYER_DB_PATH=:memory: node dist/server/server.js",
    url: "http://127.0.0.1:4179/livez",
    reuseExistingServer: false,
  },
});
