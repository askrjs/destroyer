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

async function signOut(page: Page): Promise<void> {
  await page.goto("/logout");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

test("S29 should complete account setup using only the keyboard", async ({ page }) => {
  await page.goto("/signup");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
  await page.keyboard.type("keyboard.setup@example.test");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password")).toBeFocused();
  await page.keyboard.type(password);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Create account" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/logs$/);
  await expect(page.getByRole("heading", { name: "Logs" })).toBeVisible();
});

test("S30 should suppress duplicate account submissions and create exactly one login", async ({
  page,
}) => {
  const email = "duplicate.signup@example.test";
  let registrations = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/auth/v1/accounts") {
      registrations += 1;
    }
  });
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page).toHaveURL(/\/logs$/);
  expect(registrations).toBe(1);
  await signOut(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/logs$/);
});

test("should preserve a protected destination through failed-login recovery", async ({ page }) => {
  const email = "login.destination@example.test";
  await createOperator(page, email);
  await signOut(page);
  await page.goto("/incidents");
  await expect(page).toHaveURL(/\/login\?next=%2Fincidents$/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("incorrect password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await expect(page).toHaveURL(/\/login\?next=%2Fincidents$/);
  await expect(page.getByLabel("Email")).toHaveValue(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/incidents$/);
});

test("should redirect an authenticated visitor through the real routed commit path", async ({
  page,
  principalEmail,
}) => {
  await createOperator(page, principalEmail);

  await page.goto("/login");

  await expect(page).toHaveURL(/\/logs$/);
  await expect(page.getByRole("heading", { name: "Logs", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in to your workspace" })).toHaveCount(0);
});

test("should preserve login input offline and retry after reconnect", async ({ page, context }) => {
  const email = "login.offline@example.test";
  await createOperator(page, email);
  await signOut(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText(/Failed to fetch/i)).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue(email);
  await expect(page.getByLabel("Password")).toHaveValue(password);
  await context.setOffline(false);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/logs$/);
});

test("should deny Back navigation to protected state after account deletion", async ({ page }) => {
  const email = "delete.history@example.test";
  await createOperator(page, email);
  await page.goto("/settings/security");
  await page.getByLabel("Type your email to confirm").fill(email);
  await page.getByRole("button", { name: "Delete account" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/login\?next=%2Fsettings%2Fsecurity$/);
  await expect(page.getByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => cookie.name === "destroyer-session")).toBe(false);
});
