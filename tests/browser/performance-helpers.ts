import type { CDPSession, Locator, Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

type ChromeMetric = { name: string; value: number };

export async function componentHostStats(page: Page) {
  return page.evaluate(() => {
    const instances = new Set<unknown>();
    let hostReferences = 0;
    let elementHostReferences = 0;
    let commentHostReferences = 0;
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL);
    let node: Node | null = walker.currentNode;
    while (node) {
      const host = node as Node & {
        __ASKR_INSTANCE?: unknown;
        __ASKR_INSTANCES?: unknown[];
      };
      if (host.__ASKR_INSTANCE) {
        instances.add(host.__ASKR_INSTANCE);
        hostReferences += 1;
        if (node instanceof Element) elementHostReferences += 1;
        else if (node.nodeType === Node.COMMENT_NODE) commentHostReferences += 1;
      }
      for (const instance of host.__ASKR_INSTANCES ?? []) {
        instances.add(instance);
        hostReferences += 1;
        if (node instanceof Element) elementHostReferences += 1;
        else if (node.nodeType === Node.COMMENT_NODE) commentHostReferences += 1;
      }
      node = walker.nextNode();
    }
    return {
      uniqueInstances: instances.size,
      hostReferences,
      elementHostReferences,
      commentHostReferences,
    };
  });
}

export async function usedHeapBytes(session: CDPSession): Promise<number> {
  await session.send("HeapProfiler.collectGarbage");
  const result = (await session.send("Performance.getMetrics")) as { metrics: ChromeMetric[] };
  return result.metrics.find((metric) => metric.name === "JSHeapUsedSize")?.value ?? 0;
}

export function linearSlope(samples: number[]): number {
  const count = samples.length;
  const meanX = (count - 1) / 2;
  const meanY = samples.reduce((sum, value) => sum + value, 0) / count;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < count; index += 1) {
    numerator += (index - meanX) * (samples[index]! - meanY);
    denominator += (index - meanX) ** 2;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

export async function takeHeapSnapshot(session: CDPSession, path: string): Promise<void> {
  const chunks: string[] = [];
  const collect = ({ chunk }: { chunk: string }) => chunks.push(chunk);
  session.on("HeapProfiler.addHeapSnapshotChunk", collect);
  try {
    await session.send("HeapProfiler.takeHeapSnapshot", { reportProgress: false });
    await writeFile(path, chunks.join(""));
  } finally {
    session.off("HeapProfiler.addHeapSnapshotChunk", collect);
  }
}

export async function clickThroughPaint(locator: Locator): Promise<number> {
  const page = locator.page();
  const start = await page.evaluate(() => performance.now());
  await locator.click();
  return page.evaluate(
    (startedAt) =>
      new Promise<number>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve(performance.now() - startedAt));
        });
      }),
    start,
  );
}
