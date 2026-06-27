import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { repoRoot } from "./workspace-paths.js";

const sourceRoot = join(repoRoot, "spa-app", "src");

const checks = [
  {
    message: "Use typed virtual renderer returns instead of the old virtualNode cast helper.",
    pattern: /\bvirtualNode\b/,
  },
  {
    message: "Use Sidebar tooltip props instead of the local rail tooltip helper.",
    pattern: /\bgetRailTooltipProps\b/,
  },
  {
    message: "Use Button asChild for styled Link controls.",
    pattern: /<Link\b[^>]*\bdata-slot=["']button["']/s,
  },
  {
    message: "Use Button asChild for styled Dialog controls.",
    pattern:
      /<(?:DialogTrigger|DialogClose|AlertDialogTrigger|AlertDialogCancel|AlertDialogAction)\b[\s\S]*?\bdata-(?:slot=["']button["']|variant=|size=|width=)/,
  },
  {
    message: "Use typed Dropdown props instead of raw dropdown data attributes.",
    pattern:
      /<(?:DropdownMenuTrigger|DropdownMenuItem|DropdownTrigger|DropdownItem)\b[^>]*\bdata-(?:variant|size)=/,
  },
  {
    message: "Use SelectTrigger size prop instead of raw data-size.",
    pattern: /<SelectTrigger\b[^>]*\bdata-size=/,
  },
  {
    message: "Use Button asChild for styled Collapsible triggers.",
    pattern: /<CollapsibleTrigger\b[^>]*\bdata-(?:slot=["']button["']|variant=|size=|width=)/,
  },
  {
    message: "Use Button width prop instead of raw data-width.",
    pattern: /\bdata-width=/,
  },
  {
    message: "Use PopoverContent width prop instead of inline width styles.",
    pattern: /<PopoverContent\b[\s\S]*?\bstyle=\{\{/,
  },
  {
    message: "Use PopoverContent width prop instead of raw data-width.",
    pattern: /<PopoverContent\b[\s\S]*?\bdata-width=/,
  },
  {
    message: "Use VirtualList viewport prop instead of raw data-viewport.",
    pattern: /<VirtualList\b[\s\S]*?\bdata-viewport=/,
  },
  {
    message: "Use VirtualTable viewport/tableWidth props instead of raw data attributes.",
    pattern: /<VirtualTable\b[\s\S]*?\bdata-(?:viewport|table-width)=/,
  },
  {
    message: "Use Skeleton width/height props instead of inline dimensions.",
    pattern: /<Skeleton\b[\s\S]*?\bstyle=\{\{/,
  },
  {
    message: "Use DataTable instead of raw data-slot wrappers.",
    pattern: /\bdata-slot=["']data-table["']/,
  },
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
      continue;
    }

    if (/\.(?:tsx?|jsx?)$/.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

const failures = [];

for (const file of await collectFiles(sourceRoot)) {
  const text = await readFile(file, "utf8");

  for (const check of checks) {
    if (check.pattern.test(text)) {
      failures.push(`${relative(repoRoot, file)}: ${check.message}`);
    }
  }
}

if (failures.length > 0) {
  throw new Error(`SPA userland smell check failed:\n${failures.join("\n")}`);
}

console.log("SPA userland smell checks passed.");
