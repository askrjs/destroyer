export type DestroyerScenario = {
  id: string;
  label: string;
  mode: "spa" | "ssr" | "ssg";
  intent: string;
  pressure: string[];
};

export type DestroyerMetric = {
  label: string;
  value: string;
  trend: "up" | "flat" | "down";
};

export const scenarios: DestroyerScenario[] = [
  {
    id: "interactive-dashboard",
    label: "Interactive dashboard",
    mode: "spa",
    intent: "Exercise stateful controls, route changes, forms, and browser-only behavior.",
    pressure: ["nested layouts", "optimistic UI", "client routing", "theme switching"]
  },
  {
    id: "ops-console",
    label: "Operations console",
    mode: "ssr",
    intent: "Exercise server rendering, hydration, and request-shaped content.",
    pressure: ["server data", "document shell", "hydration", "status summaries"]
  },
  {
    id: "content-site",
    label: "Content site",
    mode: "ssg",
    intent: "Exercise static rendering, generated routes, and build-time content.",
    pressure: ["pre-rendered pages", "content collections", "metadata", "asset paths"]
  }
];

export const metrics: DestroyerMetric[] = [
  { label: "Routes", value: "18", trend: "up" },
  { label: "Components", value: "42", trend: "up" },
  { label: "Build targets", value: "3", trend: "flat" },
  { label: "Known gaps", value: "0", trend: "down" }
];

export function getScenario(id: string) {
  return scenarios.find((scenario) => scenario.id === id);
}

