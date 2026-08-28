import {
  expect,
  test as base,
  type BrowserContext,
  type Page,
  type Request,
  type TestInfo,
} from "@playwright/test";

export interface BrowserEvidence {
  allowedConsoleErrors: string[];
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  pendingAtTeardown: string[];
  unexpectedResponses: string[];
}

interface ScenarioFixtures {
  evidence: BrowserEvidence;
  principalEmail: string;
}

const expectedFailureStatuses = new Set([400, 401, 403, 404, 409, 422, 429, 500]);
const expectedResourceConsoleError =
  /^Failed to load resource: the server responded with a status of (400|401|403|404|409|422|429|500) \(.+\)$/u;

function stableSlug(testInfo: TestInfo): string {
  return testInfo.titlePath
    .join("-")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "")
    .slice(0, 48);
}

export async function waitForHydration(page: Page): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-theme-choice", /^(dark|light|system)$/);
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
        allowedConsoleErrors: [],
        consoleErrors: [],
        pageErrors: [],
        failedRequests: [],
        pendingAtTeardown: [],
        unexpectedResponses: [],
      };
      const pending = new Set<Request>();
      let tearingDown = false;
      const pendingRequests = () =>
        [...pending].map((request) => `${request.method()} ${request.url()}`).sort();
      const observe = (observedPage: Page) => {
        observedPage.on("console", (message) => {
          if (message.type() === "error" && !expectedResourceConsoleError.test(message.text()))
            evidence.consoleErrors.push(message.text());
        });
        observedPage.on("pageerror", (error) => evidence.pageErrors.push(error.message));
        observedPage.on("framenavigated", (frame) => {
          if (frame !== observedPage.mainFrame()) return;
          for (const request of pending) {
            if (request.frame() === frame) pending.delete(request);
          }
        });
      };
      context.on("request", (request) => {
        if (request.resourceType() === "fetch" || request.resourceType() === "xhr")
          pending.add(request);
      });
      context.on("requestfinished", (request) => {
        if (request.resourceType() === "fetch" || request.resourceType() === "xhr")
          pending.delete(request);
      });
      context.on("requestfailed", (request) => {
        const key = `${request.method()} ${request.url()}`;
        pending.delete(request);
        if (!tearingDown)
          evidence.failedRequests.push(`${key}: ${request.failure()?.errorText ?? "failed"}`);
      });
      context.on("response", (response) => {
        if (response.status() >= 400 && !expectedFailureStatuses.has(response.status()))
          evidence.unexpectedResponses.push(`${response.status()} ${response.url()}`);
      });
      observe(page);
      context.on("page", observe);
      await use(evidence);
      await resetControls(context);
      const openPages = context.pages().filter((openPage) => !openPage.isClosed());
      for (const openPage of openPages) {
        await openPage.keyboard.press("Escape");
        expect(
          await openPage
            .locator(
              '[role="dialog"]:visible, [role="alertdialog"]:visible, [role="menu"]:visible, [role="listbox"]:visible',
            )
            .count(),
        ).toBe(0);
      }
      evidence.pendingAtTeardown = pendingRequests();
      tearingDown = true;
      await Promise.all(openPages.map((openPage) => openPage.goto("about:blank")));
      await context.close();
      await expect.poll(pendingRequests, { timeout: 2_000 }).toEqual([]);
      await testInfo.attach("browser-evidence", {
        body: JSON.stringify(evidence, null, 2),
        contentType: "application/json",
      });
      expect(
        evidence.consoleErrors.filter(
          (message) => !evidence.allowedConsoleErrors.includes(message),
        ),
      ).toEqual([]);
      expect(evidence.pageErrors).toEqual([]);
      expect(evidence.unexpectedResponses).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
