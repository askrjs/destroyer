import { group, registerRoutes, route } from "@askrjs/askr/router";
import { PageLayout } from "./_layout";
import { AboutPage } from "./about";
import { ContactPage } from "./contact";
import { DocsPage } from "./docs";
import { HomePage } from "./home";
import { LoginPage } from "./login";
import { LogoutPage } from "./logout";
import { ProfilePage } from "./profile";
import { SettingsPage } from "./settings";

registerRoutes(() => {
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
    route("/login", LoginPage);
    route("/logout", LogoutPage);
    route("/profile", ProfilePage);
    route("/settings", SettingsPage);
    route("/settings/security", SettingsPage);
    route("/settings/preferences", SettingsPage);
    route("/settings/notifications", SettingsPage);
    route("/settings/billing", SettingsPage);
    route("/settings/workspace", SettingsPage);
    route("/*", HomePage);
  });
});
