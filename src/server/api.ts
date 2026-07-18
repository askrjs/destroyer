import { requirePermission, requireUser } from "@askrjs/auth";
import { schema } from "@askrjs/schema";
import type { AskrAppApi } from "@askrjs/server/askr";
import { security } from "@askrjs/server/openapi";
import type { AppDependencies } from "./contracts";
import { RepositoryConflictError } from "./contracts";

export function defineOperationsApi(api: AskrAppApi<AppDependencies>) {
  const Summary = api.schema(
    "OperationsSummary",
    schema.object({
      healthyServices: schema.integer(),
      degradedServices: schema.integer(),
      openIncidents: schema.integer(),
      activeOperators: schema.integer(),
    }),
  );
  const LogEntry = api.schema(
    "OperationsLogEntry",
    schema.object({
      id: schema.string(),
      timestamp: schema.string(),
      service: schema.string(),
      route: schema.string(),
      severity: schema.enum(["debug", "info", "warning", "error"]),
      latency: schema.integer(),
      requestId: schema.string(),
      message: schema.string(),
    }),
  );
  const LogPage = api.schema(
    "OperationsLogPage",
    schema.object({
      entries: schema.array(LogEntry),
      nextCursor: schema.nullable(schema.string()),
      sequence: schema.integer(),
    }),
  );
  const Settings = api.schema(
    "OperatorSettings",
    schema.object({
      displayName: schema.string(),
      profileVisibility: schema.enum(["workspace", "private"]),
      sessionTimeoutMinutes: schema.integer(),
      density: schema.enum(["comfortable", "compact"]),
      region: schema.enum(["us-east", "us-west", "eu-west"]),
      theme: schema.enum(["system", "light", "dark"]),
      inAppNotifications: schema.boolean(),
      defaultRole: schema.enum(["viewer", "member"]),
      approvalPolicy: schema.enum(["automatic", "manual"]),
      inviteLink: schema.string(),
      version: schema.integer({ minimum: 1 }),
    }),
  );
  const Activity = api.schema(
    "ActivityEntry",
    schema.object({
      id: schema.string(),
      action: schema.string(),
      target: schema.string(),
      detail: schema.string(),
      occurredAt: schema.string(),
    }),
  );
  const Metrics = api.schema(
    "OperationsMetrics",
    schema.object({
      requests: schema.integer(),
      p95LatencyMs: schema.integer(),
      errorRate: schema.number(),
      latencyBands: schema.array(
        schema.object({ id: schema.string(), label: schema.string(), requests: schema.integer() }),
      ),
      routeWorkload: schema.array(
        schema.object({ id: schema.string(), route: schema.string(), requests: schema.integer() }),
      ),
      serviceMix: schema.array(
        schema.object({ id: schema.string(), service: schema.string(), share: schema.number() }),
      ),
      reliability: schema.array(
        schema.object({
          id: schema.string(),
          observedAt: schema.string(),
          successRate: schema.number(),
        }),
      ),
    }),
  );
  const ContactInput = schema.object({
    email: schema.email(),
    subject: schema.string({ minLength: 3, maxLength: 120 }),
    message: schema.string({ minLength: 10, maxLength: 4_000 }),
  });
  const ContactReceipt = api.schema(
    "ContactReceipt",
    schema.object({ id: schema.uuid(), receivedAt: schema.string() }),
  );
  const protectedRead = [
    requirePermission("operations:read"),
    security.require("cookieSession"),
  ] as const;

  api
    .get("/health", (ctx) => ctx.ok({ ok: true, requestId: ctx.state.requestId }))
    .operationId("getHealth")
    .summary("Get application health")
    .tags("System")
    .ok(schema.object({ ok: schema.boolean(), requestId: schema.optional(schema.string()) }));
  api
    .get("/settings", async (ctx, deps) => {
      const value = ctx.auth.principal ? await deps.settings.get(ctx.auth.principal.id) : null;
      return value ? ctx.ok(value) : ctx.notFound("Operator settings were not found");
    })
    .operationId("getOperatorSettings")
    .summary("Get authenticated operator settings")
    .tags("Settings")
    .access(requireUser(), security.require("cookieSession"))
    .ok(Settings)
    .notFound();
  api
    .get("/activity", async (ctx, deps) =>
      ctx.ok(await deps.settings.activity(ctx.auth.principal?.id ?? "", 50)),
    )
    .operationId("listOperatorActivity")
    .summary("List authenticated operator activity")
    .tags("Settings")
    .access(requireUser(), security.require("cookieSession"))
    .ok(schema.array(Activity));
  api
    .get("/operations/summary", async (ctx, deps) => ctx.ok(await deps.operations.summary()))
    .operationId("getOperationsSummary")
    .summary("Get the operational summary")
    .tags("Operations")
    .access(...protectedRead)
    .ok(Summary)
    .forbidden();
  api
    .get("/operations/logs", {
      input: {
        query: schema.object({
          cursor: schema.optional(schema.string()),
          limit: schema.optional(schema.string({ pattern: "^[1-9][0-9]?$|^100$" })),
          route: schema.optional(schema.string()),
        }),
      },
      documentation: { query: { cursor: {}, limit: {}, route: {} } },
      async handler(ctx, input, deps) {
        try {
          return ctx.ok(
            await deps.operations.logs({
              cursor: input.query.cursor,
              limit: Number(input.query.limit ?? 80),
              route: input.query.route,
            }),
          );
        } catch (error) {
          if (error instanceof RepositoryConflictError) return ctx.badRequest(error.message);
          throw error;
        }
      },
    })
    .operationId("listOperationLogs")
    .summary("List cursor-paged operation logs")
    .tags("Operations")
    .access(...protectedRead)
    .ok(LogPage)
    .badRequest()
    .forbidden();
  api
    .get("/operations/metrics", async (ctx, deps) => ctx.ok(await deps.operations.metrics()))
    .operationId("getOperationsMetrics")
    .summary("Get chart-ready operational metrics")
    .tags("Operations")
    .access(...protectedRead)
    .ok(Metrics)
    .forbidden();
  api
    .get(
      "/invoices/sample",
      async (ctx, deps) =>
        new Response(await deps.invoices.sampleCsv(ctx.auth.principal?.id ?? ""), {
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": 'attachment; filename="destroyer-sample-invoice.csv"',
            "cache-control": "private, no-store",
          },
        }),
    )
    .operationId("downloadSampleInvoice")
    .summary("Download an authenticated sample invoice")
    .tags("Billing")
    .access(requireUser(), security.require("cookieSession"))
    .ok(schema.string());
  api
    .post("/contact", {
      input: { body: { schema: ContactInput, mediaTypes: ["application/json"] } },
      documentation: { body: { required: true } },
      async handler(ctx, input, deps) {
        const address = ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
        const limit = await deps.rateLimits.consume(
          `contact:${address}:${input.body.email.toLowerCase()}`,
          3,
          60 * 60_000,
        );
        if (!limit.allowed) return ctx.tooManyRequests("Contact request rate limit exceeded.");
        return ctx.created(await deps.contacts.create(input.body));
      },
    })
    .operationId("createContactRequest")
    .summary("Create a persisted support contact request")
    .tags("Support")
    .created(ContactReceipt)
    .unprocessableEntity()
    .tooManyRequests();
}
