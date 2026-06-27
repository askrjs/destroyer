import "@askrjs/themes/default";
import "@askrjs/charts";
import { createSPA } from "@askrjs/askr/boot";
import { getManifest } from "@askrjs/askr/router";
import "./pages/_routes";

await createSPA({
  root: "app",
  manifest: getManifest(),
});
