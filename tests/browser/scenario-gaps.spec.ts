import { expect, test, type Page } from "@playwright/test";

const password = "correct horse battery staple";

async function createOperator(page: Page, email: string): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/logs$/);
}

test.fixme(
  "S01 @finding dirty Workspace navigation requires a public navigation-blocking contract",
  async () => {
    // Destroyer has no public Askr navigation-blocking API to compose this without patching internals.
  },
);

test.fixme(
  "S19 @finding virtualized incident operations require published variable-height collection support",
  async () => {
    // The natural incident surface uses cards; simulated virtualization would be dishonest coverage.
  },
);

test.fixme(
  "S23 @finding independent Metrics sections require three independently addressable published queries",
  async () => {
    // The current route exposes one aggregate query, so child failures cannot be isolated honestly.
  },
);

test("S32 should ignore a reverse-order stale notification response", async ({ page }) => {
  await createOperator(page, "notification.stale@example.test");
  await page.goto("/settings/notifications");
  const toggle = page.getByRole("switch", { name: "In-app notifications" });
  await page.evaluate(async () => {
    await fetch("/api/__test/control/arm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operation: "settings.update", mode: "hold-next" }),
    });
  });
  await toggle.click();
  await expect.poll(() => page.evaluate(async () => (await fetch("/api/__test/control/state")).text())).toContain('"blocked":true');
  await toggle.click();
  await expect(toggle).toBeChecked();
  await page.evaluate(async () => {
    await fetch("/api/__test/control/release", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operation: "settings.update" }),
    });
  });
  await expect.poll(() => page.evaluate(async () => {
    const response = await fetch("/api/settings");
    return ((await response.json()) as { inAppNotifications: boolean }).inAppNotifications;
  })).toBe(true);
  await expect(toggle).toBeChecked();
});
