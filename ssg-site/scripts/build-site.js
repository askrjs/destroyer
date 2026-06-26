import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(appRoot, "dist");
const staticRuntime = await import("../dist/static-runtime/entry-static.js");
const clientAssets = await readClientAssets();

async function readClientAssets() {
  const manifestPath = resolve(outDir, ".vite", "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const entry = manifest["index.html"] ?? Object.values(manifest).find((item) => item.isEntry);

  if (!entry) {
    throw new Error(`Missing client entry in ${manifestPath}.`);
  }

  return [
    ...(entry.css ?? []).map((file) => ({ href: `/${file}`, kind: "style" })),
    { href: `/${entry.file}`, kind: "script" }
  ];
}

for (const path of staticRuntime.staticPaths) {
  const html = staticRuntime.renderStaticPath(path, { assets: clientAssets });
  const target =
    path === "/"
      ? resolve(outDir, "index.html")
      : resolve(outDir, path.replace(/^\//, ""), "index.html");

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html, "utf8");
  console.log(`Generated ${path}`);
}
