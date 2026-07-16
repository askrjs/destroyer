import {
  BookOpenIcon,
  ChartLineIcon,
  ComponentIcon,
  FileCode2Icon,
  FileTextIcon,
  HomeIcon,
  InfoIcon,
  LayoutPanelTopIcon,
  MailIcon,
  PaletteIcon,
  RocketIcon,
  RouteIcon,
  Settings2Icon,
  TerminalIcon,
} from "@askrjs/lucide";

export const docsItems = [
  {
    href: "/docs",
    label: "Introduction",
    group: "Get started",
    icon: BookOpenIcon,
  },
  {
    href: "/docs/installation",
    label: "Installation",
    group: "Get started",
    icon: RocketIcon,
  },
  {
    href: "/docs/routing",
    label: "Routing",
    group: "Core concepts",
    icon: RouteIcon,
  },
  {
    href: "/docs/theming",
    label: "Theming",
    group: "Core concepts",
    icon: PaletteIcon,
  },
  {
    href: "/docs/components",
    label: "Components",
    group: "UI",
    icon: ComponentIcon,
  },
  {
    href: "/docs/forms",
    label: "Forms",
    group: "UI",
    icon: FileTextIcon,
  },
  {
    href: "/docs/layouts",
    label: "Layouts",
    group: "Patterns",
    icon: LayoutPanelTopIcon,
  },
  {
    href: "/docs/settings",
    label: "Settings shell",
    group: "Patterns",
    icon: Settings2Icon,
  },
  {
    href: "/docs/deployment",
    label: "Deployment",
    group: "Reference",
    icon: FileCode2Icon,
  },
] as const;

export const appNavItems = [
  { href: "/", label: "Overview", icon: HomeIcon },
  { href: "/docs", label: "Docs", icon: BookOpenIcon },
  { href: "/logs", label: "Logs", icon: TerminalIcon },
  { href: "/metrics", label: "Metrics", icon: ChartLineIcon },
  { href: "/about", label: "About", icon: InfoIcon },
  { href: "/contact", label: "Contact", icon: MailIcon },
] as const;

export type DocsPath = (typeof docsItems)[number]["href"];

export const docsContent: Record<
  DocsPath,
  {
    title: string;
    eyebrow: string;
    description: string;
    badge: string;
    icon: typeof BookOpenIcon;
    sections: readonly { title: string; body: string }[];
    checks: readonly string[];
  }
> = {
  "/docs": {
    title: "Askr documentation",
    eyebrow: "Overview",
    description:
      "Use Destroyer as a compact reference for composing Askr routes, themes, and app shell primitives.",
    badge: "Start here",
    icon: BookOpenIcon,
    sections: [
      {
        title: "What this covers",
        body: "The docs surface shows a full left-nav documentation pattern using the same app header and footer as the rest of Destroyer.",
      },
      {
        title: "How to read it",
        body: "Each section is a route-backed page so the sidebar active state, browser history, and app shell all stay in sync.",
      },
    ],
    checks: [
      "Full app shell remains mounted",
      "Sidebar uses page background",
      "Content stays readable on mobile",
    ],
  },
  "/docs/installation": {
    title: "Installation",
    eyebrow: "Get started",
    description: "Install the Askr packages used by this sample and wire the default theme.",
    badge: "Setup",
    icon: RocketIcon,
    sections: [
      {
        title: "Packages",
        body: "Destroyer composes @askrjs/askr, @askrjs/themes, @askrjs/ui, @askrjs/lucide, and @askrjs/logos.",
      },
      {
        title: "Theme entry",
        body: "Importing from @askrjs/themes/components brings the default theme CSS and the component surface together.",
      },
    ],
    checks: [
      "Use one component import surface",
      "Keep charts in askr-charts",
      "Prefer package primitives over local CSS",
    ],
  },
  "/docs/routing": {
    title: "Routing",
    eyebrow: "Core concepts",
    description: "Define route-backed pages and keep shell navigation aware of the current path.",
    badge: "SPA",
    icon: RouteIcon,
    sections: [
      {
        title: "Route registration",
        body: "Destroyer registers page routes inside a shared layout group so the header, footer, and route content stay coordinated.",
      },
      {
        title: "Active state",
        body: "Navigation components read the current route and apply active styling without route-specific CSS.",
      },
    ],
    checks: [
      "Nested docs routes resolve",
      "Sidebar active state updates",
      "Fallback still renders the home page",
    ],
  },
  "/docs/theming": {
    title: "Theming",
    eyebrow: "Core concepts",
    description: "Theme tokens provide the Askr visual baseline without app-local stylesheets.",
    badge: "Tokens",
    icon: PaletteIcon,
    sections: [
      {
        title: "Default theme",
        body: "The default theme owns component color, spacing, radius, shadow, focus, and density decisions.",
      },
      {
        title: "Userland control",
        body: "Apps can still choose layout props and composition, while component-level visual defaults stay reusable.",
      },
    ],
    checks: [
      "No docs-specific CSS",
      "Sidebar inherits page background",
      "Cards use theme elevation",
    ],
  },
  "/docs/components": {
    title: "Components",
    eyebrow: "UI",
    description: "Compose interfaces with Askr theme components for polished application surfaces.",
    badge: "Catalog",
    icon: ComponentIcon,
    sections: [
      {
        title: "Primitive shape",
        body: "Buttons, cards, fields, grids, sidebars, and text all expose predictable props for layout and state.",
      },
      {
        title: "Visual contract",
        body: "The generated CSS should stay close to shadcn expectations for common controls and application surfaces.",
      },
    ],
    checks: [
      "Buttons support full width",
      "Card headers align without actions",
      "Sidebar works in page content",
    ],
  },
  "/docs/forms": {
    title: "Forms",
    eyebrow: "UI",
    description:
      "Use themed fields, labels, inputs, groups, and actions for compact form surfaces.",
    badge: "Inputs",
    icon: FileTextIcon,
    sections: [
      {
        title: "Field layout",
        body: "Field, Label, Input, and InputGroup provide the spacing and focus behavior needed for everyday forms.",
      },
      {
        title: "Auth forms",
        body: "The login and logout pages show full-screen auth composition without custom CSS.",
      },
    ],
    checks: ["Inputs align with icons", "Buttons stay readable", "Provider logos render correctly"],
  },
  "/docs/layouts": {
    title: "Layouts",
    eyebrow: "Patterns",
    description:
      "Build common page structures with Grid, Block, Page, Header, Footer, and Sidebar.",
    badge: "Patterns",
    icon: LayoutPanelTopIcon,
    sections: [
      {
        title: "Page shell",
        body: "The main layout uses a viewport-height wrapper so short pages push the footer to the bottom.",
      },
      {
        title: "Content grids",
        body: "Docs and settings use responsive grids to switch between side-by-side and stacked mobile layouts.",
      },
    ],
    checks: ["Footer stays below content", "Mobile stacks predictably", "Text avoids overlap"],
  },
  "/docs/settings": {
    title: "Settings shell",
    eyebrow: "Patterns",
    description: "A left-nav settings layout with route-backed sections and app shell chrome.",
    badge: "Nested",
    icon: Settings2Icon,
    sections: [
      {
        title: "Left navigation",
        body: "Settings uses a compact sidebar with grouped icon-and-label nav items.",
      },
      {
        title: "Section content",
        body: "Each nested path renders realistic settings content while keeping one route component.",
      },
    ],
    checks: [
      "No sidebar border by default",
      "No forced muted background",
      "Active state remains clear",
    ],
  },
  "/docs/deployment": {
    title: "Deployment",
    eyebrow: "Reference",
    description: "Build and verify the SPA before publishing or packaging examples.",
    badge: "Build",
    icon: FileCode2Icon,
    sections: [
      {
        title: "Production build",
        body: "Run typecheck and build to catch route, package, and generated CSS regressions.",
      },
      {
        title: "Visual verification",
        body: "Use screenshots at desktop and mobile sizes for routes with dense layout or shell composition.",
      },
    ],
    checks: ["Typecheck passes", "Build passes", "Visual checks cover desktop and mobile"],
  },
};

export function getActiveDocsPath(path: string): DocsPath {
  return docsItems.some((item) => item.href === path) ? (path as DocsPath) : "/docs";
}
