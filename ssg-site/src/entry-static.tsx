import { renderToString } from "@askrjs/askr/ssr";
import { ThemeScope } from "@askrjs/themes/theme";
import "./style.css";

export const staticPaths = ["/", "/guide", "/reference"];

const scenarios = [
  {
    mode: "SSG",
    label: "Route Generation",
    intent: "Build static pages from the route manifest.",
    pressure: ["paths", "assets", "links"],
  },
  {
    mode: "SSG",
    label: "Hydration",
    intent: "Hydrate pre-rendered content without replacing it.",
    pressure: ["markup", "state", "events"],
  },
  {
    mode: "SSG",
    label: "Nested Assets",
    intent: "Keep scripts and styles resolving from nested pages.",
    pressure: ["base paths", "css", "runtime"],
  },
];

export type ClientAsset = {
  href: string;
  kind: "script" | "style";
};

export type RenderStaticOptions = {
  assets?: ClientAsset[];
};

const developmentAssets: ClientAsset[] = [{ href: "/src/client.tsx", kind: "script" }];

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

function SiteShell({ children }: { children?: unknown }) {
  return (
    <ThemeScope>
      <main class="site-shell">
        <header>
          <a href="/">destroyer ssg</a>
          <nav aria-label="Static sections">
            <a href="/">Home</a>
            <a href="/guide">Guide</a>
            <a href="/reference">Reference</a>
          </nav>
        </header>
        {children}
      </main>
    </ThemeScope>
  );
}

function HomePage() {
  return (
    <SiteShell>
      <section class="landing">
        <p>SSG stress target</p>
        <h1>Static site built from AskR route components</h1>
      </section>
      <section class="content-grid">
        {scenarios.map((scenario) => (
          <article>
            <span>{scenario.mode}</span>
            <h2>{scenario.label}</h2>
            <p>{scenario.intent}</p>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}

function GuidePage() {
  return (
    <SiteShell>
      <article class="document">
        <p>Guide</p>
        <h1>What this static site should break</h1>
        <ul>
          <li>Route generation from a build-time manifest.</li>
          <li>Hydration over pre-rendered content.</li>
          <li>Asset paths from nested static pages.</li>
        </ul>
      </article>
    </SiteShell>
  );
}

function ReferencePage() {
  return (
    <SiteShell>
      <article class="document">
        <p>Reference</p>
        <h1>Static rendering matrix</h1>
        <table>
          <thead>
            <tr>
              <th>Surface</th>
              <th>Pressure</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario) => (
              <tr>
                <td>{scenario.label}</td>
                <td>{scenario.pressure.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </SiteShell>
  );
}

function NotFoundPage() {
  return (
    <SiteShell>
      <article class="document">
        <h1>Static page missing</h1>
        <p>The fallback route keeps unmatched SSG behavior observable.</p>
      </article>
    </SiteShell>
  );
}

export function getStaticRoutes() {
  return [
    { path: "/", handler: HomePage },
    { path: "/guide", handler: GuidePage },
    { path: "/reference", handler: ReferencePage },
    { path: "*", handler: NotFoundPage },
  ];
}

export function renderStaticPath(path = "/", options: RenderStaticOptions = {}) {
  const appHtml = renderToString({
    url: path,
    routes: getStaticRoutes(),
  });
  const assetTags = renderAssetTags(options.assets ?? developmentAssets);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Destroyer SSG</title>
  </head>
  <body>
    <div id="app">${appHtml}</div>
    ${assetTags}
  </body>
</html>`;
}
