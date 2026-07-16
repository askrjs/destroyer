import { Link } from "@askrjs/askr/router";
import { BoxIcon, LogInIcon, PanelLeftCloseIcon, PanelLeftIcon } from "@askrjs/lucide";
import {
  Block,
  Brand,
  BrandLabel,
  BrandMark,
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
  SidebarTrigger,
} from "@askrjs/themes/components";
import { theme } from "@askrjs/themes/theme";
import { isSignedIn } from "../../auth";
import { appNavItems, docsItems, type DocsPath } from "./docs-data";
import { ProfileDropdown } from "./profile-dropdown";

export function DocsSidebar({
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
  const themeScope = theme();
  const currentTheme = themeScope.theme();
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
          <SidebarTrigger
            aria-label="Expand docs navigation"
            tooltip="Expand navigation"
            tooltipSide="right"
            onClick={onToggle}
          >
            <PanelLeftIcon size={16} aria-hidden="true" />
          </SidebarTrigger>
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
          <SidebarTrigger
            aria-label="Collapse docs navigation"
            tooltip="Collapse navigation"
            tooltipSide="right"
            onClick={onToggle}
          >
            <PanelLeftCloseIcon size={16} aria-hidden="true" />
          </SidebarTrigger>
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
                    <SidebarMenuButton
                      active={active}
                      asChild
                      tooltip={iconRail ? item.label : undefined}
                      tooltipSide="right"
                    >
                      <Link href={item.href}>
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
                        <SidebarMenuButton
                          active={activePath === item.href}
                          asChild
                          tooltip={iconRail ? item.label : undefined}
                          tooltipSide="right"
                        >
                          <Link href={item.href}>
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
              <ProfileDropdown currentTheme={currentTheme} railLabel={iconRail} theme={themeScope} />
            ) : (
              <SidebarMenuButton
                asChild
                tooltip={iconRail ? "Sign in" : undefined}
                tooltipSide="right"
              >
                <Link href="/login">
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
