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

async function control(page: Page, path: "arm" | "state" | "release", body?: unknown) {
  return page.evaluate(
    async ({ controlPath, controlBody }) => {
      const response = await fetch(`/api/__test/control/${controlPath}`, {
        method: controlPath === "state" ? "GET" : "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: controlBody === undefined ? undefined : JSON.stringify(controlBody),
      });
      return { status: response.status, body: await response.json() };
    },
    { controlPath: path, controlBody: body },
  );
}

test("CA01 should not commit an aborted Metrics preload after rapid navigation", async ({
  page,
}) => {
  await createOperator(page, "router.aborted-preload@example.test");
  await control(page, "arm", { operation: "operations.metrics", mode: "hold-next" });
  await page.getByRole("link", { name: "Metrics", exact: true }).click();
  await expect
    .poll(async () => JSON.stringify((await control(page, "state")).body))
    .toContain('"blocked":true');

  await page.getByRole("link", { name: "Logs", exact: true }).click();
  await expect(page).toHaveURL(/\/logs$/);
  await control(page, "release", { operation: "operations.metrics" });
  await expect(page.getByRole("heading", { name: "Logs", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/logs$/);
  await page.waitForTimeout(100);
  await expect(page).toHaveURL(/\/logs$/);
});

test("CA03 should terminate a self-referential post-login redirect", async ({ page }) => {
  const email = "router.redirect-cycle@example.test";
  await createOperator(page, email);
  await page.goto("/logout");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/login?next=/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/logs$/);
  await expect(page.getByRole("heading", { name: "Logs", exact: true })).toBeVisible();
});

test.fixme("CA02 @finding deferred route data needs a natural independently recoverable nested boundary", async () => {
  // Retained as a capability finding until the Metrics sections are split into independent queries.
});

test("CA04 should keep incident evidence handoff state on its owning history entry", async ({
  page,
  principalEmail,
}) => {
  await createOperator(page, principalEmail);
  await page.goto("/incidents");
  const incident = page.getByRole("heading", { level: 3 }).first();
  const incidentTitle = await incident.textContent();
  await incident
    .locator('xpath=ancestor::*[@data-slot="card"]')
    .getByRole("button", { name: "Review evidence" })
    .click();

  await expect(page).toHaveURL(/\/incidents\?review=evidence$/);
  const confirmation = page.getByLabel("Evidence confirmation");
  await expect(confirmation).toContainText(`Review the staged evidence for ${incidentTitle}.`);

  await page.goBack();
  await expect(page).toHaveURL(/\/incidents$/);
  await expect(confirmation).toHaveCount(0);
  await page.goForward();
  await expect(page).toHaveURL(/\/incidents\?review=evidence$/);
  await expect(confirmation).toContainText(`Review the staged evidence for ${incidentTitle}.`);
});

test.fixme("CA05 @finding Back and Forward need entry-owned URL scroll focus and route state", async () => {
  // S10 retains the executable reproduction for askrjs/askr#365; no app shim is allowed.
});
