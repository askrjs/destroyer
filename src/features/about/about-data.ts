import { LayoutPanelTopIcon, PaintbrushIcon, RouteIcon } from "@askrjs/lucide";

export const validations = [
  {
    title: "Client routing",
    description: "The layout keeps active navigation stable across three SPA routes.",
    badge: "Routes",
    variant: "info",
    Icon: RouteIcon,
  },
  {
    title: "Theme contract",
    description: "Shared tokens drive light, dark, and persisted theme state.",
    badge: "Tokens",
    variant: "success",
    Icon: PaintbrushIcon,
  },
  {
    title: "Page composition",
    description: "Page headers, cards, alerts, and forms stay in the theme system.",
    badge: "Catalog",
    variant: "secondary",
    Icon: LayoutPanelTopIcon,
  },
] as const;
