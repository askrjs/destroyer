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

async function arm(page: Page, operation: string, mode: string): Promise<void> {
  const response = await api(page, "/api/__test/control/arm", {
    method: "POST",
    body: { operation, mode },
  });
  expect(response.status).toBe(200);
}

async function api(
  page: Page,
  path: string,
  input: { method?: string; body?: unknown } = {},
): Promise<{ status: number; body: unknown }> {
  return page.evaluate(
    async ({ requestPath, method, body }) => {
      const response = await fetch(
        requestPath,
        body === undefined
          ? { method, credentials: "same-origin" }
          : {
              method,
              credentials: "same-origin",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(body),
            },
      );
      return {
        status: response.status,
        body: response.status === 204 ? null : await response.json(),
      };
    },
    { requestPath: path, method: input.method ?? "GET", body: input.body },
  );
}

test.afterEach(async ({ page }) => {
  if ((await api(page, "/api/__test/control/state")).status === 200)
    await api(page, "/api/__test/control/reset", { method: "POST" });
});

test("S03 should preserve Workspace input and retry exactly once after a pre-mutation failure", async ({
  page,
}) => {
  await createOperator(page, "workspace.retry@example.test");
  await page.goto("/settings/workspace");
  await choose(page, "Default role", "Member");
  await arm(page, "settings.update", "fail-next");

  await page.getByRole("button", { name: "Save workspace" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Default role")).toHaveText("Member");
  const beforeRetry = await api(page, "/api/settings");
  expect(beforeRetry.body).toMatchObject({ version: 1 });

  await page.getByRole("button", { name: "Save workspace" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect
    .poll(async () => {
      return (await api(page, "/api/settings")).body;
    })
    .toMatchObject({ defaultRole: "member", version: 2 });
});

test("S02 should expose a two-page optimistic conflict without clearing stale local input", async ({
  page,
  context,
}) => {
  await createOperator(page, "workspace.conflict@example.test");
  const stalePage = await context.newPage();
  await page.goto("/settings/workspace");
  await stalePage.goto("/settings/workspace");

  await choose(page, "Default role", "Member");
  await page.getByRole("button", { name: "Save workspace" }).click();
  await expect
    .poll(async () => ((await api(page, "/api/settings")).body as { version: number }).version)
    .toBe(2);

  await choose(stalePage, "Approval policy", "Automatic approval");
  await stalePage.getByRole("button", { name: "Save workspace" }).click();
  await expect(stalePage.getByRole("alert")).toContainText("another session");
  await expect(stalePage.getByLabel("Approval policy")).toHaveText("Automatic approval");
  const persisted = await api(page, "/api/settings");
  expect(persisted.body).toMatchObject({
    defaultRole: "member",
    approvalPolicy: "manual",
    version: 2,
  });
  await stalePage.close();
});

test("S04 should commit a held Workspace save after route teardown without stale UI updates", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await createOperator(page, "workspace.held@example.test");
  await page.goto("/settings/workspace");
  await choose(page, "Default role", "Member");
  await arm(page, "settings.update", "hold-next");
  await page.getByRole("button", { name: "Save workspace" }).click();
  await expect
    .poll(async () => {
      return (await api(page, "/api/__test/control/state")).body;
    })
    .toMatchObject({ controls: [{ blocked: true }] });

  await page.goto("/logs");
  await expect(page.getByRole("heading", { name: "Logs" })).toBeVisible();
  expect(
    (
      await api(page, "/api/__test/control/release", {
        method: "POST",
        body: { operation: "settings.update" },
      })
    ).status,
  ).toBe(200);
  await expect
    .poll(
      async () => ((await api(page, "/api/settings")).body as { defaultRole: string }).defaultRole,
    )
    .toBe("member");
  await page.goto("/settings/workspace");
  await expect(page.getByLabel("Default role")).toHaveText("Member");
  expect(errors).toEqual([]);
});

test("S05 @finding ASKR-DESTROYER-003 should unwind invite actions through Escape, cancel, and confirm with trigger focus", async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({
    type: "finding",
    description:
      "Input: transition from a DropdownMenu item to a controlled AlertDialog without a persistent dialog trigger. Expected: Escape, cancel, and confirm restore focus to the actions trigger. Observed: the dialog closes but focus becomes inactive, and the public DialogContent contract has no close-auto-focus hook. Owning package: @askrjs/ui dialog focus restoration API, tracked by askrjs/askr-ui#113. Artifacts: Playwright HTML report, trace, and error-context snapshot.",
  });
  await createOperator(page, `workspace.overlays.${testInfo.repeatEachIndex}@example.test`);
  await page.goto("/settings/workspace");
  const trigger = page.getByRole("button", { name: "Open invite actions" });

  await trigger.click();
  await page.getByRole("menuitem", { name: "Reset active link" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.getByRole("menuitem", { name: "Reset active link" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(trigger).toBeFocused();

  const invite = await page.getByLabel("Active invite link").inputValue();
  await trigger.click();
  await page.getByRole("menuitem", { name: "Reset active link" }).click();
  await page.getByRole("button", { name: "Reset active link" }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByLabel("Active invite link")).not.toHaveValue(invite);
});
