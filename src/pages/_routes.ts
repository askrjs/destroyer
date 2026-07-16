import { createRouteRegistry, group, route } from "@askrjs/askr/router";
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
import { operatorProfileQuery, updateProfileAction } from "../features/settings/profile-model";

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
      route("/logs", LogsPage, { auth: requireUser() });
      route("/metrics", MetricsPage, { auth: requireUser() });
      route("/login", LoginPage, { auth: requireAnonymous() });
      route("/signup", SignupPage, { auth: requireAnonymous() });
      route("/logout", LogoutPage, { auth: requireUser() });
      route("/profile", ProfilePage, { auth: requireUser() });
      route("/profile/activity", ProfilePage, { auth: requireUser() });
      route("/profile/access", ProfilePage, { auth: requireUser() });
      route("/settings", SettingsPage, {
        auth: requireUser(),
        actions: [updateProfileAction],
        preload: (context) =>
          context.auth.principal
            ? context.data.prefetch(operatorProfileQuery, {
                principalId: context.auth.principal.id,
              })
            : undefined,
      });
      route("/settings/security", SettingsPage, { auth: requireUser() });
      route("/settings/preferences", SettingsPage, { auth: requireUser() });
      route("/settings/notifications", SettingsPage, { auth: requireUser() });
      route("/settings/billing", SettingsPage, { auth: requireUser() });
      route("/settings/workspace", SettingsPage, { auth: requireUser() });
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
