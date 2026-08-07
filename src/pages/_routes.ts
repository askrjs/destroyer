import { createRouteRegistry, group, lazy, route, type RouteOptions } from "@askrjs/askr/router";
import { safeRedirect } from "@askrjs/server/auth";
import { requireAnonymous, requireUser } from "@askrjs/auth";
import { resolveAuth } from "../auth";
import { PageLayout } from "./_layout";
import { operatorSettingsQuery, settingsActions } from "../features/settings/settings-model";
import { liveLogQuery } from "../features/logs/live-logs-resource";
import { operationsMetricsQuery } from "../features/metrics/metrics-model";

const AboutPage = lazy(() => import("./about").then((module) => module.AboutPage));
const ContactPage = lazy(() => import("./contact").then((module) => module.ContactPage));
const DocsPage = lazy(() => import("./docs").then((module) => module.DocsPage));
const HomePage = lazy(() => import("./home").then((module) => module.HomePage));
const LoginPage = lazy(() => import("./login").then((module) => module.LoginPage));
const LogsPage = lazy(() => import("./logs").then((module) => module.LogsPage));
const LogoutPage = lazy(() => import("./logout").then((module) => module.LogoutPage));
const MetricsPage = lazy(() => import("./metrics").then((module) => module.MetricsPage));
const ProfilePage = lazy(() => import("./profile").then((module) => module.ProfilePage));
const SettingsPage = lazy(() => import("./settings").then((module) => module.SettingsPage));
const SignupPage = lazy(() => import("./signup").then((module) => module.SignupPage));

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
