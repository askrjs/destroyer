import { Button } from "@askrjs/ui";
import { ThemeProvider } from "@askrjs/themes/theme";
import { metrics, scenarios } from "@destroyer/shared";

function SsrShell({ children }: { children?: unknown }) {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
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
    { path: "*", handler: MissingPage }
  ];
}
