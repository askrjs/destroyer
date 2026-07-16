import { createSPA, hydrateSPA } from "@askrjs/askr/boot";
import { pageRegistry } from "./pages/_routes";

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app root element.");

if (root.hasChildNodes()) await hydrateSPA({ root, registry: pageRegistry });
else await createSPA({ root, registry: pageRegistry });
