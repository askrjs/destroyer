export const metrics = [
  {
    label: "Routes",
    value: "3",
    detail: "SPA paths share one mounted shell.",
    badge: "Live",
    variant: "success",
  },
  {
    label: "Theme modes",
    value: "3",
    detail: "Light, dark, and system are token-driven.",
    badge: "Synced",
    variant: "info",
  },
  {
    label: "Entrypoint",
    value: "1",
    detail: "Askr components import from one package surface.",
    badge: "Simple",
    variant: "secondary",
  },
] as const;

export const packages = [
  { name: "@askrjs/themes", role: "Theme CSS", status: "Aligned", variant: "success" },
  { name: "@askrjs/ui", role: "Primitives", status: "Mounted", variant: "info" },
  { name: "@askrjs/lucide", role: "Icons", status: "Ready", variant: "secondary" },
] as const;

export const checks = [
  "Active navigation is route-aware",
  "Theme state persists through the provider",
  "Cards, tables, forms, badges, and progress share one theme",
] as const;
