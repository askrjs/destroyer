import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { pageRegistry } from "../src/pages/_routes";
import { scenarioCatalog } from "./browser/scenario-catalog";

describe("original scenario governance", () => {
  test("contains exactly one definition for S01 through S32", () => {
    expect(scenarioCatalog.map(({ id }) => id)).toEqual(
      Array.from({ length: 32 }, (_, index) => `S${String(index + 1).padStart(2, "0")}`),
    );
    expect(new Set(scenarioCatalog.map(({ testTitle }) => testTitle)).size).toBe(32);
  });

  test("assigns every scenario to a registered product route", () => {
    const routes = new Set(pageRegistry.manifest.records.map(({ path }) => path));
    expect(scenarioCatalog.filter(({ route }) => !routes.has(route))).toEqual([]);
  });

  test("references every scenario ID exactly once in browser test titles", () => {
    const source = globSync("tests/browser/*.spec.ts")
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    for (const { id } of scenarioCatalog) {
      expect(source.match(new RegExp(`["']${id}(?: |["'])`, "g")) ?? [], id).toHaveLength(1);
    }
  });
});
