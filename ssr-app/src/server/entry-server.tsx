import { renderToString } from "@askrjs/askr/ssr";
import { getSsrRoutes } from "../routes";
import "../style.css";

export function render(url = "/") {
  const appHtml = renderToString({
    url,
    routes: getSsrRoutes()
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Destroyer SSR</title>
  </head>
  <body>
    <div id="app">${appHtml}</div>
    <script type="module" src="/src/client.tsx"></script>
  </body>
</html>`;
}

