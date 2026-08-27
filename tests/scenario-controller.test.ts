import { describe, expect, it } from "vitest";
import { createScenarioController, ScenarioFailure } from "../src/server/scenario-controller";

describe("scenario controller", () => {
  it("isolates principals and consumes failure and empty controls once", async () => {
    const controller = createScenarioController();
    controller.arm("first", "operations.logs", "fail-next");
    controller.arm("second", "operations.logs", "empty-next");

    await expect(controller.before("first", "operations.logs")).rejects.toEqual(
      new ScenarioFailure("operations.logs"),
    );
    await expect(controller.before("first", "operations.logs")).resolves.toBeNull();
    await expect(controller.before("second", "operations.logs")).resolves.toBe("empty-next");
    await expect(controller.before("second", "operations.logs")).resolves.toBeNull();
  });

  it("makes a hold observable and releases it explicitly", async () => {
    const controller = createScenarioController();
    controller.arm("operator", "settings.update", "hold-next");
    const held = controller.before("operator", "settings.update");

    await expect.poll(() => controller.state("operator")).toEqual([
      { operation: "settings.update", mode: "hold-next", blocked: true },
    ]);
    expect(controller.release("operator", "settings.update")).toBe(true);
    await expect(held).resolves.toBe("hold-next");
    expect(controller.state("operator")).toEqual([]);
    expect(controller.release("operator", "settings.update")).toBe(false);
  });

  it("releases every controlled hold while resetting only the selected principal", async () => {
    const controller = createScenarioController();
    controller.arm("first", "settings.read", "hold-next");
    controller.arm("first", "operations.metrics", "hold-next");
    controller.arm("second", "operations.logs", "empty-next");
    const reads = [
      controller.before("first", "settings.read"),
      controller.before("first", "operations.metrics"),
    ];

    await expect.poll(() => controller.state("first").every(({ blocked }) => blocked)).toBe(true);
    controller.reset("first");
    await expect(Promise.all(reads)).resolves.toEqual(["hold-next", "hold-next"]);
    expect(controller.state("first")).toEqual([]);
    expect(controller.state("second")).toEqual([
      { operation: "operations.logs", mode: "empty-next", blocked: false },
    ]);
  });
});
