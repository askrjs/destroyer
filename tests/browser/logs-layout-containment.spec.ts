import { writeFile } from "node:fs/promises";
import { expect, test } from "./fixture";

const cases = [
  { name: "desktop tokens", width: 1440, zoom: 1, theme: "light", tokens: true },
  { name: "mobile", width: 320, zoom: 1, theme: "light", tokens: false },
  { name: "mobile zoom", width: 390, zoom: 2, theme: "dark", tokens: false },
] as const;

for (const mode of cases) {
  test(`${mode.name}: Logs viewport containment preserves sticky headers, keyboard and portals`, async ({
    page,
    principalEmail,
  }, testInfo) => {
    await page.setViewportSize({ width: mode.width, height: 900 });
    await page.addInitScript((theme) => {
      if (location.protocol === "http:" || location.protocol === "https:")
        localStorage.setItem("destroyer-theme", theme);
    }, mode.theme);
    await page.route("**/api/operations/logs?limit=80", async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.entries = body.entries.map((entry: Record<string, unknown>, index: number) => ({
        ...entry,
        timestamp: new Date(Date.UTC(2026, 0, 1, 12, 0, index)).toISOString(),
      }));
      await route.fulfill({ response, json: body });
    });
    await page.goto("/signup");
    await page.getByLabel("Email").fill(principalEmail);
    await page.getByLabel("Password").fill("correct horse battery staple");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/logs$/u);
    await expect(page.locator("html")).toHaveAttribute("data-theme", mode.theme);
    await page.getByRole("button", { name: "Pause live stream" }).click();
    await page.evaluate(({ zoom, tokens }) => {
      document.documentElement.style.zoom = String(zoom);
      if (tokens) document.documentElement.style.setProperty("--ak-space-md", "13px");
    }, mode);

    const stream = page.getByRole("list", { name: "Recent log stream" });
    const tableViewport = page.locator('[data-slot="virtual-table"]');
    const grid = page.getByRole("grid", { name: "Log event details" });
    await expect(stream.locator('[data-visible="true"]')).not.toHaveCount(0);
    await expect(grid.getByRole("row")).not.toHaveCount(1);
    const settleWitness = () =>
      page.evaluate(async () => {
        const finite = document
          .getAnimations()
          .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
        await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      });
    const witness = async () => {
      await settleWitness();
      return page.evaluate(() => {
        const selectors = [
          '[data-slot="virtual-list"]',
          '[data-slot="virtual-list-row"][data-visible="true"] .log-stream-row',
          '[data-slot="virtual-table"]',
          '[data-slot="virtual-table-head"]',
          '[data-slot="virtual-table-row"]',
        ];
        const records = selectors.flatMap((selector) =>
          [...document.querySelectorAll(selector)].slice(0, 3).map((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              selector,
              tag: element.tagName,
              role: element.getAttribute("role"),
              label: element.getAttribute("aria-label"),
              documentRect: [rect.x + scrollX, rect.y + scrollY, rect.width, rect.height].map(
                (value) => Math.round(value * 100) / 100,
              ),
              rect: [rect.x, rect.y, rect.width, rect.height].map(
                (value) => Math.round(value * 100) / 100,
              ),
              style: Object.fromEntries(
                [
                  "display",
                  "position",
                  "overflow",
                  "block-size",
                  "padding",
                  "font",
                  "color",
                  "background-color",
                  "gap",
                ].map((name) => [name, style.getPropertyValue(name)]),
              ),
            };
          }),
        );
        return { records, windowScroll: [scrollX, scrollY] };
      });
    };
    const initial = await witness();
    await tableViewport.scrollIntoViewIfNeeded();
    await grid.focus();
    const selected = await grid.locator('[aria-selected="true"]').getAttribute("data-row-key");
    await page.keyboard.press("ArrowDown");
    await expect(grid).toBeFocused();
    await expect
      .poll(() => grid.locator('[aria-selected="true"]').getAttribute("data-row-key"))
      .not.toBe(selected);
    await tableViewport.evaluate((element) => {
      element.scrollTop = 220;
    });
    await expect.poll(() => tableViewport.evaluate((element) => element.scrollTop)).toBe(220);
    const sticky = await tableViewport.evaluate((element, zoom) => {
      const root = element.getBoundingClientRect();
      const head = element.querySelector('[data-slot="virtual-table-head"]')!;
      return {
        offset: head.getBoundingClientRect().top - root.top,
        position: getComputedStyle(head).position,
        border: Number.parseFloat(getComputedStyle(element).borderTopWidth) * zoom,
      };
    }, mode.zoom);
    expect(sticky.position).toBe("sticky");
    expect(sticky.offset).toBeCloseTo(sticky.border, 0);
    const scrolled = await witness();
    if (mode.zoom !== 1)
      await page.evaluate(() => {
        document.documentElement.style.zoom = "1";
      });
    const trigger = grid.getByRole("button", { name: /^View details for / }).first();
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const originalTrigger = await trigger.elementHandle();
    await trigger.click();
    const details = page.getByRole("dialog", { name: "Log event details" });
    await expect(details).toBeVisible();
    await settleWitness();
    const portal = await details.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        windowScroll: [scrollX, scrollY],
        insideViewport: Boolean(
          element.closest('[data-slot="virtual-list"], [data-slot="virtual-table"]'),
        ),
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: innerWidth,
        height: innerHeight,
      };
    });
    expect(portal.insideViewport).toBe(false);
    expect(portal.left).toBeGreaterThanOrEqual(-1);
    expect(portal.right).toBeLessThanOrEqual(portal.width + 1);
    expect(portal.top).toBeGreaterThanOrEqual(-1);
    expect(portal.bottom).toBeLessThanOrEqual(portal.height + 1);
    await page.keyboard.press("Escape");
    await expect(details).toHaveCount(0);
    await expect
      .poll(() => originalTrigger!.evaluate((element) => document.activeElement === element))
      .toBe(true);
    const containment = await Promise.all(
      [stream, tableViewport].map((locator) =>
        locator.evaluate((element) => getComputedStyle(element).contain),
      ),
    );
    const path = testInfo.outputPath("logs-containment-witness.json");
    await writeFile(
      path,
      JSON.stringify(
        {
          mode,
          actualTheme: await page.locator("html").getAttribute("data-theme"),
          initial,
          scrolled,
          sticky,
          portal,
          containment,
        },
        null,
        2,
      ),
    );
    await testInfo.attach("logs-containment-witness", { path, contentType: "application/json" });
    expect(containment).toEqual(["layout", "layout"]);
  });
}
