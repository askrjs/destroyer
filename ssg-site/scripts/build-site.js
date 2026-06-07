import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(appRoot, "dist");
const staticRuntime = await import("../dist/static-runtime/entry-static.js");

for (const path of staticRuntime.staticPaths) {
  const html = staticRuntime.renderStaticPath(path);
  const target =
    path === "/"
      ? resolve(outDir, "index.html")
      : resolve(outDir, path.replace(/^\//, ""), "index.html");

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html, "utf8");
  console.log(`Generated ${path}`);
}

