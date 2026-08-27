import { expect, test, type Page } from "@playwright/test";

async function createOperator(page: Page, email: string): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/logs$/);
}

async function post(page: Page, path: string, body: unknown): Promise<number> {
  return page.evaluate(
    async ({ endpoint, value }) =>
      (
        await fetch(endpoint, {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(value),
        })
      ).status,
    { endpoint: path, value: body },
  );
}

test("S17 should select and bulk acknowledge eligible incidents", async ({ page }) => {
  await createOperator(page, "incident.bulk@example.test");
  await page.goto("/incidents");
  await page.getByRole("checkbox", { name: "Select Webhook delivery delays" }).click();
  await page.getByRole("checkbox", { name: "Select Search indexing lag" }).click();
  await page.getByRole("button", { name: "Acknowledge selected" }).click();
  await expect(page.getByText("Status: acknowledged").first()).toBeVisible();
  await expect(page.getByText("Status: resolved")).toBeVisible();
});

test("S18 should expose timeline detail and reject a stale incident resolution", async ({ page }) => {
  await createOperator(page, "incident.conflict@example.test");
  const stale = await page.context().newPage();
  await page.goto("/incidents");
  await stale.goto("/incidents");
  const incidentCard = (target: Page) =>
    target
      .getByRole("heading", { name: "Elevated billing retries" })
      .locator('xpath=ancestor::*[@data-slot="card"]');
  await incidentCard(stale).getByRole("button", { name: "View timeline" }).click();
  await expect(incidentCard(stale).getByText(/version \d+/)).toBeVisible();
  await incidentCard(page).getByRole("button", { name: "Resolve" }).click();
  await incidentCard(stale).getByRole("button", { name: "Resolve" }).click();
  await expect(stale.getByRole("alert")).toContainText("another session");
  await expect(incidentCard(stale).getByText("Status: acknowledged")).toBeVisible();
});

test("S20 should retry cursor-backed log history after a pre-read failure", async ({ page }) => {
  await createOperator(page, "logs.retry@example.test");
  const pause = page.getByRole("button", { name: "Pause live stream" });
  if (await pause.isVisible()) await pause.click();
  await post(page, "/api/__test/control/arm", {
    operation: "operations.logs",
    mode: "fail-next",
  });
  await page.getByRole("button", { name: "Load older events" }).click();
  await expect(page.getByRole("alert")).toContainText("failed (500)");
  await page.getByRole("button", { name: "Load older events" }).click();
  await expect(page.getByText("160", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("S21 @finding ASKR-DESTROYER-007 should retain virtual-table selection while a deterministic live event is inserted", async ({
  page,
}) => {
  // Input: select a stable row, insert a deterministic newer event, then resume the live query.
  // Expected: the 200 response publishes its first entry and the prior keyed selection survives.
  // Observed: the response contains the insertion, but the mounted query retains its old value.
  // Package hypothesis: @askrjs/askr QueryCell loses publication/notification across invalidation and refresh generations.
  // Uncertainty: low; reproduced three times and the exact successful response body was inspected.
  // Artifacts: test-results/dense-operations-*/trace.zip and error-context.md.
  await createOperator(page, "logs.selection@example.test");
  const rows = page.getByRole("grid", { name: "Log event details" }).getByRole("row");
  const selected = rows.nth(2);
  await selected.click();
  const selectedAction = await selected.getByRole("button").getAttribute("aria-label");
  expect(selectedAction).not.toBeNull();
  await expect(selected).toHaveAttribute("aria-selected", "true");
  await post(page, "/api/__test/logs/insert", {
    id: "evt-test-live-selection",
    message: "Deterministic live selection probe",
    route: "/logs/live-selection",
    requestId: "req_live_selection",
  });
  const pause = page.getByRole("button", { name: "Pause live stream" });
  if (await pause.isVisible()) await pause.click();
  await page.getByRole("button", { name: "Resume live stream" }).click();
  await expect(page.getByText("Deterministic live selection probe").first()).toBeVisible();
  const restoredSelection = page
    .getByRole("button", { name: selectedAction ?? "" })
    .locator('xpath=ancestor::*[@role="row"]');
  await expect(restoredSelection).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("grid", { name: "Log event details" }).locator('[aria-selected="true"]'),
  ).toHaveCount(1);
});

test("S22 should preserve zero, one, and complete-history filter cardinalities and selection", async ({ page }) => {
  await createOperator(page, "logs.filter@example.test");
  const pause = page.getByRole("button", { name: "Pause live stream" });
  if (await pause.isVisible()) await pause.click();
  const filter = page.getByLabel("Filter log events");
  await filter.fill("req_00001eef");
  await expect(page.getByRole("grid", { name: "Log event details" }).getByRole("row")).toHaveCount(
    2,
  );
  await filter.fill("no-event-can-match-this-value");
  await expect(page.getByRole("heading", { name: "No matching events" })).toBeVisible();
  await page.getByRole("button", { name: "Clear filter" }).click();
  for (let pageNumber = 0; pageNumber < 5; pageNumber += 1) {
    const load = page.getByRole("button", { name: "Load older events" });
    if ((await load.count()) === 0) break;
    await load.click();
  }
  await expect
    .poll(async () =>
      Number(
        await page
          .getByText(/^42[01]$/)
          .first()
          .textContent(),
      ),
    )
    .toBeGreaterThanOrEqual(420);
  await expect(page.getByRole("status")).toHaveText("All matching history loaded.");
});
