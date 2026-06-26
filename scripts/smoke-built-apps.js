import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { repoRoot } from "./workspace-paths.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readText(path) {
  return readFile(path, "utf8");
}

function assertIncludes(text, expected, label) {
  assert(text.includes(expected), `${label} is missing ${JSON.stringify(expected)}.`);
}

async function assertExists(path, label) {
  try {
    await access(path);
  } catch {
    throw new Error(`${label} does not exist: ${path}`);
  }
}

function publicAssetPath(file) {
  return `/${file.replace(/^\/+/, "")}`;
}

async function readClientAssets(distDirectory) {
  const manifestPath = resolve(distDirectory, ".vite", "manifest.json");
  const manifest = JSON.parse(await readText(manifestPath));
  const entry = manifest["index.html"] ?? Object.values(manifest).find((item) => item.isEntry);

  assert(entry, `Missing client entry in ${manifestPath}.`);
  assert(entry.file, `Client entry in ${manifestPath} is missing a JS file.`);

  return [
    ...(entry.css ?? []).map((file) => ({
      href: publicAssetPath(file),
      kind: "style",
    })),
    { href: publicAssetPath(entry.file), kind: "script" },
  ];
}

async function assertProductionAssets(html, distDirectory, label) {
  assert(!html.includes("/src/client.tsx"), `${label} still references the dev client entry.`);

  const assetRefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => href.startsWith("/assets/"));

  assert(
    assetRefs.some((href) => href.endsWith(".js")),
    `${label} has no JS asset.`,
  );
  assert(
    assetRefs.some((href) => href.endsWith(".css")),
    `${label} has no CSS asset.`,
  );

  for (const href of assetRefs) {
    await assertExists(resolve(distDirectory, href.replace(/^\//, "")), `${label} asset`);
  }
}

async function assertSpaBuild() {
  const distDirectory = resolve(repoRoot, "spa-app", "dist");
  const html = await readText(resolve(distDirectory, "index.html"));

  assertIncludes(html, '<div id="app"></div>', "SPA index.html");
  await assertProductionAssets(html, distDirectory, "SPA index.html");

  const assets = await readClientAssets(distDirectory);
  const scriptAsset = assets.find((asset) => asset.kind === "script");
  assert(scriptAsset, "SPA manifest is missing a script asset.");

  const script = await readText(resolve(distDirectory, scriptAsset.href.replace(/^\//, "")));
  assertIncludes(script, "Interactive release dashboard", "SPA client bundle");
  assertIncludes(script, "AskR surfaces under test", "SPA client bundle");
}

async function assertSsrBuild() {
  const distDirectory = resolve(repoRoot, "ssr-app", "dist");
  const serverEntry = resolve(distDirectory, "server", "entry-server.js");
  const { render } = await import(pathToFileURL(serverEntry).href);
  const assets = await readClientAssets(distDirectory);

  const overview = render("/", { assets });
  assertIncludes(overview, "Operations console rendered on the server", "SSR /");
  assertIncludes(overview, "Hydration action", "SSR /");
  await assertProductionAssets(overview, distDirectory, "SSR /");

  const incidents = render("/incidents", { assets });
  assertIncludes(incidents, "Scenario incidents", "SSR /incidents");
  await assertProductionAssets(incidents, distDirectory, "SSR /incidents");

  const missing = render("/not-real", { assets });
  assertIncludes(missing, "SSR route missing", "SSR fallback");
  await assertProductionAssets(missing, distDirectory, "SSR fallback");
}

async function assertSsgBuild() {
  const distDirectory = resolve(repoRoot, "ssg-site", "dist");
  const pages = [
    {
      label: "SSG /",
      path: resolve(distDirectory, "index.html"),
      text: "Static site built from AskR route components",
    },
    {
      label: "SSG /guide",
      path: resolve(distDirectory, "guide", "index.html"),
      text: "What this static site should break",
    },
    {
      label: "SSG /reference",
      path: resolve(distDirectory, "reference", "index.html"),
      text: "Static rendering matrix",
    },
  ];

  for (const page of pages) {
    const html = await readText(page.path);
    assertIncludes(html, page.text, page.label);
    await assertProductionAssets(html, distDirectory, page.label);
  }
}

await assertSpaBuild();
await assertSsrBuild();
await assertSsgBuild();

console.log("Built app smoke checks passed.");
