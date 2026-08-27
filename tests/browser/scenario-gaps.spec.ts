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

test.fixme(
  "S01 @finding dirty Workspace navigation requires a public navigation-blocking contract",
  async () => {
    // Destroyer has no public Askr navigation-blocking API to compose this without patching internals.
  },
);

test.fixme(
  "S19 @finding virtualized incident operations require published variable-height collection support",
  async () => {
    // The natural incident surface uses cards; simulated virtualization would be dishonest coverage.
  },
);

test("S23 @finding ASKR-DESTROYER-010 should keep independent Metrics sections alive through held, failed, and empty reads", async ({
  page,
  principalEmail,
}, testInfo) => {
  testInfo.annotations.push({
    type: "finding",
    description:
      "Input: hold summary refresh, fail logs refresh, then return an empty successful metrics refresh. Expected: each independent query publishes its own result without collapsing siblings. Observed: isolation works, and the metrics API returns the armed empty 200, but the mounted query retains its prior value. Owning package: @askrjs/askr@0.2.3, tracked by askrjs/askr#364.",
  });
  await createOperator(page, principalEmail);
  await page.goto("/metrics");
  const summary = page
    .getByRole("heading", { name: "Service summary" })
    .locator('xpath=ancestor::*[@data-slot="card"]');
  const logs = page
    .getByRole("heading", { name: "Recent log evidence" })
    .locator('xpath=ancestor::*[@data-slot="card"]');
  await expect(summary).toContainText("healthy services");
  await expect(logs).toContainText("recent persisted events");
  await expect(page.getByText("Persisted operational events.")).toBeVisible();

  const control = async (path: "arm" | "release", body: unknown) =>
    page.evaluate(
      async ({ controlPath, controlBody }) =>
        (
          await fetch(`/api/__test/control/${controlPath}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(controlBody),
          })
        ).status,
      { controlPath: path, controlBody: body },
    );

  expect(await control("arm", { operation: "operations.summary", mode: "hold-next" })).toBe(200);
  await summary.getByRole("button", { name: "Refresh summary" }).click();
  await expect
    .poll(() => page.evaluate(async () => (await fetch("/api/__test/control/state")).text()))
    .toContain('"operation":"operations.summary","mode":"hold-next","blocked":true');
  await expect(summary).toHaveAttribute("aria-busy", "true");
  await expect(logs).toContainText("recent persisted events");
  await expect(page.getByText("Persisted operational events.")).toBeVisible();

  expect(await control("arm", { operation: "operations.logs", mode: "fail-next" })).toBe(200);
  await logs.getByRole("button", { name: "Refresh logs" }).click();
  await expect(logs.getByText("Logs could not be loaded")).toBeVisible();
  await expect(summary).toHaveAttribute("aria-busy", "true");
  await expect(page.getByText("Persisted operational events.")).toBeVisible();

  expect(await control("release", { operation: "operations.summary" })).toBe(200);
  await expect(summary).toHaveAttribute("aria-busy", "false");
  await expect(summary).toContainText("healthy services");

  expect(await control("arm", { operation: "operations.metrics", mode: "empty-next" })).toBe(200);
  const emptyMetrics = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/operations/metrics" && response.status() === 200,
  );
  await page.getByRole("button", { name: "Refresh metrics" }).click();
  expect(((await (await emptyMetrics).json()) as { requests: number }).requests).toBe(0);
  const requests = page.getByText("Requests", { exact: true }).locator('xpath=ancestor::*[@data-slot="card"]');
  await expect(requests.getByText("0", { exact: true })).toBeVisible();
  await expect(summary).toContainText("healthy services");

  await logs.getByRole("button", { name: "Refresh logs" }).click();
  await expect(logs.getByText("Logs could not be loaded")).toHaveCount(0);
  await expect(logs).toContainText("recent persisted events");
});

test("S32 CB03 should ignore a reverse-order stale notification response", async ({
  page,
  principalEmail,
}) => {
  await createOperator(page, principalEmail);
  await page.goto("/settings/notifications");
  const toggle = page.getByRole("switch", { name: "In-app notifications" });
  await page.evaluate(async () => {
    await fetch("/api/__test/control/arm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operation: "settings.update", mode: "hold-next" }),
    });
  });
  await toggle.click();
  await expect.poll(() => page.evaluate(async () => (await fetch("/api/__test/control/state")).text())).toContain('"blocked":true');
  await toggle.click();
  await expect(toggle).toBeChecked();
  await page.evaluate(async () => {
    await fetch("/api/__test/control/release", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operation: "settings.update" }),
    });
  });
  await expect.poll(() => page.evaluate(async () => {
    const response = await fetch("/api/settings");
    return ((await response.json()) as { inAppNotifications: boolean }).inAppNotifications;
  })).toBe(true);
  await expect(toggle).toBeChecked();
});
