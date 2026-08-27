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

test("CA01 should not commit an aborted Metrics preload after rapid navigation", async ({ page }) => {
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

test.fixme(
  "CA02 @finding deferred route data needs a natural independently recoverable nested boundary",
  async () => {
    // Retained as a capability finding until the Metrics sections are split into independent queries.
  },
);

test.fixme(
  "CA04 @finding incident evidence handoff needs public location state",
  async () => {
    // askrjs/askr#361 remains open; Destroyer intentionally has no out-of-band state stash.
  },
);

test.fixme(
  "CA05 @finding Back and Forward need entry-owned URL scroll focus and route state",
  async () => {
    // S10 retains the executable reproduction for askrjs/askr#365; no app shim is allowed.
  },
);
