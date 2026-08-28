import { spawnSync } from "node:child_process";

if (process.env.CI) throw new Error("Visual baselines may never be updated in CI.");
if (process.env.DESTROYER_CANONICAL_VISUAL !== "1") {
  throw new Error("Visual baselines may only be updated inside the canonical visual image.");
}
const result = spawnSync(
  process.execPath,
  [
    "node_modules/@playwright/test/cli.js",
    "test",
    "--config",
    "playwright.visual.config.ts",
    "--update-snapshots",
  ],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
