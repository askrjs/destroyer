import { spawnSync } from "node:child_process";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const lanes = [
  {
    name: "catalog",
    args: [
      "playwright",
      "test",
      "--config",
      "playwright.findings.config.ts",
      "--grep",
      "@finding",
      "--grep-invert",
      "ASKR-DESTROYER-009",
    ],
  },
  {
    name: "server-disconnect",
    args: [
      "playwright",
      "test",
      "--config",
      "playwright.findings.config.ts",
      "--grep",
      "ASKR-DESTROYER-009",
    ],
  },
];

let failed = false;
for (const lane of lanes) {
  const result = spawnSync(npx, lane.args, {
    cwd: process.cwd(),
    env: { ...process.env, DESTROYER_FINDINGS_LANE: lane.name },
    stdio: "inherit",
  });
  if (result.status !== 0) failed = true;
}

process.exitCode = failed ? 1 : 0;
