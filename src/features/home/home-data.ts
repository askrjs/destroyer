export const metrics = [
  {
    label: "Services",
    value: "19",
    detail: "Operational state is served through authenticated APIs.",
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
    label: "Runtime",
    value: "1",
    detail: "SSR, APIs, probes, and assets share one deployment.",
    badge: "Full stack",
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
