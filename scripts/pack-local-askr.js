import { mkdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { askrPackages, packDirectory } from "./workspace-paths.js";

const run = promisify(execFile);

async function npm(args, options) {
  const { stdout, stderr } = await run("npm", args, {
    maxBuffer: 1024 * 1024 * 10,
    ...options
  });

  if (stdout.trim()) {
    process.stdout.write(stdout);
  }

  if (stderr.trim()) {
    process.stderr.write(stderr);
  }
}

await rm(packDirectory, { recursive: true, force: true });
await mkdir(packDirectory, { recursive: true });

for (const pkg of askrPackages) {
  console.log(`\nPacking ${pkg.name}`);
  await npm(["run", "build", "--if-present"], { cwd: pkg.directory });
  await npm(["pack", "--pack-destination", packDirectory], {
    cwd: pkg.directory
  });
}

console.log(`\nPacked AskR tarballs into ${packDirectory}`);

