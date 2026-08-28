import { expect, test as setup } from "@playwright/test";

setup("stable visual operator", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill("visual.operator@example.test");
  await page.getByLabel("Password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/logs$/);
  await page.context().storageState({ path: "artifacts/visual-auth.json" });
});
