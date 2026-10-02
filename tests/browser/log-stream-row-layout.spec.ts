import type { Locator } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import type { OperationsLogPage } from "../../src/server/contracts";
import { expect, test } from "./fixture";

const cases = [
  { name: "desktop", width: 1440, height: 900, zoom: 1, theme: "light" },
  { name: "320px normal", width: 320, height: 844, zoom: 1, theme: "light" },
  { name: "light at 320px zoom 200", width: 320, height: 844, zoom: 2, theme: "light" },
  { name: "dark at 320px zoom 200", width: 320, height: 844, zoom: 2, theme: "dark" },
  { name: "mobile", width: 390, height: 844, zoom: 1, theme: "light" },
  { name: "mobile zoom 150 light", width: 390, height: 844, zoom: 1.5, theme: "light" },
  { name: "mobile zoom 200 light", width: 390, height: 844, zoom: 2, theme: "light" },
  { name: "mobile zoom 200 dark", width: 390, height: 844, zoom: 2, theme: "dark" },
] as const;

async function measureRows(stream: Locator) {
  return stream.evaluate((element) => {
    const box = (rect: DOMRect) => ({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
    return [
      ...element.querySelectorAll<HTMLElement>(
        '[data-slot="virtual-list-row"][data-visible="true"]',
      ),
    ]
      .map((row) => {
        const texts = [...row.querySelectorAll<HTMLElement>('[data-slot="text"]')].map((text) => {
          const range = document.createRange();
          range.selectNodeContents(text);
          const glyphs = box(range.getBoundingClientRect());
          const bounds = box(text.getBoundingClientRect());
          const painted =
            text.dataset.truncate === "true"
              ? {
                  left: Math.max(glyphs.left, bounds.left),
                  top: Math.max(glyphs.top, bounds.top),
                  right: Math.min(glyphs.right, bounds.right),
                  bottom: Math.min(glyphs.bottom, bounds.bottom),
                }
              : glyphs;
          return { text: text.textContent?.trim() ?? "", glyphs, bounds, painted };
        });
        const overlaps = texts.flatMap((first, index) =>
          texts
            .slice(index + 1)
            .flatMap((second) =>
              Math.min(first.painted.right, second.painted.right) -
                Math.max(first.painted.left, second.painted.left) >
                0.5 &&
              Math.min(first.painted.bottom, second.painted.bottom) -
                Math.max(first.painted.top, second.painted.top) >
                0.5
                ? [[first.text, second.text]]
                : [],
            ),
        );
        return {
          index: Number(row.dataset.index),
          bounds: box(row.getBoundingClientRect()),
          texts,
          overlaps,
        };
      })
      .sort((first, second) => first.index - second.index);
  });
}

function expectReadableRows(rows: Awaited<ReturnType<typeof measureRows>>, zoom: number) {
  expect(rows.length).toBeGreaterThan(1);
  for (const [index, row] of rows.entries()) {
    expect(row.bounds.height / zoom).toBeCloseTo(64, 1);
    if (index > 0) expect((row.bounds.top - rows[index - 1].bounds.top) / zoom).toBeCloseTo(64, 1);
    expect(row.texts).toHaveLength(6);
    expect(row.texts[0].text).toMatch(/^(debug|info|warning|error)$/u);
    expect(row.texts[2].text).toMatch(/^\d{2}:\d{2}:\d{2}$/u);
    expect(row.texts[5].text).toMatch(/^\d+ms$/u);
    expect(row.overlaps, `overlapping text in virtual row ${row.index}`).toEqual([]);
    if (row.bounds.width / zoom <= 192) {
      expect(row.texts[0].glyphs.bottom).toBeLessThanOrEqual(row.texts[2].glyphs.top);
      expect(row.texts[2].glyphs.bottom).toBeLessThanOrEqual(row.texts[5].glyphs.top);
    }
    for (const text of [row.texts[0], row.texts[2], row.texts[5]]) {
      expect(text.glyphs.left, `${text.text} starts outside row`).toBeGreaterThanOrEqual(
        row.bounds.left - 1,
      );
      expect(text.glyphs.right, `${text.text} ends outside row`).toBeLessThanOrEqual(
        row.bounds.right + 1,
      );
      expect(text.glyphs.top, `${text.text} starts above row`).toBeGreaterThanOrEqual(
        row.bounds.top - 1,
      );
      expect(text.glyphs.bottom, `${text.text} ends below row`).toBeLessThanOrEqual(
        row.bounds.bottom + 1,
      );
    }
  }
}

for (const visualCase of cases) {
  test(`${visualCase.name}: log stream rows keep fixed geometry and readable metadata`, async ({
    page,
    principalEmail,
  }, testInfo) => {
    await page.setViewportSize({ width: visualCase.width, height: visualCase.height });
    await page.emulateMedia({ colorScheme: visualCase.theme });
    await page.addInitScript((theme) => {
      if (location.protocol === "http:" || location.protocol === "https:")
        localStorage.setItem("destroyer-theme", theme);
    }, visualCase.theme);
    await page.route("**/api/operations/logs?limit=80", async (route) => {
      const response = await route.fetch();
      const logPage = (await response.json()) as OperationsLogPage;
      const severities = ["error", "info", "warning", "debug"] as const;
      await route.fulfill({
        response,
        json: {
          ...logPage,
          entries: logPage.entries.map((entry, index) => ({
            ...entry,
            severity: severities[index % severities.length],
          })),
        },
      });
    });
    await page.goto("/signup");
    await page.getByLabel("Email").fill(principalEmail);
    await page.getByLabel("Password").fill("correct horse battery staple");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/logs$/u);
    await page.evaluate((zoom) => {
      document.documentElement.style.zoom = String(zoom);
    }, visualCase.zoom);
    await expect(page.getByRole("heading", { name: "Logs", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Pause live stream" }).click();
    await expect(page.getByRole("button", { name: "Resume live stream" })).toBeVisible();
    const stream = page.getByRole("list", { name: "Recent log stream" });
    await stream.scrollIntoViewIfNeeded();
    await expect(
      stream.locator('[data-slot="virtual-list-row"][data-visible="true"]').first(),
    ).toBeVisible();
    const containerGeometry = await stream.evaluate((element) => {
      const card = element.closest<HTMLElement>('[data-slot="card"]')!;
      const grid = card.parentElement!;
      const cardStyle = getComputedStyle(card);
      return {
        zoom: Number(document.documentElement.style.zoom) || 1,
        gridWidth: grid.getBoundingClientRect().width,
        cardWidth: card.getBoundingClientRect().width,
        cardPaddingInline: cardStyle.paddingInlineStart,
        cardBorderInline: cardStyle.borderInlineStartWidth,
        viewportWidth: element.getBoundingClientRect().width,
        viewportBorderInline: getComputedStyle(element).borderInlineStartWidth,
      };
    });
    await writeFile(
      testInfo.outputPath("container-geometry.json"),
      JSON.stringify(containerGeometry, null, 2),
    );
    const beforeScroll = await measureRows(stream);
    const initialGeometryPath = testInfo.outputPath("initial-row-geometry.json");
    await writeFile(initialGeometryPath, JSON.stringify(beforeScroll, null, 2));
    await testInfo.attach("initial-row-geometry", {
      path: initialGeometryPath,
      contentType: "application/json",
    });
    await stream.screenshot({ path: testInfo.outputPath("live-stream.png") });
    expectReadableRows(beforeScroll, visualCase.zoom);
    expect([...new Set(beforeScroll.map((row) => row.texts[0].text))].sort()).toEqual([
      "debug",
      "error",
      "info",
      "warning",
    ]);
    expect(await stream.locator('[data-slot="virtual-list-row"]').count()).toBeLessThan(80);
    await stream.evaluate((element) => element.scrollTo({ top: 20 * 64 }));
    await expect
      .poll(async () =>
        Number(
          await stream
            .locator('[data-slot="virtual-list-row"][data-visible="true"]')
            .first()
            .getAttribute("data-index"),
        ),
      )
      .toBeGreaterThanOrEqual(19);
    const afterScroll = await measureRows(stream);
    const scrolledGeometryPath = testInfo.outputPath("scrolled-row-geometry.json");
    await writeFile(scrolledGeometryPath, JSON.stringify(afterScroll, null, 2));
    await testInfo.attach("scrolled-row-geometry", {
      path: scrolledGeometryPath,
      contentType: "application/json",
    });
    expectReadableRows(afterScroll, visualCase.zoom);
    expect([...new Set(afterScroll.map((row) => row.texts[0].text))].sort()).toEqual([
      "debug",
      "error",
      "info",
      "warning",
    ]);
  });
}

test("fixed log stream wrappers inherit default and customized spacing tokens", async ({
  page,
  principalEmail,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/signup");
  await page.getByLabel("Email").fill(principalEmail);
  await page.getByLabel("Password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/logs$/u);
  await page.getByRole("button", { name: "Pause live stream" }).click();
  const row = page
    .getByRole("list", { name: "Recent log stream" })
    .locator('[data-slot="virtual-list-row"][data-visible="true"] .log-stream-row')
    .first();
  await expect(row).toBeVisible();
  const spacing = () =>
    row.evaluate((element) => {
      const content = getComputedStyle(element.children[0]);
      const lines = getComputedStyle(element.children[0].children[0]);
      const heading = getComputedStyle(element.children[0].children[0].children[0]);
      return {
        paddingInline: content.paddingInlineStart,
        paddingBlock: content.paddingBlockStart,
        linesGap: lines.rowGap,
        headingGap: heading.columnGap,
      };
    });
  expect(await spacing()).toEqual({
    paddingInline: "14px",
    paddingBlock: "8px",
    linesGap: "4px",
    headingGap: "8px",
  });
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--ak-space-xs", "3px");
    document.documentElement.style.setProperty("--ak-space-sm", "7px");
    document.documentElement.style.setProperty("--ak-space-md", "13px");
  });
  expect(await spacing()).toEqual({
    paddingInline: "13px",
    paddingBlock: "7px",
    linesGap: "3px",
    headingGap: "7px",
  });
});

test("the narrow live stream inset changes only below its local width boundary", async ({
  page,
  principalEmail,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/signup");
  await page.getByLabel("Email").fill(principalEmail);
  await page.getByLabel("Password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/logs$/u);
  await page.getByRole("button", { name: "Pause live stream" }).click();
  const stream = page.getByRole("list", { name: "Recent log stream" });
  for (const width of [143.5, 144, 144.5]) {
    const geometry = await stream.evaluate((element, requestedWidth) => {
      const card = element.closest<HTMLElement>('[data-slot="card"]')!;
      const grid = card.parentElement!;
      grid.style.width = `${requestedWidth}px`;
      return {
        gridWidth: grid.getBoundingClientRect().width,
        inset: getComputedStyle(card).paddingInlineStart,
      };
    }, width);
    expect(geometry.gridWidth).toBeCloseTo(width, 1);
    expect(geometry.inset).toBe(width < 144 ? "14px" : "36px");
    await expect
      .poll(() => stream.locator('[data-slot="virtual-list-row"][data-visible="true"]').count())
      .toBeGreaterThan(1);
    expectReadableRows(await measureRows(stream), 1);
  }
  const inheritedInset = await stream.evaluate((element) => {
    document.documentElement.style.setProperty("--ak-space-md", "13px");
    const card = element.closest<HTMLElement>('[data-slot="card"]')!;
    card.parentElement!.style.width = "143.5px";
    return getComputedStyle(card).paddingInlineStart;
  });
  expect(inheritedInset).toBe("13px");
});
