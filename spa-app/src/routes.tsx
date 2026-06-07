import { state } from "@askrjs/askr";
import { Button, Input } from "@askrjs/ui";
import { ThemeProvider, ThemeToggle } from "@askrjs/themes/theme";
import { metrics, scenarios } from "@destroyer/shared";

type DestroyerInputEvent = Event & {
  currentTarget: HTMLInputElement;
  target: HTMLInputElement;
};

function Shell({ children }: { children?: unknown }) {
  return (
    <ThemeProvider>
      <main class="app-shell">
        <aside class="sidebar">
          <a class="brand" href="/">
            destroyer
          </a>
          <nav aria-label="Primary navigation">
            <a href="/">Dashboard</a>
            <a href="/scenarios">Scenarios</a>
          </nav>
          <ThemeToggle />
        </aside>
        <section class="workspace">{children}</section>
      </main>
    </ThemeProvider>
  );
}

function DashboardPage() {
  const [activeScenario, setActiveScenario] = state("interactive-dashboard");
  const [search, setSearch] = state("");

  return (
    <Shell>
      <header class="toolbar">
        <div>
          <p>SPA stress target</p>
          <h1>Interactive release dashboard</h1>
        </div>
        <Button onPress={() => setActiveScenario("ops-console")}>Exercise SSR case</Button>
      </header>

      <section class="metric-grid" aria-label="Key metrics">
        {metrics.map((metric) => (
          <article class="metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small data-trend={metric.trend}>{metric.trend}</small>
          </article>
        ))}
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h2>Scenario selector</h2>
          <Input
            aria-label="Filter scenarios"
            placeholder="Filter scenarios"
            value={search()}
            onInput={(event: DestroyerInputEvent) => setSearch(event.currentTarget.value)}
          />
        </div>
        <div class="scenario-list">
          {scenarios
            .filter((scenario) =>
              scenario.label.toLowerCase().includes(search().toLowerCase())
            )
            .map((scenario) => (
              <button
                class={scenario.id === activeScenario() ? "scenario active" : "scenario"}
                onClick={() => setActiveScenario(scenario.id)}
              >
                <span>{scenario.label}</span>
                <small>{scenario.intent}</small>
              </button>
            ))}
        </div>
      </section>
    </Shell>
  );
}

function ScenariosPage() {
  return (
    <Shell>
      <header class="toolbar">
        <div>
          <p>Coverage map</p>
          <h1>AskR surfaces under test</h1>
        </div>
      </header>
      <section class="scenario-grid">
        {scenarios.map((scenario) => (
          <article class="scenario-card">
            <span>{scenario.mode}</span>
            <h2>{scenario.label}</h2>
            <p>{scenario.intent}</p>
            <ul>
              {scenario.pressure.map((item) => (
                <li>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </Shell>
  );
}

function NotFoundPage() {
  return (
    <Shell>
      <section class="panel">
        <h1>Missing test surface</h1>
        <p>This route is intentionally unmatched so routing behavior stays visible.</p>
        <a href="/">Return to dashboard</a>
      </section>
    </Shell>
  );
}

export function getSpaRoutes() {
  return [
    { path: "/", handler: DashboardPage },
    { path: "/scenarios", handler: ScenariosPage },
    { path: "*", handler: NotFoundPage }
  ];
}
