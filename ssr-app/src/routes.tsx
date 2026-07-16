import { Button } from "@askrjs/ui";
import { ThemeScope } from "@askrjs/themes/theme";

const metrics = [
  { label: "Requests", value: "128k" },
  { label: "Latency", value: "42ms" },
  { label: "Errors", value: "0.02%" },
];

const scenarios = [
  {
    mode: "SSR",
    label: "Hydration",
    intent: "Validate server markup can hydrate without route drift.",
  },
  {
    mode: "SSR",
    label: "Fallback",
    intent: "Keep unmatched routes observable through a rendered fallback.",
  },
  {
    mode: "SSR",
    label: "Actions",
    intent: "Exercise interactive UI from server-rendered content.",
  },
];

function SsrShell({ children }: { children?: unknown }) {
  return (
    <ThemeScope>
      <main class="ssr-shell">
        <header>
          <a href="/">destroyer ssr</a>
          <nav aria-label="SSR sections">
            <a href="/">Overview</a>
            <a href="/incidents">Incidents</a>
          </nav>
        </header>
        <section>{children}</section>
      </main>
    </ThemeScope>
  );
}

function OverviewPage() {
  return (
    <SsrShell>
      <div class="hero">
        <p>SSR stress target</p>
        <h1>Operations console rendered on the server</h1>
        <Button>Hydration action</Button>
      </div>
      <section class="status-grid">
        {metrics.map((metric) => (
          <article>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>
    </SsrShell>
  );
}

function IncidentsPage() {
  return (
    <SsrShell>
      <section class="incident-list">
        <h1>Scenario incidents</h1>
        {scenarios.map((scenario) => (
          <article>
            <span>{scenario.mode}</span>
            <h2>{scenario.label}</h2>
            <p>{scenario.intent}</p>
          </article>
        ))}
      </section>
    </SsrShell>
  );
}

function MissingPage() {
  return (
    <SsrShell>
      <section class="incident-list">
        <h1>SSR route missing</h1>
        <p>The fallback route keeps unmatched SSR behavior observable.</p>
      </section>
    </SsrShell>
  );
}

export function getSsrRoutes() {
  return [
    { path: "/", handler: OverviewPage },
    { path: "/incidents", handler: IncidentsPage },
    { path: "*", handler: MissingPage },
  ];
}
