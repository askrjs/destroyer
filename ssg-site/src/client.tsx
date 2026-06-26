import "@askrjs/themes/default";
import { createSPA, hydrateSPA } from "@askrjs/askr/boot";
import { getStaticRoutes } from "./entry-static";
import "./style.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app root element.");
}

const options = {
  root,
  routes: getStaticRoutes(),
};

if (root.hasChildNodes()) {
  await hydrateSPA(options);
} else {
  await createSPA(options);
}
