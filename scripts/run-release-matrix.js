import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { repoRoot } from "./workspace-paths.js";

const run = promisify(execFile);

async function npm(args) {
  console.log(`\n$ npm ${args.join(" ")}`);
  const { stdout, stderr } = await run("npm", args, {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024 * 20,
  });

  if (stdout.trim()) {
    process.stdout.write(stdout);
  }

  if (stderr.trim()) {
    process.stderr.write(stderr);
  }
}

await npm(["run", "pack:local-askr"]);
await npm(["run", "install:local-askr"]);
await npm(["run", "typecheck"]);
await npm(["run", "build"]);
