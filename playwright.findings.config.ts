import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

const lane = process.env.DESTROYER_FINDINGS_LANE;
const suffix = lane ? `-${lane}` : "";

export default defineConfig({
  ...base,
  repeatEach: 3,
  maxFailures: 0,
  reporter: [["html", { outputFolder: `artifacts/findings-report${suffix}`, open: "never" }], ["line"]],
  outputDir: `artifacts/findings-results${suffix}`,
  use: {
    ...base.use,
    screenshot: "on",
    trace: "on",
  },
});
