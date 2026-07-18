import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  // Journeys intentionally share one production server, database, and rate-limit store.
  workers: 1,
  use: { baseURL: "http://127.0.0.1:4179", trace: "retain-on-failure" },
  webServer: {
    command: "node dist/server/server.js",
    url: "http://127.0.0.1:4179/livez",
    reuseExistingServer: false,
    env: {
      HOST: "127.0.0.1",
      PORT: "4179",
      DESTROYER_DB_PATH: ":memory:",
      NODE_ENV: "test",
    },
  },
});
