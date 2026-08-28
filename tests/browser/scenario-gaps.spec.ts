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

test("S01 should cancel, discard, and save through owned dirty Workspace navigation", async ({
  page,
  principalEmail,
}) => {
  await createOperator(page, principalEmail);
  await page.goto("/settings/workspace");
  const approverGroup = page.getByLabel("Approver group");
  const returnToLogs = page.getByRole("button", { name: "Return to logs" });
  await approverGroup.fill("Release captains");
  expect(
    await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      return !window.dispatchEvent(event);
    }),
  ).toBe(true);

  await returnToLogs.click();
  const dialog = page.getByRole("alertdialog", {
    name: "Leave without saving workspace changes?",
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(returnToLogs).toBeFocused();
  await expect(approverGroup).toHaveValue("Release captains");

  await returnToLogs.click();
  await dialog.getByRole("button", { name: "Discard changes" }).click();
  await expect(page).toHaveURL(/\/logs$/);
  await page.goto("/settings/workspace");
  await expect(approverGroup).toHaveValue("Operations leads");

  await approverGroup.fill("Release captains");
  await page.getByRole("button", { name: "Save workspace" }).click();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch("/api/settings", { credentials: "same-origin" });
        return ((await response.json()) as { approverGroup: string }).approverGroup;
      }),
    )
    .toBe("Release captains");
  await returnToLogs.click();
  await expect(page).toHaveURL(/\/logs$/);
  await expect(dialog).toHaveCount(0);
});

test.fixme("S19 @finding askr-ui#119 virtualized incident operations require variable-height row support", async () => {
  // VirtualList enforces one fixed height and overflow:hidden per row. The natural inline incident
  // timeline stays quarantined until the public primitive can reposition keyed rows after expansion.
});

test("S23 should keep independent Metrics sections alive through held, failed, and empty reads", async ({
  page,
  principalEmail,
}, testInfo) => {
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
  const requests = page
    .getByText("Requests", { exact: true })
    .locator('xpath=ancestor::*[@data-slot="card"]');
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
  await expect
    .poll(() => page.evaluate(async () => (await fetch("/api/__test/control/state")).text()))
    .toContain('"blocked":true');
  await toggle.click();
  await expect(toggle).toBeChecked();
  await page.evaluate(async () => {
    await fetch("/api/__test/control/release", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operation: "settings.update" }),
    });
  });
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch("/api/settings");
        return ((await response.json()) as { inAppNotifications: boolean }).inAppNotifications;
      }),
    )
    .toBe(true);
  await expect(toggle).toBeChecked();
});
