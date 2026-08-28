import {
  expect,
  test as base,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";

export interface BrowserEvidence {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  unexpectedResponses: string[];
}

interface ScenarioFixtures {
  evidence: BrowserEvidence;
  principalEmail: string;
}

const expectedFailureStatuses = new Set([400, 401, 403, 404, 409, 422, 429, 500]);

function stableSlug(testInfo: TestInfo): string {
  return testInfo.titlePath
    .join("-")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "")
    .slice(0, 48);
}

async function resetControls(context: BrowserContext): Promise<void> {
  const response = await context.request.post("/api/__test/control/reset");
  if (response.status() !== 200 && response.status() !== 204 && response.status() !== 401)
    throw new Error(`Scenario reset failed (${response.status()}).`);
}

export const test = base.extend<ScenarioFixtures>({
  principalEmail: async ({ context: _context }, use, testInfo) => {
    await use(
      `${stableSlug(testInfo)}-${testInfo.workerIndex}-${testInfo.repeatEachIndex}-${testInfo.retry}@example.test`,
    );
  },
  evidence: [
    async ({ context, page }, use, testInfo) => {
      const evidence: BrowserEvidence = {
        consoleErrors: [],
        pageErrors: [],
        failedRequests: [],
        unexpectedResponses: [],
      };
      const pending = new Set<string>();
      context.on("close", () => pending.clear());
      const observe = (observedPage: Page) => {
        observedPage.on("console", (message) => {
          if (message.type() === "error") evidence.consoleErrors.push(message.text());
        });
        observedPage.on("pageerror", (error) => evidence.pageErrors.push(error.message));
        observedPage.on("request", (request) => {
          if (request.resourceType() === "fetch" || request.resourceType() === "xhr")
            pending.add(`${request.method()} ${request.url()}`);
        });
        observedPage.on("requestfinished", (request) => {
          if (request.resourceType() === "fetch" || request.resourceType() === "xhr")
            pending.delete(`${request.method()} ${request.url()}`);
        });
        observedPage.on("requestfailed", (request) => {
          const key = `${request.method()} ${request.url()}`;
          pending.delete(key);
          evidence.failedRequests.push(`${key}: ${request.failure()?.errorText ?? "failed"}`);
        });
        observedPage.on("response", (response) => {
          if (response.status() >= 400 && !expectedFailureStatuses.has(response.status()))
            evidence.unexpectedResponses.push(`${response.status()} ${response.url()}`);
        });
      };
      observe(page);
      context.on("page", observe);
      await use(evidence);
      const controlPage = page.isClosed() ? context.pages()[0] : page;
      await resetControls(context);
      if (controlPage && !controlPage.isClosed()) {
        await controlPage.keyboard.press("Escape");
        expect(
          await controlPage
            .locator(
              '[role="dialog"]:visible, [role="alertdialog"]:visible, [role="menu"]:visible, [role="listbox"]:visible',
            )
            .count(),
        ).toBe(0);
      }
      await context.close();
      await expect.poll(() => pending.size, { timeout: 2_000 }).toBe(0);
      await testInfo.attach("browser-evidence", {
        body: JSON.stringify(evidence, null, 2),
        contentType: "application/json",
      });
    },
    { auto: true },
  ],
});

export { expect };
