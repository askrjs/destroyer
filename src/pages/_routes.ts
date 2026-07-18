import { createRouteRegistry, group, route, type RouteOptions } from "@askrjs/askr/router";
import { safeRedirect } from "@askrjs/server/auth";
import { requireAnonymous, requireUser } from "@askrjs/auth";
import { resolveAuth } from "../auth";
import { PageLayout } from "./_layout";
import { AboutPage } from "./about";
import { ContactPage } from "./contact";
import { DocsPage } from "./docs";
import { HomePage } from "./home";
import { LoginPage } from "./login";
import { LogsPage } from "./logs";
import { LogoutPage } from "./logout";
import { MetricsPage } from "./metrics";
import { ProfilePage } from "./profile";
import { SettingsPage } from "./settings";
import { SignupPage } from "./signup";
import { operatorSettingsQuery, settingsActions } from "../features/settings/settings-model";
import { liveLogQuery } from "../features/logs/live-logs-resource";
import { operationsMetricsQuery } from "../features/metrics/metrics-model";

const settingsRoute = {
  auth: requireUser(),
  actions: settingsActions,
  preload: (context) =>
    context.auth.principal
      ? context.data.prefetch(operatorSettingsQuery, {
          principalId: context.auth.principal.id,
        })
      : undefined,
} satisfies RouteOptions;

const logsRoute = {
  auth: requireUser(),
  preload: (context) =>
    context.auth.principal
      ? context.data.prefetch(liveLogQuery, { principalId: context.auth.principal.id })
      : undefined,
} satisfies RouteOptions;

const metricsRoute = {
  auth: requireUser(),
  preload: (context) =>
    context.auth.principal
      ? context.data.prefetch(operationsMetricsQuery, { principalId: context.auth.principal.id })
      : undefined,
} satisfies RouteOptions;

export const pageRegistry = createRouteRegistry(
  () => {
    group({ layout: PageLayout }, () => {
      route("/", HomePage);
      route("/about", AboutPage);
      route("/contact", ContactPage);
      route("/docs", DocsPage);
      route("/docs/installation", DocsPage);
      route("/docs/routing", DocsPage);
      route("/docs/theming", DocsPage);
      route("/docs/components", DocsPage);
      route("/docs/forms", DocsPage);
      route("/docs/layouts", DocsPage);
      route("/docs/settings", DocsPage);
      route("/docs/deployment", DocsPage);
      route("/logs", LogsPage, logsRoute);
      route("/metrics", MetricsPage, metricsRoute);
      route("/login", LoginPage, { auth: requireAnonymous() });
      route("/signup", SignupPage, { auth: requireAnonymous() });
      route("/logout", LogoutPage, { auth: requireUser() });
      route("/profile", ProfilePage, { auth: requireUser() });
      route("/profile/activity", ProfilePage, { auth: requireUser() });
      route("/profile/access", ProfilePage, { auth: requireUser() });
      route("/settings", SettingsPage, settingsRoute);
      route("/settings/security", SettingsPage, settingsRoute);
      route("/settings/preferences", SettingsPage, settingsRoute);
      route("/settings/notifications", SettingsPage, settingsRoute);
      route("/settings/billing", SettingsPage, settingsRoute);
      route("/settings/workspace", SettingsPage, settingsRoute);
    });
  },
  {
    auth: {
      resolve: resolveAuth,
      loginPath: (ctx) => `/login?next=${encodeURIComponent(ctx.href)}`,
      authenticatedRedirectTo: (ctx) => {
        return safeRedirect("/logs")(new URLSearchParams(ctx.search).get("next"));
      },
    },
  },
);
