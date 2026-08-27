import { expect, test, type Page } from "@playwright/test";

async function createOperator(page: Page, email: string): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/logs$/);
}

async function chooseSelectOption(page: Page, label: string, option: string): Promise<void> {
  await page.getByLabel(label).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test("should complete persisted product workflows given an authenticated operator", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await createOperator(page, "product.flows@example.test");

  await page.goto("/settings/workspace");
  await chooseSelectOption(page, "Default role", "Member");
  await chooseSelectOption(page, "Approval policy", "Automatic approval");
  await page.getByRole("button", { name: "Save workspace" }).click();
  await expect(page.getByLabel("Default role")).toHaveText("Member");
  await expect(page.getByLabel("Approval policy")).toHaveText("Automatic approval");

  const invite = await page.getByLabel("Active invite link").inputValue();
  await page.getByRole("button", { name: "Open invite actions" }).click();
  await page.getByRole("menuitem", { name: "Reset active link" }).click();
  await page.getByRole("button", { name: "Reset active link" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Active invite link")).not.toHaveValue(invite);

  await page.goto("/settings/billing");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download sample" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("destroyer-sample-invoice.csv");
  expect(await download.createReadStream()).not.toBeNull();

  await page.goto("/contact");
  await page.getByLabel("Email").fill("product.flows@example.test");
  await page.getByLabel("Subject").fill("Browser support request");
  await page
    .getByLabel("Message")
    .fill("The browser flow persists this request and displays its receipt.");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("status")).toContainText("Support request received");
  await expect(page.getByRole("status")).toContainText("Receipt");

  expect(errors).toEqual([]);
});

test("should filter and inspect the release surface given Home controls", async ({ page }) => {
  await createOperator(page, "home.controls@example.test");
  await page.goto("/");
  await page.getByLabel("Search components").fill("lucide");
  await expect(page.getByRole("cell", { name: "@askrjs/lucide" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "@askrjs/themes" })).toHaveCount(0);
  await page.getByRole("link", { name: "Inspect logs" }).click();
  await expect(page).toHaveURL(/\/logs$/);
  await expect(page.getByRole("heading", { name: "Logs" })).toBeVisible();
});

test("should poll live operations without runtime errors given an active logs route", async ({
  page,
}) => {
  const errors: string[] = [];
  let logResponses = 0;
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (new URL(response.url()).pathname === "/api/operations/logs" && response.ok()) {
      logResponses += 1;
    }
  });
  await createOperator(page, "live.polling@example.test");
  await expect(page.getByLabel("Recent log stream")).toBeVisible();
  const resume = page.getByRole("button", { name: "Resume live stream" });
  const pause = page.getByRole("button", { name: "Pause live stream" });
  if (await pause.isVisible()) await pause.click();
  await expect(resume).toBeVisible();
  await resume.click();
  await expect.poll(() => logResponses, { timeout: 5_000 }).toBeGreaterThanOrEqual(2);
  expect(errors).toEqual([]);
});

test("S06 @finding ASKR-DESTROYER-002 should keep extreme log details operable at a 320px mobile viewport", async ({
  page,
}) => {
  test.info().annotations.push({
    type: "finding",
    description:
      "Input: a deterministic multiline log with long service, route, and request identifiers at 320x568. Expected: the virtual row and detail popover remain within the viewport. Observed: Block flex ancestors retain min-inline-size:auto and the virtual row reaches 2312px scroll width, producing document overflow. Owning package: @askrjs/themes Block layout, tracked by askrjs/askr-themes#133. Artifacts: Playwright HTML report, trace, and error-context snapshot.",
  });
  await page.setViewportSize({ width: 320, height: 568 });
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await createOperator(page, "mobile.logs@example.test");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false);

  await page.getByRole("button", { name: "View details for evt-10000" }).click();
  const details = page.getByRole("dialog", { name: "Log event details" });
  await expect(details).toBeVisible();
  await expect(details).toContainText("webhook-delivery-gateway-us-east-1");
  await expect(details).toContainText("req_01JHPA5TG00000000000000000_delivery_attempt_0000042");
  await expect(details).toContainText("retry-pending");

  const geometry = await details.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  expect(geometry.documentOverflow).toBe(false);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
  await page.keyboard.press("Escape");
  await expect(details).toHaveCount(0);
  await expect(page.getByRole("button", { name: "View details for evt-10000" })).toBeFocused();
  expect(errors).toEqual([]);
});
