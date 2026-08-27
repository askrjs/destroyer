import { jsx } from "@askrjs/askr";
import { renderToStringSync } from "@askrjs/askr/ssr";
import { describe, expect, test } from "vitest";

describe("Core SSR contracts", () => {
  test("CC03 serializes supported render data while preserving script escaping", () => {
    const html = renderToStringSync(
      () => jsx("p", { children: "<script>visible copy</script>" }),
      {},
      {
        data: {
          text: "</script><script>unexpected()</script>",
          nested: { enabled: true, count: 3, values: [null, "stable"] },
        },
      },
    );

    expect(html).toContain("&lt;script&gt;visible copy&lt;/script&gt;");
    expect(html).toContain('data-askr-render-data="true"');
    expect(html).toContain("\\u003C/script>\\u003Cscript>unexpected()\\u003C/script>");
    expect(html).not.toContain("</script><script>unexpected()</script>");
  });

  test("CC03 rejects unsupported render data deterministically", () => {
    expect(() =>
      renderToStringSync(
        () => jsx("p", { children: "Unsupported data" }),
        {},
        { data: { unsupported: 1n } },
      ),
    ).toThrow(TypeError);
  });
});
