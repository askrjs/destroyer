import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  clickThroughPaint,
  componentHostStats,
  linearSlope,
  takeHeapSnapshot,
  usedHeapBytes,
} from "./performance-helpers";

test.use({ trace: "off" });

test("should keep five workspace journeys responsive without forced collection", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  const actionDurationsMs: number[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
  await page.addInitScript(() => {
    const target = globalThis as typeof globalThis & { __destroyerLongTasks?: number[] };
    target.__destroyerLongTasks = [];
    if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) target.__destroyerLongTasks?.push(entry.duration);
      }).observe({ entryTypes: ["longtask"] });
    }
  });

  await page.goto("/signup");
  await page.getByLabel("Email").fill("workspace.responsiveness@example.test");
  await page.getByLabel("Password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/logs$/);

  for (let cycle = 0; cycle < 5; cycle += 1) {
    actionDurationsMs.push(await clickThroughPaint(page.locator('a[href="/metrics"]')));
    await expect(page.getByRole("heading", { name: "Metrics" })).toBeVisible();
    actionDurationsMs.push(await clickThroughPaint(page.locator('a[href="/logs"]').first()));
    await expect(page.getByRole("heading", { name: "Logs" })).toBeVisible();
  }

  const longTasks = await page.evaluate(
    () =>
      (globalThis as typeof globalThis & { __destroyerLongTasks?: number[] })
        .__destroyerLongTasks ?? [],
  );
  const profile = { actionDurationsMs, errors, longTasks };
  await testInfo.attach("operations-workspace-responsiveness", {
    body: JSON.stringify(profile, null, 2),
    contentType: "application/json",
  });
  expect(errors).toEqual([]);
  expect(Math.max(...actionDurationsMs)).toBeLessThan(100);
  expect(Math.max(0, ...longTasks)).toBeLessThan(100);
});

test.describe("workspace route heap retention", () => {
  test("should return workspace route generations to a stable heap plateau", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const measuredCycles = Number(process.env.DESTROYER_JOURNEY_CYCLES ?? 10);
    const warmupCycles = 2;
    const errors: string[] = [];
    let stage = "startup";
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`${stage}: ${message.text()}`);
    });
    page.on("pageerror", (error) => errors.push(`${stage}: ${error.stack ?? error.message}`));
    await page.addInitScript(() => {
      const target = globalThis as typeof globalThis & {
        __destroyerLongTasks?: number[];
      };
      target.__destroyerLongTasks = [];
      if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            target.__destroyerLongTasks?.push(entry.duration);
          }
        }).observe({ entryTypes: ["longtask"] });
      }
    });

    await page.goto("/signup");
    await page.getByLabel("Email").fill("workspace.performance@example.test");
    await page.getByLabel("Password").fill("correct horse battery staple");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/logs$/);
    await expect(page.getByRole("heading", { name: "Logs" })).toBeVisible();

    await page.getByLabel("Filter log events").fill("router");
    await expect(page).toHaveURL(/\/logs\?search=router$/);
    await page.getByLabel("Filter log events").fill("");
    if (await page.getByRole("button", { name: "Resume live stream" }).isVisible()) {
      await page.getByRole("button", { name: "Resume live stream" }).click();
    }
    await page.getByRole("button", { name: "Pause live stream" }).click();
    await expect(page.getByText("Paused", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Resume live stream" }).click();

    // Warm the chart, settings, docs, and virtualized logs routes before taking
    // the heap baseline so module and style caches are not mistaken for leaks.
    await page.locator('a[href="/metrics"]').click();
    await expect(page.getByRole("heading", { name: "Metrics" })).toBeVisible();
    await page.locator('a[href="/settings"]').first().click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeVisible();
    await page.locator('a[href="/settings/security"]').click();
    await expect(page.getByRole("slider", { name: "Session timeout in minutes" })).toBeVisible();
    await page.locator('a[href="/docs"]').first().click();
    await expect(page.getByText("Full-width documentation shell")).toBeVisible();
    await page.locator('a[href="/logs"]').first().click();
    await expect(page.getByRole("heading", { name: "Logs" })).toBeVisible();

    const session = await page.context().newCDPSession(page);
    await session.send("Performance.enable");
    const snapshotDirectory = process.env.DESTROYER_HEAP_SNAPSHOT_DIR;
    if (snapshotDirectory) await mkdir(snapshotDirectory, { recursive: true });
    let initialHeapBytes = 0;
    const actionDurationsMs: number[] = [];
    const heapBytesByCycle: number[] = [];
    const heapCheckpoints: Array<{
      stage: string;
      bytes: number;
      uniqueInstances: number;
      hostReferences: number;
      elementHostReferences: number;
      commentHostReferences: number;
    }> = [];
    const recordHeapCheckpoint = async (checkpointStage: string) => {
      heapCheckpoints.push({
        stage: checkpointStage,
        bytes: await usedHeapBytes(session),
        ...(await componentHostStats(page)),
      });
    };

    for (let cycle = 0; cycle < warmupCycles + measuredCycles; cycle++) {
      const measuredCycle = cycle - warmupCycles;
      if (measuredCycle === 0) {
        initialHeapBytes = await usedHeapBytes(session);
        if (snapshotDirectory)
          await takeHeapSnapshot(session, join(snapshotDirectory, "before.heapsnapshot"));
      }
      stage = `cycle ${cycle + 1} logs to metrics`;
      actionDurationsMs.push(await clickThroughPaint(page.locator('a[href="/metrics"]')));
      await expect(page.getByRole("heading", { name: "Metrics" })).toBeVisible();
      if (measuredCycle >= 0) await recordHeapCheckpoint(`${measuredCycle + 1}:metrics`);

      stage = `cycle ${cycle + 1} metrics to settings`;
      stage = `cycle ${cycle + 1} settings to workspace`;
      actionDurationsMs.push(await clickThroughPaint(page.locator('a[href="/settings"]').first()));
      await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
      await expect(page.getByLabel("Display name")).toBeVisible();

      actionDurationsMs.push(
        await clickThroughPaint(page.locator('a[href="/settings/workspace"]')),
      );
      await expect(page.getByRole("heading", { name: "Workspace", exact: true })).toBeVisible();
      stage = `cycle ${cycle + 1} workspace dialog`;
      await page.getByRole("button", { name: "Reset links" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      if (measuredCycle >= 0) await recordHeapCheckpoint(`${measuredCycle + 1}:workspace`);

      stage = `cycle ${cycle + 1} workspace to docs`;
      actionDurationsMs.push(await clickThroughPaint(page.locator('a[href="/docs"]').first()));
      await expect(page.getByText("Full-width documentation shell")).toBeVisible();
      stage = `cycle ${cycle + 1} docs section`;
      await page.locator('a[href="/docs/components"]').first().click();
      await expect(page).toHaveURL(/\/docs\/components$/);
      if (measuredCycle >= 0) await recordHeapCheckpoint(`${measuredCycle + 1}:docs`);

      stage = `cycle ${cycle + 1} docs to logs`;
      actionDurationsMs.push(await clickThroughPaint(page.locator('a[href="/logs"]').first()));
      await expect(page.getByRole("heading", { name: "Logs" })).toBeVisible();
      await expect(page.getByLabel("Recent log stream")).toBeVisible();
      await expect(page.getByLabel("Log event details")).toBeVisible();
      if (measuredCycle >= 0) {
        const bytes = await usedHeapBytes(session);
        heapBytesByCycle.push(bytes);
        heapCheckpoints.push({
          stage: `${measuredCycle + 1}:logs`,
          bytes,
          ...(await componentHostStats(page)),
        });
      }
    }

    const finalHeapBytes = heapBytesByCycle.at(-1) ?? initialHeapBytes;
    if (snapshotDirectory)
      await takeHeapSnapshot(session, join(snapshotDirectory, "after.heapsnapshot"));
    await session.detach();
    const longTasks = await page.evaluate(
      () =>
        (globalThis as typeof globalThis & { __destroyerLongTasks?: number[] })
          .__destroyerLongTasks ?? [],
    );
    const profile = {
      warmupCycles,
      measuredCycles,
      initialHeapBytes,
      finalHeapBytes,
      heapGrowthBytes: finalHeapBytes - initialHeapBytes,
      heapBytesByCycle,
      measuredSlopeBytesPerCycle: linearSlope(heapBytesByCycle.slice(2, 10)),
      heapCheckpoints,
      maxActionMs: Math.max(...actionDurationsMs),
      actionDurationsMs,
      longTaskCount: longTasks.length,
      maxLongTaskMs: Math.max(0, ...longTasks),
      longTasksMs: longTasks.reduce((total, duration) => total + duration, 0),
      errors,
    };
    await testInfo.attach("operations-workspace-profile", {
      body: JSON.stringify(profile, null, 2),
      contentType: "application/json",
    });

    expect(errors).toEqual([]);
    expect(profile.maxActionMs).toBeLessThan(100);
    expect(profile.maxLongTaskMs).toBeLessThan(100);
    expect(profile.heapGrowthBytes).toBeLessThanOrEqual(
      Math.max(1_000_000, initialHeapBytes * 0.15),
    );
    expect(profile.measuredSlopeBytesPerCycle).toBeLessThanOrEqual(100_000);
    for (const route of ["metrics", "workspace", "docs", "logs"]) {
      const plateaus = heapCheckpoints.filter((sample) => sample.stage.endsWith(`:${route}`));
      expect(plateaus.at(-1)?.uniqueInstances).toBe(plateaus[0]?.uniqueInstances);
      expect(plateaus.at(-1)?.hostReferences).toBe(plateaus[0]?.hostReferences);
      expect(plateaus.at(-1)?.elementHostReferences).toBe(plateaus[0]?.elementHostReferences);
      expect(plateaus.at(-1)?.commentHostReferences).toBe(plateaus[0]?.commentHostReferences);
    }
  });
});
