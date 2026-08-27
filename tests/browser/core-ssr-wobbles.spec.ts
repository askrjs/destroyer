import type { Page } from "@playwright/test";
import { expect, test } from "./fixture";

const password = "correct horse battery staple";

async function createOperator(page: Page, email: string): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/logs$/);
}

test("CC01 should cancel held SSR query work when its client disconnects", async ({
  page,
  context,
  principalEmail,
}) => {
  await createOperator(page, principalEmail);
  await page.evaluate(async () => {
    await fetch("/api/__test/control/arm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operation: "operations.metrics", mode: "hold-next" }),
    });
  });
  const disconnected = await context.newPage();
  const navigation = disconnected.goto("/metrics").catch(() => null);
  await expect
    .poll(() => page.evaluate(async () => (await fetch("/api/__test/control/state")).text()))
    .toContain('"operation":"operations.metrics","mode":"hold-next","blocked":true');
  await disconnected.close();
  await navigation;
  await expect
    .poll(() => page.evaluate(async () => (await fetch("/api/__test/control/state")).text()))
    .not.toContain("operations.metrics");
  await expect(page.getByRole("heading", { name: "Logs", exact: true })).toBeVisible();
});

test.fixme("CC02 hydration mismatch diagnostics need an independently recoverable public policy", async () => {
  // Production verification is disabled by default. Enabling it globally currently rejects pristine
  // Destroyer markup and prevents enhanced form and navigation behavior, so it cannot be exercised
  // as a healthy product workflow without first resolving the framework capability.
});

test("CC05 should load a lazy production route and preserve hydrated navigation", async ({ page }) => {
  const scripts = new Set<string>();
  page.on("response", (response) => {
    const pathname = new URL(response.url()).pathname;
    if (pathname.startsWith("/assets/") && pathname.endsWith(".js")) scripts.add(pathname);
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Docs", exact: true }).first().click();
  await expect(page).toHaveURL(/\/docs$/);
  await expect(page.getByText("Askr documentation", { exact: true })).toBeVisible();
  expect([...scripts].some((path) => /docs-/i.test(path))).toBe(true);
});

test.fixme("CC04 CSP nonce propagation is excluded from the current non-security scope", async () => {
  // Deliberately not investigated or filed while security work is out of scope.
});

test.fixme("CC05 SSG and base-path agreement needs a real static deployment target", async () => {
  // Destroyer is currently an SSR product; a synthetic SSG-only surface would not be honest coverage.
});
