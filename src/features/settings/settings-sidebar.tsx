import { Link } from "@askrjs/askr/router";
import {
  Badge,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Text,
} from "@askrjs/themes/components";
import { settingsItems, type SettingsPath } from "./settings-data";

export function SettingsSidebar({ activePath }: { activePath: SettingsPath }) {
  const groups = ["Account", "Workspace", "Admin"] as const;

  return (
    <Sidebar width="full" minHeight="auto" padding="0" borderRight={false} shrink={false}>
      <SidebarHeader>
        <Text as="strong" weight="semibold">
          Settings
        </Text>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const Icon = item.icon;
                    const badge = "badge" in item ? item.badge : undefined;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton active={activePath === item.href} asChild>
                          <Link href={item.href}>
                            <Icon size={16} aria-hidden="true" />
                            <Text as="span" size="sm" weight="medium">
                              {item.label}
                            </Text>
                            {badge ? <Badge variant="secondary">{badge}</Badge> : null}
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
    </Sidebar>
  );
}
