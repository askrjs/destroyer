import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { askrPackages, packDirectory, repoRoot } from "./workspace-paths.js";

const run = promisify(execFile);
const entries = await readdir(packDirectory);
const tarballs = askrPackages.map((pkg) => {
  const match = entries.find(
    (entry) => entry.startsWith(`${pkg.tarballPrefix}-`) && entry.endsWith(".tgz"),
  );

  if (!match) {
    throw new Error(`Missing tarball for ${pkg.name}. Run npm run pack:local-askr first.`);
  }

  return resolve(packDirectory, match);
});

const { stdout, stderr } = await run(
  "npm",
  ["install", "--save-dev", "--workspaces=false", ...tarballs],
  {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024 * 10,
  },
);

if (stdout.trim()) {
  process.stdout.write(stdout);
}

if (stderr.trim()) {
  process.stderr.write(stderr);
}
