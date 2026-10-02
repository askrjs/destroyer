import { jsx } from "@askrjs/askr";
import { renderToStringSync } from "@askrjs/askr/ssr";
import { Block } from "@askrjs/themes/components";
import { describe, expect, test, vi } from "vitest";
import { LogStreamRow } from "../src/features/logs/log-stream-row";
import type { LogEntry, LogSeverity } from "../src/features/logs/logs-data";

vi.mock("@askrjs/themes/components", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@askrjs/themes/components")>();
  return { ...actual, Block: vi.fn(actual.Block) };
});

const entry: LogEntry = {
  id: "fixed-row",
  time: "23:59:59",
  service: "billing <service>",
  route: "/billing?mode=fast&ready=true",
  severity: "info",
  latency: 123,
  requestId: "request-fixed-row",
  message: "Completed <billing> request",
};

function render(item: LogEntry) {
  return renderToStringSync(
    () => jsx(LogStreamRow, { item, index: 0, rowKey: item.id, isVisible: true }),
    {},
  );
}

describe("Fixed log stream row layout", () => {
  test("does not prepare generated layout bindings for fixed row wrappers", () => {
    vi.mocked(Block).mockClear();
    const html = render(entry);
    expect(vi.mocked(Block)).toHaveBeenCalledTimes(0);
    expect(html).not.toMatch(/\bak-style-/u);
    expect(html).not.toContain("data-askr-style-registry");
  });

  test.each([
    ["debug", "muted"],
    ["info", "info"],
    ["warning", "warning"],
    ["error", "danger"],
  ] as const)("preserves %s row structure, accessibility and themed text", (severity, tone) => {
    const html = render({ ...entry, severity: severity as LogSeverity });
    const tags = [...html.matchAll(/<(div|span|p)\b/gu)].map((match) => match[1]);
    expect(tags).toEqual([
      "div",
      "div",
      "div",
      "div",
      "div",
      "span",
      "span",
      "p",
      "span",
      "span",
      "div",
      "div",
      "span",
      "span",
      "span",
      "div",
      "span",
    ]);
    expect(html.match(/data-slot="block"/gu)).toHaveLength(11);
    expect(html.match(/data-ak-layout="true"/gu)).toHaveLength(11);
    expect(html.match(/data-slot="text"/gu)).toHaveLength(6);
    expect(html.match(/data-size="sm"/gu)).toHaveLength(6);
    expect(html.match(/data-truncate="true"/gu)).toHaveLength(3);
    expect(html.match(/data-font="mono"/gu)).toHaveLength(3);
    expect(html.match(/data-numeric="tabular"/gu)).toHaveLength(2);
    expect(html).toContain(`data-severity="${severity}"`);
    expect(html).toContain(`aria-label="${severity} billing &lt;service&gt; event at 23:59:59"`);
    expect(html).toContain(`data-tone="${tone}" data-weight="semibold"`);
    expect(html).toContain("Completed &lt;billing&gt; request");
    expect(html).toContain("billing &lt;service&gt;");
    expect(html).toContain("/billing?mode=fast&amp;ready=true");
    expect(html).toContain("123ms");
  });

  test("preserves caller data error identity and access order", () => {
    const failure = new Error("severity read failed");
    const reads: string[] = [];
    const item = new Proxy(entry, {
      get(target, key, receiver) {
        if (typeof key === "string") reads.push(key);
        if (key === "severity") throw failure;
        return Reflect.get(target, key, receiver);
      },
    });
    expect(() => LogStreamRow({ item, index: 0, rowKey: "fixed-row", isVisible: true })).toThrow(
      failure,
    );
    expect(reads).toEqual(["severity"]);
  });
});
