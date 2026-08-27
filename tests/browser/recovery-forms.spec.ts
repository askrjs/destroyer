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

async function choose(page: Page, label: string, option: string): Promise<void> {
  await page.getByLabel(label).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function control(page: Page, path: string, body?: unknown): Promise<unknown> {
  return page.evaluate(
    async ({ controlPath, controlBody }) => {
      const response = await fetch(`/api/__test/control/${controlPath}`, {
        method: controlPath === "state" ? "GET" : "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: controlBody === undefined ? undefined : JSON.stringify(controlBody),
      });
      return response.json();
    },
    { controlPath: path, controlBody: body },
  );
}

test("S24 should persist the approver group only through the manual approval workflow", async ({
  page,
}) => {
  await createOperator(page, "manual.approver@example.test");
  await page.goto("/settings/workspace");
  await choose(page, "Approval policy", "Automatic approval");
  await expect(page.getByLabel("Approver group")).toHaveCount(0);
  await choose(page, "Approval policy", "Manual approval");
  await page.getByLabel("Approver group").fill("Release managers");
  await page.getByRole("button", { name: "Save workspace" }).click();
  await page.reload();
  await expect(page.getByLabel("Approval policy")).toHaveText("Manual approval");
  await expect(page.getByLabel("Approver group")).toHaveValue("Release managers");
});

test("S25 should constrain timezone by region and reset to the last server-confirmed preferences", async ({
  page,
}) => {
  await createOperator(page, "preference.reset@example.test");
  await page.goto("/settings/preferences");
  await choose(page, "Region", "US West");
  await expect(page.getByLabel("Timezone")).toHaveText("Pacific Time");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await choose(page, "Region", "US East");
  await choose(page, "Workspace density", "Compact");
  await page.getByRole("button", { name: "Reset preferences" }).click();
  await expect(page.getByLabel("Region")).toHaveText("US West");
  await expect(page.getByLabel("Timezone")).toHaveText("Pacific Time");
  await expect(page.getByLabel("Workspace density")).toHaveText("Comfortable");
});

test("S26 should autosave rapid notification changes to the final intent", async ({ page }) => {
  await createOperator(page, "notification.order@example.test");
  await page.goto("/settings/notifications");
  await control(page, "arm", { operation: "settings.update", mode: "hold-next" });
  const toggle = page.getByRole("switch", { name: "In-app notifications" });
  await toggle.click();
  await expect
    .poll(async () => JSON.stringify(await control(page, "state")))
    .toContain('"blocked":true');
  await toggle.click();
  await control(page, "release", { operation: "settings.update" });
  await expect(toggle).toBeChecked();
  await expect(page.getByRole("status")).toHaveText("Notification preference saved.");
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch("/api/settings");
        return ((await response.json()) as { inAppNotifications: boolean }).inAppNotifications;
      }),
    )
    .toBe(true);
});

test("S27 CB04 should preserve valid profile input through validation, failure, retry, and optimistic conflict", async ({
  page,
  principalEmail,
}) => {
  // Input: submit invalid profile data, correct it, then receive a completed pre-mutation 500.
  // Expected: the second promise rejects, pending clears, valid input survives, and conflict remains testable.
  // Observed: the 500 completes but @askrjs/askr action state remains pending indefinitely.
  // Package hypothesis: action submission generation ownership is lost across the validation rerender.
  // Uncertainty: low; reproduced three times with the response completion verified in the trace.
  // Artifacts: test-results/recovery-forms-*/trace.zip and error-context.md.
  await createOperator(page, principalEmail);
  const stale = await page.context().newPage();
  await page.goto("/settings");
  await stale.goto("/settings");
  await stale.getByLabel("Display name").fill("x");
  await stale.getByRole("button", { name: "Save profile" }).click();
  await expect(stale.getByText(/at least 2/i)).toBeVisible();
  await stale.getByLabel("Display name").fill("Local recovery name");
  await control(stale, "arm", { operation: "settings.update", mode: "fail-next" });
  await stale.getByRole("button", { name: "Save profile" }).click();
  await expect(stale.getByRole("alert")).toBeVisible();
  await expect(stale.getByLabel("Display name")).toHaveValue("Local recovery name");
  await page.getByLabel("Display name").fill("Committed elsewhere");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch("/api/settings");
        return ((await response.json()) as { displayName: string }).displayName;
      }),
    )
    .toBe("Committed elsewhere");
  await stale.getByRole("button", { name: "Save profile" }).click();
  await expect(stale.getByRole("alert")).toContainText("another session");
  await expect(stale.getByLabel("Display name")).toHaveValue("Local recovery name");
});

test("S28 should require exact typed confirmation, clear authentication, and redirect after deletion", async ({
  page,
}) => {
  const email = "delete.operator@example.test";
  await createOperator(page, email);
  await page.goto("/settings/security");
  const confirmation = page.getByLabel("Type your email to confirm");
  const remove = page.getByRole("button", { name: "Delete account" });
  await confirmation.fill("wrong@example.test");
  await expect(remove).toBeDisabled();
  await confirmation.fill(email);
  await expect(remove).toBeEnabled();
  await remove.click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
