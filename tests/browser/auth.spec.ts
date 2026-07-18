import { expect, test } from "@playwright/test";

test("should complete self-service authentication given a new operator", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/signup");
  await page.getByLabel("Email").fill("browser.operator@example.test");
  await page.getByLabel("Password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/logs$/);
  await page.reload();
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await expect(page.getByText("browser.operator", { exact: true }).first()).toBeVisible();
  await page.getByRole("menuitem", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByLabel("Display name").fill("Browser Operator");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByLabel("Display name")).toHaveValue("Browser Operator");
  await page.reload();
  await expect(page.getByLabel("Display name")).toHaveValue("Browser Operator");
  await page.goto("/logout");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/logs");
  await expect(page).toHaveURL(/\/login\?next=%2Flogs$/);
  await page.getByLabel("Email").fill("browser.operator@example.test");
  await page.getByLabel("Password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/logs$/);
  expect(errors).toEqual([]);
});
