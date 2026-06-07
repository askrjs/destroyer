import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const askrWorkspaceRoot = resolve(repoRoot, "..");
export const packDirectory = resolve(repoRoot, ".destroyer-packs");

export const askrPackages = [
  {
    name: "@askrjs/askr",
    directory: resolve(askrWorkspaceRoot, "askr"),
    tarballPrefix: "askrjs-askr"
  },
  {
    name: "@askrjs/ui",
    directory: resolve(askrWorkspaceRoot, "askr-ui"),
    tarballPrefix: "askrjs-ui"
  },
  {
    name: "@askrjs/themes",
    directory: resolve(askrWorkspaceRoot, "askr-themes"),
    tarballPrefix: "askrjs-themes"
  },
  {
    name: "@askrjs/lucide",
    directory: resolve(askrWorkspaceRoot, "askr-lucide"),
    tarballPrefix: "askrjs-lucide"
  },
  {
    name: "@askrjs/vite",
    directory: resolve(askrWorkspaceRoot, "askr-vite"),
    tarballPrefix: "askrjs-vite"
  }
];

