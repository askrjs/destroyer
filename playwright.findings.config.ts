import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  repeatEach: 3,
  maxFailures: 0,
  reporter: [["html", { outputFolder: "artifacts/findings-report", open: "never" }], ["line"]],
  outputDir: "artifacts/findings-results",
  use: {
    ...base.use,
    screenshot: "on",
    trace: "on",
  },
});
