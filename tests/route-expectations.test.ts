import { describe, expect, it } from "vitest";
import { pageRegistry } from "../src/pages/_routes";
import { routeExpectations } from "../src/pages/route-expectations";

describe("visual route catalog", () => {
  it("matches every registered route independently", () => {
    const manifest = pageRegistry.manifest.records.map((record) => record.path).sort();
    const catalog = routeExpectations.map((record) => record.path).sort();
    expect(catalog).toEqual(manifest);
  });
});
