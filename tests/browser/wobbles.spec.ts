import { expect, test, type Page } from "@playwright/test";

async function createOperator(page: Page, email: string): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/logs$/);
}

async function choose(page: Page, label: string, option: string): Promise<void> {
  await page.getByLabel(label).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function testControl(page: Page, operation: string, mode: string): Promise<void> {
  const status = await page.evaluate(
    async ({ controlledOperation, controlledMode }) =>
      (
        await fetch("/api/__test/control/arm", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ operation: controlledOperation, mode: controlledMode }),
        })
      ).status,
    { controlledOperation: operation, controlledMode: mode },
  );
  expect(status).toBe(200);
}

test("S10 @finding ASKR-DESTROYER-005 should restore Logs filter focus and state through Back and Forward", async ({
  page,
}) => {
  // Input: focus a route-owned Logs filter, navigate away, then return with browser Back.
  // Expected: the restored Logs state returns focus to the filter that owned it.
  // Observed: the URL and value restore, but focus falls back to the document body.
  // Package hypothesis: @askrjs/askr router only preserves focus for nodes that survive navigation;
  // its public router surface has no history focus-restoration contract for remounted route content.
  // Uncertainty: this is currently classified as a limitation, not a confirmed package defect.
  // Artifacts: test-results/**/trace.zip and test-results/**/error-context.md.
  await createOperator(page, "history.focus@example.test");
  const filter = page.getByLabel("Filter log events");
  await filter.fill("webhook");
  await expect(page).toHaveURL(/\/logs\?search=webhook$/);
  await filter.focus();
  await page.locator('a[href="/metrics"]').click();
  await expect(page.getByRole("heading", { name: "Metrics", exact: true })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/logs\?search=webhook$/);
  await expect(filter).toHaveValue("webhook");
  await expect(filter).toBeFocused();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Metrics" })).toBeVisible();
});

test("S11 should keep an open Select portal themed during a live theme change", async ({ page }) => {
  await createOperator(page, "portal.theme@example.test");
  await page.goto("/settings/preferences");
  await page.getByLabel("Region").click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  const light = await listbox.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
    localStorage.setItem("destroyer-theme", "dark");
  });
  await expect(listbox).toBeVisible();
  await expect
    .poll(() => listbox.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(light);
  await expect(page.getByLabel("Region")).toHaveAttribute("aria-expanded", "true");
});

test("S16 should keep independent route and mounted failures recoverable", async ({ page }) => {
  await createOperator(page, "query.failure@example.test");
  await page.goto("/metrics");
  await testControl(page, "operations.metrics", "fail-next");
  await page.getByRole("button", { name: "Refresh metrics" }).click();
  await expect(page.getByRole("heading", { name: "Metrics", exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
  await page.getByRole("button", { name: /retry/i }).click();
  await expect(page.getByText("Persisted operational events.")).toBeVisible();
});

test("S15 should tolerate an immediate interaction before hydration completes", async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (location.pathname !== "/" || sessionStorage.getItem("destroyer-prehydration-click")) {
        return;
      }
      const link = document.querySelector<HTMLAnchorElement>('a[href="/about"]');
      if (!link) return;
      observer.disconnect();
      sessionStorage.setItem("destroyer-prehydration-click", "true");
      (
        globalThis as typeof globalThis & { __destroyerPreHydrationClick?: boolean }
      ).__destroyerPreHydrationClick = true;
      link.click();
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { name: "About Destroyer" })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("destroyer-prehydration-click"))).toBe(
    "true",
  );
  await page.close();
  const livenessProbe = await context.newPage();
  const response = await livenessProbe.goto("/livez");
  expect(response?.status()).toBe(200);
  await livenessProbe.goto("/signup");
  await expect(
    livenessProbe.getByRole("heading", { name: "Create your operator account" }),
  ).toBeVisible();
});

test("S31 should preserve dirty Workspace input offline and commit after reconnect", async ({
  page,
  context,
}) => {
  await createOperator(page, "offline.workspace@example.test");
  await page.goto("/settings/workspace");
  await choose(page, "Default role", "Member");
  await context.setOffline(true);
  await page.getByRole("button", { name: "Save workspace" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Default role")).toHaveText("Member");
  await context.setOffline(false);
  await page.getByRole("button", { name: "Save workspace" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const response = await fetch("/api/settings", { credentials: "same-origin" });
        return ((await response.json()) as { defaultRole: string }).defaultRole;
      }),
    )
    .toBe("member");
});
