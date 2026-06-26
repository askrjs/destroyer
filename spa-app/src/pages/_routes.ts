import { group, registerRoutes, route } from "@askrjs/askr/router";
import { PageLayout } from "./_layout";
import { AboutPage } from "./about";
import { ContactPage } from "./contact";
import { HomePage } from "./home";

registerRoutes(() => {
  group({ layout: PageLayout }, () => {
    route("/", HomePage);
    route("/about", AboutPage);
    route("/contact", ContactPage);
    route("/*", HomePage);
  });
});
