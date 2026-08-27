import { defineConfig } from "@playwright/test";
import findings from "./playwright.findings.config";

export default defineConfig({
  ...findings,
  testMatch: "dev-server-wobbles.spec.ts",
  use: { ...findings.use, baseURL: "http://127.0.0.1:4182" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4182 --open false",
    url: "http://127.0.0.1:4182/livez",
    reuseExistingServer: false,
    env: {
      HOST: "127.0.0.1",
      PORT: "4182",
      DESTROYER_DB_PATH: ":memory:",
      NODE_ENV: "test",
    },
  },
});
