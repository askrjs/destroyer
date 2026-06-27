import { state } from "@askrjs/askr";
import { Link, currentRoute } from "@askrjs/askr/router";
import {
  BookOpenIcon,
  BoxIcon,
  BoxesIcon,
  CircleUserRoundIcon,
  ComponentIcon,
  FileCode2Icon,
  FileTextIcon,
  HomeIcon,
  InfoIcon,
  LaptopIcon,
  LayersIcon,
  LayoutPanelTopIcon,
  LogInIcon,
  LogOutIcon,
  MailIcon,
  MoonIcon,
  PaletteIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
  RocketIcon,
  RouteIcon,
  SettingsIcon,
  Settings2Icon,
  SunIcon,
  TerminalIcon,
} from "@askrjs/lucide";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
  Avatar,
  AvatarFallback,
  Badge,
  Block,
  Brand,
  BrandLabel,
  BrandMark,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Grid,
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarSeparator,
  MenubarTrigger,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Text,
} from "@askrjs/themes/components";
import { useTheme } from "@askrjs/themes/theme";
import { demoUser, isSignedIn } from "../auth";

const docsItems = [
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

const appNavItems = [
  { href: "/", label: "Overview", icon: HomeIcon },
  { href: "/docs", label: "Docs", icon: BookOpenIcon },
  { href: "/logs", label: "Logs", icon: TerminalIcon },
  { href: "/about", label: "About", icon: InfoIcon },
  { href: "/contact", label: "Contact", icon: MailIcon },
] as const;

const DOCS_SIDEBAR_STORAGE_KEY = "destroyer-docs-sidebar-collapsed";

type DocsPath = (typeof docsItems)[number]["href"];

const docsContent: Record<
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

function getActivePath(path: string): DocsPath {
  return docsItems.some((item) => item.href === path) ? (path as DocsPath) : "/docs";
}

function getStoredDocsSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DOCS_SIDEBAR_STORAGE_KEY) === "true";
}

function storeDocsSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DOCS_SIDEBAR_STORAGE_KEY, collapsed ? "true" : "false");
}

function getNextThemeName(theme: string): string {
  if (theme === "light") return "dark";
  if (theme === "dark") return "system";
  return "light";
}

function getThemeLabel(theme: string): string {
  if (theme === "dark") return "Dark";
  if (theme === "system") return "System";
  return "Light";
}

function getThemeIcon(theme: string) {
  if (theme === "dark") return MoonIcon;
  if (theme === "system") return LaptopIcon;
  return SunIcon;
}

function ProfileDropdown({
  currentTheme,
  railLabel = false,
  theme,
}: {
  currentTheme: string;
  railLabel?: boolean;
  theme: ReturnType<typeof useTheme>;
}) {
  const ThemeIcon = getThemeIcon(currentTheme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={railLabel ? "Profile" : "Open profile menu"}
        data-slot="sidebar-menu-button"
        {...getRailTooltipProps("Profile", railLabel)}
      >
        <CircleUserRoundIcon size={16} aria-hidden="true" />
        <Block hide={{ base: true, lg: false }}>
          <Text as="span" size="sm" weight="medium">
            Profile
          </Text>
        </Block>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" sideOffset={10}>
        <DropdownMenuLabel data-variant="account">
          <Avatar>
            <AvatarFallback>{demoUser.initials}</AvatarFallback>
          </Avatar>
          <Block direction="column" gap="0">
            <Text as="span" weight="semibold" size="sm">
              {demoUser.name}
            </Text>
            <Text as="span" tone="muted" size="sm">
              {demoUser.email}
            </Text>
          </Block>
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <CircleUserRoundIcon size={16} aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon size={16} aria-hidden="true" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => theme.setTheme(getNextThemeName(currentTheme))}>
          <ThemeIcon size={16} aria-hidden="true" />
          Theme: {getThemeLabel(currentTheme)}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem data-variant="destructive" asChild>
          <Link href="/logout">
            <LogOutIcon size={16} aria-hidden="true" />
            Sign out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getRailTooltipProps(label: string, enabled: boolean) {
  if (!enabled) return {};

  return {
    "aria-label": label,
    "data-tooltip": label,
    "data-tooltip-side": "right",
  };
}

function DocsSidebar({
  activePath,
  collapsed,
  onToggle,
}: {
  activePath: DocsPath;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const groups = ["Get started", "Core concepts", "UI", "Patterns", "Reference"] as const;
  const mobileRail =
    typeof window !== "undefined" && window.matchMedia("(max-width: 63.999rem)").matches;
  const signedIn = isSignedIn();
  const theme = useTheme();
  const currentTheme = theme.theme();
  const iconRail = collapsed || mobileRail;

  return (
    <Sidebar
      collapsible={collapsed || mobileRail ? "icon" : "none"}
      width="full"
      height="screen"
      minHeight="screen"
      maxHeight="screen"
      padding="md"
      background="muted"
      shrink={false}
      sticky
      top="0"
    >
      <SidebarHeader>
        <Block hide={{ base: false, lg: !collapsed }} gap="xs" align="center">
          <BrandMark aria-hidden="true">
            <BoxIcon size={16} />
          </BrandMark>
          <button
            type="button"
            aria-label="Expand docs navigation"
            data-slot="button"
            data-variant="ghost"
            data-size="icon"
            data-tooltip="Expand navigation"
            data-tooltip-side="right"
            onClick={onToggle}
          >
            <PanelLeftIcon size={16} aria-hidden="true" />
          </button>
        </Block>
        <Block
          hide={{ base: true, lg: collapsed }}
          direction="row"
          align="center"
          justify="between"
          gap="sm"
        >
          <Brand style={{ marginInlineStart: "calc(1px - var(--ak-space-sm))" }}>
            <BrandMark aria-hidden="true">
              <BoxIcon size={16} />
            </BrandMark>
            <Block>
              <BrandLabel>Destroyer</BrandLabel>
            </Block>
          </Brand>
          <button
            type="button"
            aria-label="Collapse docs navigation"
            data-slot="button"
            data-variant="ghost"
            data-size="icon"
            data-tooltip="Collapse navigation"
            data-tooltip-side="right"
            onClick={onToggle}
          >
            <PanelLeftCloseIcon size={16} aria-hidden="true" />
          </button>
        </Block>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {appNavItems.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/docs";

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton active={active} asChild>
                      <Link href={item.href} {...getRailTooltipProps(item.label, iconRail)}>
                        <Icon size={16} aria-hidden="true" />
                        <Block hide={{ base: true, lg: false }}>
                          <Text as="span" size="sm" weight="medium">
                            {item.label}
                          </Text>
                        </Block>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator decorative />
        {groups.map((group) => (
          <SidebarGroup key={group}>
            <Block hide={{ base: true, lg: false }}>
              <SidebarGroupLabel>{group}</SidebarGroupLabel>
            </Block>
            <SidebarGroupContent>
              <SidebarMenu>
                {docsItems
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton active={activePath === item.href} asChild>
                          <Link href={item.href} {...getRailTooltipProps(item.label, iconRail)}>
                            <Icon size={16} aria-hidden="true" />
                            <Block hide={{ base: true, lg: false }}>
                              <Text as="span" size="sm" weight="medium">
                                {item.label}
                              </Text>
                            </Block>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {signedIn ? (
              <ProfileDropdown currentTheme={currentTheme} railLabel={iconRail} theme={theme} />
            ) : (
              <SidebarMenuButton asChild>
                <Link href="/login" {...getRailTooltipProps("Sign in", iconRail)}>
                  <LogInIcon size={16} aria-hidden="true" />
                  <Block hide={{ base: true, lg: false }}>
                    <Text as="span" size="sm" weight="medium">
                      Sign in
                    </Text>
                  </Block>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function DocsArticleTools({ activePath }: { activePath: DocsPath }) {
  const content = docsContent[activePath];
  const copyRoutePath = () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    void navigator.clipboard.writeText(activePath).catch(() => {});
  };
  const menuLink = (href: string, children: unknown) =>
    (<Link href={href}>{children as never}</Link>) as never;

  return (
    <Menubar aria-label={`${content.title} article tools`}>
      <MenubarMenu value="view">
        <MenubarTrigger>
          <RouteIcon size={16} aria-hidden="true" />
          View
        </MenubarTrigger>
        <MenubarPortal>
          <MenubarContent side="bottom" align="start" sideOffset={8}>
            <MenubarLabel>Article</MenubarLabel>
            <MenubarGroup>
              <MenubarItem onPress={copyRoutePath}>
                <RouteIcon size={16} aria-hidden="true" />
                Copy route path
              </MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarLabel>Related</MenubarLabel>
            <MenubarGroup>
              <MenubarItem asChild>
                {menuLink(
                  "/docs/components",
                  <>
                    <ComponentIcon size={16} aria-hidden="true" />
                    Component guide
                  </>,
                )}
              </MenubarItem>
              <MenubarItem asChild>
                {menuLink(
                  "/settings",
                  <>
                    <SettingsIcon size={16} aria-hidden="true" />
                    Settings shell
                  </>,
                )}
              </MenubarItem>
              <MenubarItem asChild>
                {menuLink(
                  "/profile/activity",
                  <>
                    <CircleUserRoundIcon size={16} aria-hidden="true" />
                    Profile activity
                  </>,
                )}
              </MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarPortal>
      </MenubarMenu>
      <MenubarMenu value="export">
        <MenubarTrigger>
          <FileTextIcon size={16} aria-hidden="true" />
          Export
        </MenubarTrigger>
        <MenubarPortal>
          <MenubarContent side="bottom" align="end" sideOffset={8}>
            <MenubarLabel>Checks</MenubarLabel>
            <MenubarItem>
              <FileCode2Icon size={16} aria-hidden="true" />
              Copy markdown
            </MenubarItem>
            <MenubarItem disabled>
              <FileTextIcon size={16} aria-hidden="true" />
              Download PDF
            </MenubarItem>
          </MenubarContent>
        </MenubarPortal>
      </MenubarMenu>
    </Menubar>
  );
}

function DocsArticle({ activePath }: { activePath: DocsPath }) {
  const content = docsContent[activePath];
  const Icon = content.icon;

  return (
    <Block as="article" gap="2xl" maxWidth="lg">
      <Block gap="lg">
        <Block direction="row" align="center" gap="sm">
          <Block center padding="sm" radius="md" background="selected">
            <Icon size={20} aria-hidden="true" />
          </Block>
          <Badge variant="secondary">{content.badge}</Badge>
        </Block>
        <Block gap="sm">
          <Text tone="muted" size="sm">
            {content.eyebrow}
          </Text>
          <Block rowFrom="md" align={{ base: "start", md: "center" }} justify="between" gap="md">
            <Text as="strong" weight="bold" size="lg">
              {content.title}
            </Text>
            <DocsArticleTools activePath={activePath} />
          </Block>
          <Text tone="muted">{content.description}</Text>
        </Block>
      </Block>

      <Separator decorative />

      <Block gap="2xl">
        {content.sections.map((section) => (
          <Block key={section.title} gap="sm">
            <Text as="strong" weight="semibold">
              {section.title}
            </Text>
            <Text tone="muted">{section.body}</Text>
          </Block>
        ))}
      </Block>

      <Block gap="md" padding="lg" background="muted" radius="md">
        <Block direction="row" align="center" gap="sm">
          <LayersIcon size={16} aria-hidden="true" />
          <Text as="strong" weight="semibold">
            Verification notes
          </Text>
        </Block>
        <Accordion defaultValue="route-checks" collapsible>
          <AccordionItem value="route-checks">
            <AccordionHeader>
              <AccordionTrigger>Route and shell checks</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <Block gap="sm">
                {content.checks.map((check) => (
                  <Text key={check} tone="muted" size="sm">
                    {check}
                  </Text>
                ))}
              </Block>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="responsive-review">
            <AccordionHeader>
              <AccordionTrigger>Responsive review</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <Text tone="muted" size="sm">
                Check the docs page at mobile, tablet, and desktop widths so the rail, article copy,
                and route action stay readable without clipped text.
              </Text>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="theme-ownership">
            <AccordionHeader>
              <AccordionTrigger>Theme ownership</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <Text tone="muted" size="sm">
                Any visual issue found here should be fixed in the shared theme unless the docs page
                is composing the primitive incorrectly.
              </Text>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Block>
    </Block>
  );
}

export function DocsPage() {
  const activePath = getActivePath(currentRoute().path);
  const [collapsed, setCollapsed] = state(getStoredDocsSidebarCollapsed());
  const setDocsSidebarCollapsed = (nextCollapsed: boolean) => {
    setCollapsed(nextCollapsed);
    storeDocsSidebarCollapsed(nextCollapsed);
  };

  return (
    <Block as="main" grow width="full" background="canvas">
      <Grid
        columns={{
          base: "3.75rem minmax(0, 1fr)",
          lg: collapsed() ? "4.5rem minmax(0, 1fr)" : "16rem minmax(0, 1fr)",
        }}
        gap="0"
        align="stretch"
      >
        <DocsSidebar
          activePath={activePath}
          collapsed={collapsed()}
          onToggle={() => setDocsSidebarCollapsed(!collapsed())}
        />
        <Block padding={{ base: "md", lg: "2xl" }}>
          <Block maxWidth="lg" gap="2xl">
            <Block rowFrom="md" align={{ base: "start", md: "center" }} justify="between" gap="md">
              <Block gap="xs">
                <Text as="strong" weight="bold" size="lg">
                  Docs
                </Text>
                <Text tone="muted">
                  Full-width documentation shell with a collapsible left navigation.
                </Text>
              </Block>
              <Link href="/settings" data-slot="button" data-variant="outline" data-size="sm">
                <BoxesIcon size={16} aria-hidden="true" />
                Open settings
              </Link>
            </Block>
            <DocsArticle activePath={activePath} />
          </Block>
        </Block>
      </Grid>
    </Block>
  );
}
