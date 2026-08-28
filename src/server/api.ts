import { requirePermission, requireUser } from "@askrjs/auth";
import { schema } from "@askrjs/schema";
import type { AskrAppApi } from "@askrjs/server/askr";
import { security } from "@askrjs/server/openapi";
import type { AppDependencies } from "./contracts";
import { RepositoryConflictError } from "./contracts";
import { clientAddress } from "./client-address";
import type { ScenarioMode, ScenarioOperation } from "./scenario-controller";

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
      approverGroup: schema.string(),
      timezone: schema.enum(["America/New_York", "America/Los_Angeles", "Europe/Dublin"]),
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
  const Incident = api.schema(
    "IncidentRecord",
    schema.object({
      id: schema.string(),
      title: schema.string(),
      status: schema.enum(["investigating", "acknowledged", "resolved"]),
      severity: schema.enum(["low", "medium", "high"]),
      service: schema.string(),
      version: schema.integer(),
      createdAt: schema.string(),
      updatedAt: schema.string(),
    }),
  );

  api
    .get("/health", (ctx) => ctx.ok({ ok: true, requestId: ctx.state.requestId }))
    .operationId("getHealth")
    .summary("Get application health")
    .tags("System")
    .ok(schema.object({ ok: schema.boolean(), requestId: schema.optional(schema.string()) }));
  api
    .get("/settings", async (ctx, deps) => {
      if (ctx.auth.principal) {
        const mode = await deps.scenarios.before(ctx.auth.principal.id, "settings.read");
        if (mode === "empty-next") return ctx.notFound("Operator settings were not found");
      }
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
    .delete("/account", {
      input: {
        body: {
          schema: schema.object({
            confirmation: schema.string({ minLength: 3, maxLength: 254 }),
          }),
          mediaTypes: ["application/json"],
        },
      },
      documentation: { body: { required: true } },
      async handler(ctx, input, deps) {
        const deleted = await deps.accounts.delete(
          ctx.auth.principal?.id ?? "",
          input.body.confirmation,
        );
        if (!deleted) return ctx.unprocessableEntity("Type the account email to confirm deletion.");
        return ctx.clearCookie(ctx.noContent(), "destroyer-session", {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        });
      },
    })
    .operationId("deleteAccount")
    .summary("Delete the authenticated account")
    .tags("Account")
    .access(requireUser(), security.require("cookieSession"))
    .noContent()
    .unprocessableEntity();
  api
    .get("/operations/summary", async (ctx, deps) => {
      const mode = await deps.scenarios.before(ctx.auth.principal?.id ?? "", "operations.summary");
      return ctx.ok(
        mode === "empty-next"
          ? { healthyServices: 0, degradedServices: 0, openIncidents: 0, activeOperators: 0 }
          : await deps.operations.summary(),
      );
    })
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
          const mode = await deps.scenarios.before(ctx.auth.principal?.id ?? "", "operations.logs");
          if (mode === "empty-next") return ctx.ok({ entries: [], nextCursor: null, sequence: 0 });
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
    .get("/operations/metrics", async (ctx, deps) => {
      const mode = await deps.scenarios.before(ctx.auth.principal?.id ?? "", "operations.metrics");
      return ctx.ok(
        mode === "empty-next"
          ? {
              requests: 0,
              p95LatencyMs: 0,
              errorRate: 0,
              latencyBands: [],
              routeWorkload: [],
              serviceMix: [],
              reliability: [],
            }
          : await deps.operations.metrics(),
      );
    })
    .operationId("getOperationsMetrics")
    .summary("Get chart-ready operational metrics")
    .tags("Operations")
    .access(...protectedRead)
    .ok(Metrics)
    .forbidden();
  api
    .get("/operations/incidents", async (ctx, deps) => {
      const mode = await deps.scenarios.before(ctx.auth.principal?.id ?? "", "incidents.read");
      return ctx.ok(mode === "empty-next" ? [] : await deps.operations.incidents());
    })
    .operationId("listIncidents")
    .summary("List operational incidents")
    .tags("Operations")
    .access(...protectedRead)
    .ok(schema.array(Incident))
    .forbidden();
  api
    .post("/operations/incidents/{id}", {
      input: {
        params: schema.object({ id: schema.string() }),
        body: {
          schema: schema.object({
            status: schema.enum(["acknowledged", "resolved"]),
            version: schema.integer({ minimum: 1 }),
          }),
          mediaTypes: ["application/json"],
        },
      },
      documentation: { params: { id: {} }, body: { required: true } },
      async handler(ctx, input, deps) {
        await deps.scenarios.before(ctx.auth.principal?.id ?? "", "incidents.mutate");
        const result = await deps.operations.updateIncident(
          input.params.id,
          input.body.status,
          input.body.version,
        );
        return result.kind === "conflict"
          ? ctx.conflict("Incident changed in another session.")
          : ctx.ok(result.value);
      },
    })
    .operationId("updateIncident")
    .summary("Acknowledge or resolve an incident")
    .tags("Operations")
    .access(requirePermission("operations:write"), security.require("cookieSession"))
    .ok(Incident)
    .conflict()
    .forbidden();

  if (process.env.NODE_ENV === "test") {
    const operations = schema.enum([
      "settings.read",
      "settings.update",
      "settings.reset-invite",
      "operations.summary",
      "operations.logs",
      "operations.metrics",
      "incidents.read",
      "incidents.mutate",
    ]);
    api
      .post("/__test/control/arm", {
        input: {
          body: {
            schema: schema.object({
              operation: operations,
              mode: schema.enum(["fail-next", "hold-next", "empty-next"]),
            }),
            mediaTypes: ["application/json"],
          },
        },
        documentation: { body: { required: true } },
        handler(ctx, input, deps) {
          deps.scenarios.arm(
            ctx.auth.principal?.id ?? "",
            input.body.operation as ScenarioOperation,
            input.body.mode as ScenarioMode,
          );
          return ctx.ok({ armed: true });
        },
      })
      .access(requireUser(), security.require("cookieSession"))
      .ok(schema.object({ armed: schema.boolean() }));
    api
      .get("/__test/control/state", (ctx, deps) =>
        ctx.ok({ controls: deps.scenarios.state(ctx.auth.principal?.id ?? "") }),
      )
      .access(requireUser(), security.require("cookieSession"))
      .ok(
        schema.object({
          controls: schema.array(
            schema.object({
              operation: schema.string(),
              mode: schema.string(),
              blocked: schema.boolean(),
            }),
          ),
        }),
      );
    api
      .post("/__test/control/release", {
        input: {
          body: {
            schema: schema.object({ operation: operations }),
            mediaTypes: ["application/json"],
          },
        },
        documentation: { body: { required: true } },
        handler(ctx, input, deps) {
          return ctx.ok({
            released: deps.scenarios.release(
              ctx.auth.principal?.id ?? "",
              input.body.operation as ScenarioOperation,
            ),
          });
        },
      })
      .access(requireUser(), security.require("cookieSession"))
      .ok(schema.object({ released: schema.boolean() }));
    api
      .post("/__test/control/reset", (ctx, deps) => {
        deps.scenarios.reset(ctx.auth.principal?.id ?? "");
        return ctx.ok({ reset: true });
      })
      .access(requireUser(), security.require("cookieSession"))
      .ok(schema.object({ reset: schema.boolean() }));
    api
      .post("/__test/logs/insert", {
        input: {
          body: {
            schema: schema.object({
              id: schema.string(),
              message: schema.string(),
              route: schema.string(),
              requestId: schema.string(),
            }),
            mediaTypes: ["application/json"],
          },
        },
        documentation: { body: { required: true } },
        async handler(ctx, input, deps) {
          return ctx.ok(await deps.operations.insertLogFixture(input.body));
        },
      })
      .access(requireUser(), security.require("cookieSession"))
      .ok(LogEntry);
    api
      .post("/__test/session/expire", (ctx) =>
        ctx.clearCookie(ctx.noContent(), "destroyer-session", {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      )
      .access(requireUser(), security.require("cookieSession"))
      .noContent();
  }
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
        const address = clientAddress(ctx.headers);
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
