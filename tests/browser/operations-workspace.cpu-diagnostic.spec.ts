import { expect, test } from "./fixture";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  clickThroughPaint,
  componentHostStats,
  linearSlope,
  takeHeapSnapshot,
  usedHeapBytes,
} from "./performance-helpers";

test.use({ trace: "off" });

test.describe("workspace route heap retention CPU diagnostic", () => {
  test("@diagnostic should return workspace route generations to a stable heap plateau (askrjs/askr#374)", async ({
    page,
    principalEmail,
  }, testInfo) => {
    test.info().annotations.push({
      type: "regression",
      description: "Quarantined by askrjs/askr#374 with forced-GC and component-host ledgers.",
    });
    test.setTimeout(90_000);
    const measuredCycles = Number(process.env.DESTROYER_JOURNEY_CYCLES ?? 10);
    const warmupCycles = 2;
    const errors: string[] = [];
    let stage = "startup";
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`${stage}: ${message.text()}`);
    });
    page.on("pageerror", (error) => errors.push(`${stage}: ${error.stack ?? error.message}`));
    // Temporary diagnostic only. Profiling overhead is not acceptance evidence.
    const diagnosticSession = await page.context().newCDPSession(page);
    const browserVersion = page.context().browser()?.version();
    const captureErrors: string[] = [];
    const phaseMarkers: Array<{
      label: string;
      now: number;
      timeOrigin: number;
      url: string;
    }> = [];
    let cpuStarted = false;
    let tracingStarted = false;
    let captureFinalized = false;
    let traceComplete: Promise<{ stream?: string }> | undefined;
    const markPhase = async (label: string) => {
      const marker = await page.evaluate((phaseLabel) => {
        performance.mark(`destroyer-diagnostic:${phaseLabel}`);
        return {
          label: phaseLabel,
          now: performance.now(),
          timeOrigin: performance.timeOrigin,
          url: location.href,
        };
      }, label);
      phaseMarkers.push(marker);
      return marker.now;
    };
    const finalizeDiagnostic = async () => {
      if (captureFinalized) return;
      captureFinalized = true;
      if (cpuStarted) {
        try {
          const { profile: cpuProfile } = await diagnosticSession.send("Profiler.stop");
          await writeFile(
            testInfo.outputPath("operations-workspace-startup-and-journeys.cpuprofile"),
            `${JSON.stringify(cpuProfile)}\n`,
          );
        } catch (error) {
          captureErrors.push(`Profiler.stop: ${String(error)}`);
        }
      }
      if (tracingStarted) {
        try {
          await diagnosticSession.send("Tracing.end");
          const { stream } = await traceComplete!;
          if (!stream) throw new Error("Tracing completed without its raw stream.");
          let trace = "";
          try {
            while (true) {
              const part = await diagnosticSession.send("IO.read", { handle: stream });
              trace += part.base64Encoded
                ? Buffer.from(part.data, "base64").toString("utf8")
                : part.data;
              if (part.eof) break;
            }
          } finally {
            await diagnosticSession.send("IO.close", { handle: stream });
          }
          await writeFile(
            testInfo.outputPath("operations-workspace-startup-and-journeys-trace.json"),
            trace,
          );
        } catch (error) {
          captureErrors.push(`Tracing.end/read: ${String(error)}`);
        }
      }
      try {
        await diagnosticSession.detach();
      } catch (error) {
        captureErrors.push(`CDP detach: ${String(error)}`);
      }
      const capturePath = testInfo.outputPath("operations-workspace-diagnostic-capture.json");
      await writeFile(
        capturePath,
        `${JSON.stringify(
          {
            diagnosticOnly: true,
            qualification:
              "Instrumented timings do not qualify performance or attribute earlier hosted tasks.",
            phaseMarkers,
            captureErrors,
            cpuStarted,
            tracingStarted,
            sourceHead: process.env.DESTROYER_DIAGNOSTIC_HEAD,
            browserVersion,
          },
          null,
          2,
        )}\n`,
      );
      await testInfo.attach("operations-workspace-diagnostic-capture", {
        path: capturePath,
        contentType: "application/json",
      });
    };
    try {
      await diagnosticSession.send("Profiler.enable");
      await diagnosticSession.send("Profiler.start");
      cpuStarted = true;
      traceComplete = new Promise((resolve) => {
        diagnosticSession.once("Tracing.tracingComplete", resolve);
      });
      await diagnosticSession.send("Tracing.start", {
        categories:
          "devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-v8.cpu_profiler,v8.execute,blink.user_timing",
        transferMode: "ReturnAsStream",
      });
      tracingStarted = true;
      await page.addInitScript(() => {
        const target = globalThis as typeof globalThis & {
          __destroyerLongTasks?: number[];
          __destroyerLongTaskEntries?: Array<{ startTime: number; duration: number }>;
        };
        target.__destroyerLongTasks = [];
        target.__destroyerLongTaskEntries = [];
        if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              target.__destroyerLongTasks?.push(entry.duration);
              target.__destroyerLongTaskEntries?.push({
                startTime: entry.startTime,
                duration: entry.duration,
              });
            }
          }).observe({ entryTypes: ["longtask"] });
        }
      });

      await markPhase("before-signup-navigation");
      await page.goto("/signup");
      await markPhase("signup-document-ready");
      await page.getByLabel("Email").fill(principalEmail);
      await page.getByLabel("Password").fill("correct horse battery staple");
      await markPhase("signup-submit");
      await page.getByRole("button", { name: "Create account" }).click();
      await expect(page).toHaveURL(/\/logs$/);
      await expect(page.getByRole("heading", { name: "Logs" })).toBeVisible();
      await markPhase("first-logs-visible");

      await page.getByLabel("Filter log events").fill("router");
      await expect(page).toHaveURL(/\/logs\?search=router$/);
      await page.getByLabel("Filter log events").fill("");
      if (await page.getByRole("button", { name: "Resume live stream" }).isVisible()) {
        await page.getByRole("button", { name: "Resume live stream" }).click();
      }
      await page.getByRole("button", { name: "Pause live stream" }).click();
      await expect(page.getByText("Paused", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Resume live stream" }).click();

      await markPhase("initial-logs-controls-complete");
      await markPhase("route-cache-warmup-start");

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

      await markPhase("route-cache-warmup-complete");

      const session = await page.context().newCDPSession(page);
      await session.send("Performance.enable");
      const snapshotDirectory = process.env.DESTROYER_HEAP_SNAPSHOT_DIR;
      if (snapshotDirectory) await mkdir(snapshotDirectory, { recursive: true });
      let initialHeapBytes = 0;
      const actionDurationsMs: number[] = [];
      const actionIntervals: Array<{ stage: string; startTime: number; endTime: number }> = [];
      const forcedGcIntervals: Array<{ stage: string; startTime: number; endTime: number }> = [];
      // Keep interval data outside the page's measured heap. These timestamps
      // describe observations; they never exclude a task from the strict budgets.
      const measureAction = async (
        locator: Parameters<typeof clickThroughPaint>[0],
        actionStage: string,
      ) => {
        const startTime = await markPhase(`${actionStage}:start`);
        const duration = await clickThroughPaint(locator);
        const endTime = await markPhase(`${actionStage}:end`);
        actionIntervals.push({ stage: actionStage, startTime, endTime });
        return duration;
      };
      const measureHeapBytes = async (checkpointStage: string) => {
        const startTime = await page.evaluate(() => performance.now());
        const bytes = await usedHeapBytes(session);
        const endTime = await page.evaluate(() => performance.now());
        forcedGcIntervals.push({ stage: checkpointStage, startTime, endTime });
        return bytes;
      };
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
          bytes: await measureHeapBytes(checkpointStage),
          ...(await componentHostStats(page)),
        });
      };

      for (let cycle = 0; cycle < warmupCycles + measuredCycles; cycle++) {
        const measuredCycle = cycle - warmupCycles;
        if (measuredCycle === 0) {
          initialHeapBytes = await measureHeapBytes("baseline");
          if (snapshotDirectory)
            await takeHeapSnapshot(session, join(snapshotDirectory, "before.heapsnapshot"));
        }
        stage = `cycle ${cycle + 1} logs to metrics`;
        actionDurationsMs.push(await measureAction(page.locator('a[href="/metrics"]'), stage));
        await expect(page.getByRole("heading", { name: "Metrics" })).toBeVisible();
        if (measuredCycle >= 0) await recordHeapCheckpoint(`${measuredCycle + 1}:metrics`);

        stage = `cycle ${cycle + 1} metrics to settings`;
        actionDurationsMs.push(
          await measureAction(page.locator('a[href="/settings"]').first(), stage),
        );
        await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
        await expect(page.getByLabel("Display name")).toBeVisible();
        stage = `cycle ${cycle + 1} settings to workspace`;

        actionDurationsMs.push(
          await measureAction(page.locator('a[href="/settings/workspace"]'), stage),
        );
        await expect(page.getByRole("heading", { name: "Workspace", exact: true })).toBeVisible();
        stage = `cycle ${cycle + 1} workspace dialog`;
        await page.getByRole("button", { name: "Open invite actions" }).click();
        await page.getByRole("menuitem", { name: "Reset active link" }).click();
        await expect(page.getByRole("alertdialog")).toBeVisible();
        await page.getByRole("button", { name: "Cancel" }).click();
        await expect(page.getByRole("alertdialog")).toHaveCount(0);
        if (measuredCycle >= 0) await recordHeapCheckpoint(`${measuredCycle + 1}:workspace`);

        stage = `cycle ${cycle + 1} workspace to docs`;
        actionDurationsMs.push(await measureAction(page.locator('a[href="/docs"]').first(), stage));
        await expect(page.getByText("Full-width documentation shell")).toBeVisible();
        stage = `cycle ${cycle + 1} docs section`;
        await page.locator('a[href="/docs/components"]').first().click();
        await expect(page).toHaveURL(/\/docs\/components$/);
        if (measuredCycle >= 0) await recordHeapCheckpoint(`${measuredCycle + 1}:docs`);

        stage = `cycle ${cycle + 1} docs to logs`;
        actionDurationsMs.push(await measureAction(page.locator('a[href="/logs"]').first(), stage));
        await expect(page.getByRole("heading", { name: "Logs" })).toBeVisible();
        await expect(page.getByLabel("Recent log stream")).toBeVisible();
        await expect(page.getByLabel("Log event details")).toBeVisible();
        if (measuredCycle >= 0) {
          const bytes = await measureHeapBytes(`${measuredCycle + 1}:logs`);
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
      const { longTasks, longTaskEntries } = await page.evaluate(() => {
        const target = globalThis as typeof globalThis & {
          __destroyerLongTasks?: number[];
          __destroyerLongTaskEntries?: Array<{ startTime: number; duration: number }>;
        };
        return {
          longTasks: target.__destroyerLongTasks ?? [],
          longTaskEntries: target.__destroyerLongTaskEntries ?? [],
        };
      });

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
        longTaskEntries,
        actionIntervals,
        forcedGcIntervals,
        observationScope:
          "Signup, initial route warmup, all journey cycles and forced collection remain included.",
        errors,
      };
      const profilePath = testInfo.outputPath("operations-workspace-profile.json");
      await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
      await testInfo.attach("operations-workspace-profile", {
        path: profilePath,
        contentType: "application/json",
      });

      // Persist both raw captures before any original numeric budget assertion.
      await finalizeDiagnostic();
      expect(captureErrors).toEqual([]);

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
    } finally {
      await finalizeDiagnostic();
    }
  });
});
