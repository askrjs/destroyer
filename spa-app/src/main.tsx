import "@askrjs/themes/default";
import { createSPA } from "@askrjs/askr/boot";
import { getSpaRoutes } from "./routes";
import "./style.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app root element.");
}

await createSPA({
  root,
  routes: getSpaRoutes()
});
