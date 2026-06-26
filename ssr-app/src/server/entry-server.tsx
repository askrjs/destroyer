import { renderToString } from "@askrjs/askr/ssr";
import { getSsrRoutes } from "../routes";
import "../style.css";

export type ClientAsset = {
  href: string;
  kind: "script" | "style";
};

export type RenderOptions = {
  assets?: ClientAsset[];
};

const developmentAssets: ClientAsset[] = [
  { href: "/src/client.tsx", kind: "script" }
];

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function renderAssetTags(assets: ClientAsset[]) {
  return assets
    .map((asset) => {
      const href = escapeAttribute(asset.href);
      return asset.kind === "style"
        ? `<link rel="stylesheet" href="${href}" />`
        : `<script type="module" src="${href}"></script>`;
    })
    .join("\n    ");
}

export function render(url = "/", options: RenderOptions = {}) {
  const appHtml = renderToString({
    url,
    routes: getSsrRoutes()
  });
  const assetTags = renderAssetTags(options.assets ?? developmentAssets);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Destroyer SSR</title>
  </head>
  <body>
    <div id="app">${appHtml}</div>
    ${assetTags}
  </body>
</html>`;
}
