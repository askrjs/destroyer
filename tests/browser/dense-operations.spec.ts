import type { Page } from "@playwright/test";
import { expect, test } from "./fixture";

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

test.fixme("S17 should select and bulk acknowledge eligible incidents (askrjs/askr-themes#141)", async ({
  page,
  principalEmail,
}) => {
  await createOperator(page, principalEmail);
  await page.goto("/incidents");
  await page.getByRole("checkbox", { name: "Select Webhook delivery delays" }).click();
  const list = page.getByRole("list", { name: "Operational incidents" });
  await list.evaluate((element) => element.scrollTo({ top: 3 * 280 }));
  await page.getByRole("checkbox", { name: "Select Search indexing lag" }).click();
  await page.getByRole("button", { name: "Acknowledge selected" }).click();
  await expect(page.getByText("Status: acknowledged").first()).toBeVisible();
  await expect(page.getByText("Status: resolved").first()).toBeVisible();
});

test("S18 should expose timeline detail and reject a stale incident resolution", async ({
  page,
  principalEmail,
}) => {
  await createOperator(page, principalEmail);
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

test("S20 should publish the initial cursor and retry log history after a pre-read failure", async ({
  page,
  principalEmail,
}, testInfo) => {
  await createOperator(page, principalEmail);
  await page.goto("/settings");
  const logsPage = await page.context().newPage();
  await logsPage.goto("/settings");
  await post(logsPage, "/api/__test/control/arm", {
    operation: "operations.logs",
    mode: "hold-next",
  });
  await logsPage.getByRole("link", { name: "Logs", exact: true }).click();
  await expect
    .poll(() => page.evaluate(async () => (await fetch("/api/__test/control/state")).text()))
    .toContain('"blocked":true');
  await post(page, "/api/__test/control/release", { operation: "operations.logs" });
  await expect(logsPage).toHaveURL(/\/logs$/);
  await expect(logsPage.getByRole("button", { name: "Load older events" })).toBeVisible();

  await post(logsPage, "/api/__test/control/arm", {
    operation: "operations.logs",
    mode: "fail-next",
  });
  await logsPage.getByRole("button", { name: "Load older events" }).click();
  await expect(logsPage.getByRole("alert")).toContainText("failed (500)");
  await logsPage.getByRole("button", { name: "Load older events" }).click();
  await expect(logsPage.getByText("160", { exact: true })).toBeVisible();
  await expect(logsPage.getByRole("button", { name: "Resume live stream" })).toBeVisible();
  await expect(logsPage.getByRole("alert")).toHaveCount(0);
  const filter = logsPage.getByLabel("Filter log events");
  await filter.fill("evt-9920");
  const olderRow = logsPage
    .getByRole("grid", { name: "Log event details" })
    .getByRole("row")
    .nth(1);
  await expect(olderRow.getByRole("gridcell").first()).toHaveText(/\d{2}:\d{2}:\d{2}/);
  await filter.fill("");
  await expect(logsPage).toHaveURL(/\/logs$/);

  const probe = `History resume boundary probe ${testInfo.repeatEachIndex}`;
  expect(
    await post(logsPage, "/api/__test/logs/insert", {
      id: `evt-history-resume-${testInfo.repeatEachIndex}`,
      message: probe,
      route: "/logs/history-resume",
      requestId: `req_history_resume_${testInfo.repeatEachIndex}`,
    }),
  ).toBe(200);
  await logsPage.getByRole("button", { name: "Resume live stream" }).click();
  const pauseLive = logsPage.getByRole("button", { name: "Pause live stream" });
  await expect(pauseLive).toBeEnabled();
  await expect(logsPage.getByText(probe).first()).toBeVisible();
  await expect(logsPage.getByText("80", { exact: true })).toBeVisible();
  await logsPage.getByRole("grid", { name: "Log event details" }).hover();
  await logsPage.mouse.wheel(0, 200);
  await expect(logsPage.getByRole("button", { name: "Resume live stream" })).toBeVisible();
});

test("S21 @regression should retain virtual-table selection while a deterministic live event is inserted", async ({
  page,
  principalEmail,
}) => {
  // Input: select a stable row, insert a deterministic newer event, then resume the live query.
  // Expected: the 200 response publishes its first entry and the prior keyed selection survives.
  // Observed: the response contains the insertion, but the mounted query retains its old value.
  // Package hypothesis: @askrjs/askr QueryCell loses publication/notification across invalidation and refresh generations.
  // Uncertainty: low; reproduced three times and the exact successful response body was inspected.
  // Artifacts: test-results/dense-operations-*/trace.zip and error-context.md.
  await createOperator(page, principalEmail);
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
  const restoredSelection = page.getByRole("row", {
    name: new RegExp(selectedAction?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") ?? ""),
  });
  await expect(restoredSelection).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("grid", { name: "Log event details" }).locator('[aria-selected="true"]'),
  ).toHaveCount(1);
});

test("S22 should preserve zero, one, and complete-history filter cardinalities and selection", async ({
  page,
  principalEmail,
}) => {
  await createOperator(page, principalEmail);
  await page.getByRole("list", { name: "Recent log stream" }).evaluate((element) => {
    element.scrollTo({ top: 64 });
  });
  await expect(page.getByRole("button", { name: "Resume live stream" })).toBeVisible();
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
  const eventCount = page
    .getByText("Events", { exact: true })
    .locator('xpath=ancestor::*[@data-slot="card"]')
    .locator('[data-slot="stat-value"]');
  await expect.poll(async () => Number(await eventCount.textContent())).toBeGreaterThanOrEqual(420);
  await expect(page.getByRole("status")).toHaveText("All matching history loaded.");
});
