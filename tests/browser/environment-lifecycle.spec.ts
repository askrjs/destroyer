import { expect, test, type Page } from "@playwright/test";

async function createOperator(page: Page, email: string): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/logs$/);
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("S09 should preserve a protected mobile deep link through sign-in", async ({ page }) => {
  await createOperator(page, "mobile.deeplink@example.test");
  await page.goto("/logout");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/settings/workspace?source=security-review");
  await expect(page).toHaveURL(/\/login\?next=%2Fsettings%2Fworkspace%3Fsource%3Dsecurity-review$/);
  await page.getByLabel("Email").fill("mobile.deeplink@example.test");
  await page.getByLabel("Password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/settings\/workspace\?source=security-review$/);
  await expect(page.getByRole("heading", { name: "Workspace", exact: true })).toBeVisible();
});

test("S07 should tear down an open overlay when the authenticated session expires", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await createOperator(page, "expired.overlay@example.test");
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  const expired = await page.evaluate(async () => {
    const response = await fetch("/api/__test/session/expire", {
      method: "POST",
      credentials: "same-origin",
    });
    return response.status;
  });
  expect(expired).toBe(204);

  await page.reload();
  await expect(page).toHaveURL(/\/login\?next=%2Flogs$/);
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("S08 @finding ASKR-DESTROYER-004 should keep a Select portal inside the viewport while crossing breakpoints", async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({
    type: "finding",
    description:
      "Input: open Select at 1280x800, resize to 320x568, then close with Escape. Expected: content remains in viewport and focus returns to the Region trigger. Observed: geometry remains valid but focus becomes inactive. Owning package: @askrjs/ui Select focus restoration across viewport changes, tracked by askrjs/askr-ui#114. Artifacts: Playwright HTML report, trace, and error-context snapshot.",
  });
  await createOperator(page, `responsive.portal.${testInfo.repeatEachIndex}@example.test`);
  await page.goto("/settings/preferences");
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByLabel("Region").click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await page.setViewportSize({ width: 320, height: 568 });
  const geometry = await listbox.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: innerWidth,
      height: innerHeight,
    };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.width);
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.height);
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Region")).toBeFocused();
});

for (const environment of ["forced-colors", "reduced-motion", "zoom-200"] as const) {
  const scenarioId = environment === "forced-colors" ? "S12" : environment === "reduced-motion" ? "S14" : "S13";
  test(`${scenarioId} should preserve long-copy interaction under ${environment}`, async ({ page }) => {
    if (environment === "forced-colors") await page.emulateMedia({ forcedColors: "active" });
    if (environment === "reduced-motion") await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/contact");
    if (environment === "zoom-200")
      await page.evaluate(() => {
        document.documentElement.style.zoom = "2";
        document.documentElement.style.width = "50%";
      });
    await page.getByLabel("Email").fill("environment@example.test");
    await page.getByLabel("Subject").fill("A long but realistic accessibility review subject");
    await page
      .getByLabel("Message")
      .fill(
        "The operator is reviewing long support copy while browser accessibility preferences alter color, animation, or effective layout width.",
      );
    if (environment === "zoom-200") {
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).zoom)).toBe("2");
      expect(await page.evaluate(() => document.documentElement.style.width)).toBe("50%");
      expect(await page.evaluate(() => innerWidth / 2)).toBe(195);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    ).toBe(false);
    await expect(page.getByRole("button", { name: "Send request" })).toBeVisible();
  });
}
