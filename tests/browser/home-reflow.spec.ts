import { expect, test, waitForHydration } from "./fixture";

const layouts = [
  { name: "desktop", width: 1440, height: 900, zoom: "1" },
  { name: "mobile", width: 390, height: 844, zoom: "1" },
  { name: "narrow mobile", width: 320, height: 844, zoom: "1" },
  { name: "desktop at 200%", width: 1440, height: 900, zoom: "2" },
  { name: "mobile at 150%", width: 390, height: 844, zoom: "1.5" },
  { name: "mobile at 200%", width: 390, height: 844, zoom: "2" },
] as const;

for (const layout of layouts) {
  for (const theme of ["light", "dark"] as const) {
    test(`Home text remains readable on ${layout.name} in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width: layout.width, height: layout.height });
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((choice) => {
        if (location.protocol === "http:" || location.protocol === "https:")
          localStorage.setItem("destroyer-theme", choice);
      }, theme);
      await page.goto("/");
      await waitForHydration(page);
      await page.evaluate((zoom) => {
        document.documentElement.style.zoom = zoom;
      }, layout.zoom);

      const coverage = page.getByText("Overall coverage", { exact: true });
      const coverageDescription = page.getByText(
        "Routes, overlays, forms, and virtualized surfaces are exercised together.",
        { exact: true },
      );
      const alertTitle = page.getByRole("heading", { name: "Token-backed visuals" });
      const alertDescription = page.getByText(
        "The server-rendered workspace and hydrated client share the same theme contract.",
        { exact: true },
      );
      const applicationTitle = page.getByText("Application shell", { exact: true });
      const themeTitle = page.getByText("Theme contract", { exact: true });

      for (const text of [
        coverage,
        coverageDescription,
        alertTitle,
        alertDescription,
        applicationTitle,
        themeTitle,
      ]) {
        await expect(text).toBeVisible();
        const splitWords = await text.evaluate((element) => {
          const words: string[] = [];
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const node = walker.currentNode;
            for (const match of (node.textContent ?? "").matchAll(/[a-z]+/giu)) {
              const range = document.createRange();
              range.setStart(node, match.index);
              range.setEnd(node, match.index + match[0].length);
              if (range.getClientRects().length > 1) words.push(match[0]);
            }
          }
          return words;
        });
        expect
          .soft(splitWords, `${await text.textContent()} splits words across lines`)
          .toEqual([]);
      }

      for (const title of [applicationTitle, themeTitle]) {
        const overlapsAction = await title.evaluate((element) => {
          const action = element
            .closest('[data-slot="item"]')
            ?.querySelector('[data-slot="badge"]');
          if (!action) throw new Error("Home item status badge is missing.");
          const badge = action.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(element);
          return [...range.getClientRects()].some(
            (rect) =>
              Math.min(rect.right, badge.right) - Math.max(rect.left, badge.left) > 0.5 &&
              Math.min(rect.bottom, badge.bottom) - Math.max(rect.top, badge.top) > 0.5,
          );
        });
        expect
          .soft(overlapsAction, `${await title.textContent()} overlaps its status badge`)
          .toBe(false);
      }

      const progress = await page
        .getByRole("progressbar", { name: "Overall component coverage" })
        .boundingBox();
      const label = await coverage.boundingBox();
      expect(progress).not.toBeNull();
      expect(label).not.toBeNull();
      expect(
        progress!.x + progress!.width <= label!.x + 0.5 ||
          progress!.y + progress!.height <= label!.y + 0.5,
        "Coverage indicator and label remain separate",
      ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBe(0);
    });
  }
}
