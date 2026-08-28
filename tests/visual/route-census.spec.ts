import { expect, test } from "@playwright/test";
import { routeExpectations, unknownRouteExpectation } from "../../src/pages/route-expectations";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;
const cases = [
  ...viewports.flatMap((viewport) =>
    ["light", "dark", "system"].map((theme) => ({ viewport, theme, mode: "theme" })),
  ),
  ...viewports.map((viewport) => ({ viewport, theme: "light", mode: "forced-colors" })),
  ...viewports.map((viewport) => ({ viewport, theme: "light", mode: "reduced-motion" })),
  ...viewports.map((viewport) => ({ viewport, theme: "light", mode: "zoom-200" })),
] as const;

for (const route of [...routeExpectations, { ...unknownRouteExpectation, authenticated: false }]) {
  for (const visualCase of cases) {
    test(`${route.path} ${visualCase.viewport.name} ${visualCase.mode} ${visualCase.theme}`, async ({
      page,
    }) => {
      if (!route.authenticated) await page.context().clearCookies();
      await page.setViewportSize(visualCase.viewport);
      await page.emulateMedia({
        colorScheme:
          visualCase.theme === "system" || visualCase.theme === "dark" ? "dark" : "light",
        forcedColors: visualCase.mode === "forced-colors" ? "active" : "none",
        reducedMotion: visualCase.mode === "reduced-motion" ? "reduce" : "no-preference",
      });
      await page.addInitScript(
        ({ theme }) => {
          localStorage.setItem("destroyer-theme", theme);
        },
        { theme: visualCase.theme },
      );
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("requestfailed", (request) =>
        errors.push(
          `${request.method()} ${request.url()}: ${request.failure()?.errorText ?? "failed"}`,
        ),
      );
      page.on("response", (response) => {
        if (response.status() >= 400 && response.status() !== 404)
          errors.push(`${response.status()} ${response.url()}`);
      });
      await page.goto(route.path);
      if (visualCase.mode === "zoom-200")
        await page.evaluate(() => {
          document.documentElement.style.zoom = "2";
          document.documentElement.style.width = "50%";
        });
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
      const overflow = await page.evaluate(() => ({
        delta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        offenders: [...document.querySelectorAll<HTMLElement>("body *")]
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.right > document.documentElement.clientWidth + 0.5 || rect.left < -0.5;
          })
          .slice(0, 12)
          .map((element) => ({
            tag: element.tagName.toLowerCase(),
            slot: element.dataset.slot ?? "",
            className: element.className,
            text: element.textContent?.trim().slice(0, 60) ?? "",
            rect: element.getBoundingClientRect().toJSON(),
          })),
      }));
      expect(overflow).toMatchObject({ delta: 0, offenders: [] });
      if (visualCase.mode === "zoom-200") {
        expect(await page.evaluate(() => getComputedStyle(document.documentElement).zoom)).toBe(
          "2",
        );
        expect(await page.evaluate(() => document.documentElement.style.width)).toBe("50%");
        expect(await page.evaluate(() => innerWidth / 2)).toBe(visualCase.viewport.width / 2);
      }
      if (visualCase.mode === "forced-colors")
        expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
      if (visualCase.mode === "reduced-motion")
        expect(
          await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
        ).toBe(true);
      expect(errors).toEqual([]);
      await expect(page).toHaveScreenshot(
        `${route.path.replace(/^\/$/u, "home").replaceAll("/", "-")}-${visualCase.viewport.name}-${visualCase.mode}-${visualCase.theme}.png`,
        { fullPage: true },
      );
    });
  }
}
