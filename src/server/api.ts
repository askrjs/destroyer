import { requirePermission, requireUser } from "@askrjs/auth";
import { schema } from "@askrjs/schema";
import { security } from "@askrjs/server/openapi";
import type { AskrAppApi } from "@askrjs/server/askr";
import type { AppDependencies } from "./dependencies";

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
  const AuditEntry = api.schema(
    "AuditEntry",
    schema.object({
      id: schema.string(),
      level: schema.enum(["info", "warning", "error"]),
      service: schema.string(),
      message: schema.string(),
      timestamp: schema.string(),
    }),
  );
  const ContactInput = schema.object({
    email: schema.email(),
    subject: schema.string({ minLength: 3 }),
    message: schema.string({ minLength: 10 }),
  });
  const ContactReceipt = api.schema(
    "ContactReceipt",
    schema.object({ id: schema.uuid(), receivedAt: schema.string() }),
  );
  const OperatorProfile = api.schema(
    "OperatorProfile",
    schema.object({ displayName: schema.string(), version: schema.integer({ minimum: 1 }) }),
  );

  api
    .get("/profile", async (ctx, deps) => {
      const profile = ctx.auth.principal ? await deps.profiles.get(ctx.auth.principal.id) : null;
      return profile ? ctx.ok(profile) : ctx.notFound("Profile settings were not found");
    })
    .operationId("getOperatorProfile")
    .summary("Get the authenticated operator profile")
    .tags("Profile")
    .access(requireUser(), security.require("cookieSession"))
    .ok(OperatorProfile)
    .notFound();
  api
    .get("/health", (ctx) => ctx.ok({ ok: true, requestId: ctx.state.requestId }))
    .operationId("getHealth")
    .summary("Get application health")
    .tags("System")
    .ok(schema.object({ ok: schema.boolean(), requestId: schema.optional(schema.string()) }));
  api
    .get("/operations/summary", async (ctx, deps) => ctx.ok(await deps.operations.summary()))
    .operationId("getOperationsSummary")
    .summary("Get the operational summary")
    .tags("Operations")
    .access(requirePermission("operations:read"), security.require("cookieSession"))
    .ok(Summary)
    .forbidden();
  api
    .get("/operations/logs", async (ctx, deps) => ctx.ok(await deps.operations.logs(100)))
    .operationId("listOperationLogs")
    .summary("List recent operation logs")
    .tags("Operations")
    .access(requirePermission("operations:read"), security.require("cookieSession"))
    .ok(schema.array(AuditEntry))
    .forbidden();
  api
    .post("/contact", {
      input: { body: { schema: ContactInput, mediaTypes: ["application/json"] } },
      documentation: { body: { required: true } },
      async handler(ctx, input, deps) {
        return ctx.created(await deps.contacts.create(input.body));
      },
    })
    .operationId("createContactRequest")
    .summary("Create a support contact request")
    .tags("Support")
    .created(ContactReceipt)
    .badRequest()
    .unprocessableEntity()
    .tooManyRequests();
}
