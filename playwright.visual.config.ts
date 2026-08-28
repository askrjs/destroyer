import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.001 } },
  reporter: [["html", { outputFolder: "artifacts/visual-report", open: "never" }]],
  use: { baseURL: "http://127.0.0.1:4179", browserName: "chromium", trace: "retain-on-failure" },
  webServer: {
    command: "node dist/server/server.js",
    url: "http://127.0.0.1:4179/livez",
    reuseExistingServer: false,
    env: {
      HOST: "127.0.0.1",
      PORT: "4179",
      DESTROYER_DB_PATH: ":memory:",
      DESTROYER_DETERMINISTIC_IDS: "1",
      NODE_ENV: "test",
    },
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: { storageState: "artifacts/visual-auth.json" },
    },
  ],
});
