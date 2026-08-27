import { expect, test } from "./fixture";

test("should preserve Block layout in Vite development", async ({
  page,
}) => {
  test.info().annotations.push({
    type: "issue",
    description: "https://github.com/askrjs/askr-vite/issues/39",
  });
  test.info().annotations.push({
    type: "expected-observed",
    description:
      "Expected the Vite development document to include generated Block rules; observed ak-style classes without their registry rules and browser-default row layout.",
  });
  await page.goto("/");
  const layout = await page
    .locator('main > [data-slot="container"] > [data-slot="block"]')
    .evaluate((block) => {
      const generatedClass = [...block.classList].find((name) => name.startsWith("ak-style-"));
      const registry = document.querySelector("style[data-askr-style-registry]");
      return {
        direction: getComputedStyle(block).flexDirection,
        generatedClass: Boolean(generatedClass),
        hasGeneratedRule: Boolean(
          generatedClass && registry?.textContent?.includes(`.${generatedClass}{`),
        ),
      };
    });
  expect(layout.generatedClass).toBe(true);
  expect(layout.hasGeneratedRule).toBe(true);
  expect(layout.direction).toBe("column");
});
