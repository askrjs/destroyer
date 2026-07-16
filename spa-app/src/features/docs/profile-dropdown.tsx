import { Link } from "@askrjs/askr/router";
import { CircleUserRoundIcon, LogOutIcon, SettingsIcon } from "@askrjs/lucide";
import {
  Avatar,
  AvatarFallback,
  Block,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenuButton,
  Text,
} from "@askrjs/themes/components";
import type { ThemeScopeValue } from "@askrjs/themes/theme";
import { demoUser } from "../../auth";
import { getNextThemeName, getThemeIcon, getThemeLabel } from "./docs-theme";

export function ProfileDropdown({
  currentTheme,
  railLabel = false,
  theme,
}: {
  currentTheme: string;
  railLabel?: boolean;
  theme: ThemeScopeValue;
}) {
  const ThemeIcon = getThemeIcon(currentTheme);

  return (
    <DropdownMenu>
      <SidebarMenuButton asChild tooltip={railLabel ? "Profile" : undefined} tooltipSide="right">
        <DropdownMenuTrigger aria-label={railLabel ? "Profile" : "Open profile menu"}>
          <CircleUserRoundIcon size={16} aria-hidden="true" />
          <Block hide={{ base: true, lg: false }}>
            <Text as="span" size="sm" weight="medium">
              Profile
            </Text>
          </Block>
        </DropdownMenuTrigger>
      </SidebarMenuButton>
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
        <DropdownMenuItem variant="destructive" asChild>
          <Link href="/logout">
            <LogOutIcon size={16} aria-hidden="true" />
            Sign out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
