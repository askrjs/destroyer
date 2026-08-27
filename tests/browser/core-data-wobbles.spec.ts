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

async function arm(page: Page, operation: string, mode: string): Promise<void> {
  expect(
    await page.evaluate(
      async ({ controlledOperation, controlledMode }) =>
        (
          await fetch("/api/__test/control/arm", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ operation: controlledOperation, mode: controlledMode }),
          })
        ).status,
      { controlledOperation: operation, controlledMode: mode },
    ),
  ).toBe(200);
}

test("CB01 should publish one refreshed summary value to every mounted reader", async ({
  page,
  principalEmail,
}) => {
  await createOperator(page, principalEmail);
  await page.goto("/metrics");
  const badge = page.getByLabel("Healthy service count");
  const summary = page
    .getByRole("heading", { name: "Service summary" })
    .locator('xpath=ancestor::*[@data-slot="card"]');
  await expect(badge).toHaveText("18 healthy");
  await expect(summary).toContainText("18 healthy services");

  await arm(page, "operations.summary", "empty-next");
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/operations/summary" && response.status() === 200,
  );
  await summary.getByRole("button", { name: "Refresh summary" }).click();
  const response = (await (await responsePromise).json()) as { healthyServices: number };
  expect(response.healthyServices).toBe(0);
  await expect(summary).toContainText("0 healthy services");
  await expect(badge).toHaveText("0 healthy");
});

test.fixme("CB02 @finding cursor collections need a natural query-collection migration", async () => {
  // Logs currently owns explicit cursor state; claiming cache-eviction identity would be simulated.
});

test.fixme("CB05 @finding plain component rendering needs an isolated DataRuntime", async () => {
  // askrjs/askr#362 remains open; Destroyer never clears default-runtime internals.
});
