import { createAuth } from "@askrjs/auth";
import type { JwtIssuer } from "@askrjs/auth/jwt";
import { AuthRouteError, safeRedirect } from "@askrjs/server/auth";
import type { Schema } from "@askrjs/schema";
import { createAskrApp } from "@askrjs/server/askr";
import { accessLog, rateLimit, requestId, securityHeaders } from "@askrjs/server/middleware";
import { security } from "@askrjs/server/openapi";
import { pageRegistry } from "../pages/_routes";
import { defineOperationsApi } from "./api";
import type { AppDependencies } from "./dependencies";
import { SESSION_COOKIE } from "./dependencies";
import { createQueryRegistry } from "./queries";
import { profileActionHandlers } from "./actions";

export function createApp(deps: AppDependencies, issuer: JwtIssuer) {
  const principalSchema: Schema = {
    jsonSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        roles: { type: "array", items: { type: "string" } },
        permissions: { type: "array", items: { type: "string" } },
      },
    },
    safeParse: (data) => ({ success: true, data }),
  };
  const redirect = safeRedirect("/logs");
  return createAskrApp({
    name: "Destroyer",
    version: "0.1.0",
    dependencies: deps,
    pages: pageRegistry,
    queryRegistry: createQueryRegistry(deps),
    actions: {
      handlers: profileActionHandlers,
      csrf: { sessionId: (context) => context.auth.principal?.id },
    },
    api: {
      prefix: "/api",
      securitySchemes: { cookieSession: security.apiKey(SESSION_COOKIE, "cookie") },
      define: defineOperationsApi,
    },
    auth: {
      resolver: createAuth({ jwtCookie: { name: SESSION_COOKIE, validator: issuer.validator } }),
      routes: {
        issuer,
        cookie: {
          name: SESSION_COOKIE,
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 8 * 60 * 60,
        },
        principalSchema,
        allowAttempt: async (ctx, operation, email) =>
          (
            await deps.rateLimits.consume(
              `auth:${operation}:${email}:${ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"}`,
              5,
              15 * 60_000,
            )
          ).allowed,
        async register(_ctx, input) {
          try {
            return await deps.accounts.register(input.email, input.password);
          } catch (error) {
            if (String(error).includes("UNIQUE constraint failed"))
              throw new AuthRouteError(409, "An account with this email already exists.");
            throw error;
          }
        },
        authenticate: (_ctx, input) => deps.accounts.authenticate(input.email, input.password),
        redirect: (ctx) => redirect(ctx.query.get("next")),
      },
    },
    middleware: [
      requestId(),
      securityHeaders({
        contentSecurityPolicy:
          "default-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:",
      }),
      rateLimit({ store: deps.rateLimits, limit: 120, windowMs: 60_000 }),
      accessLog(({ request, response, requestId: id }) =>
        deps.logger.write({
          method: request.method,
          path: new URL(request.url).pathname,
          status: response.status,
          requestId: id,
        }),
      ),
    ],
    probes: {
      livez: () => true,
      readyz: () => deps.db.open,
      startupz: () => deps.migrationCurrent,
      targetz: async () => {
        const summary = await deps.operations.summary();
        return (
          summary.healthyServices === 18 &&
          summary.degradedServices === 1 &&
          summary.openIncidents >= 2
        );
      },
    },
    onError: (_error, ctx) => ctx.internalServerError("The request could not be completed"),
    close: (dependencies) => dependencies.close(),
  });
}
