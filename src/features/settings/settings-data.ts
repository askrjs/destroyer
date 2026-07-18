import {
  BellIcon,
  Building2Icon,
  CreditCardIcon,
  PaletteIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "@askrjs/lucide";

export const settingsItems = [
  {
    href: "/settings",
    label: "Profile",
    group: "Account",
    icon: UserRoundIcon,
  },
  {
    href: "/settings/security",
    label: "Security",
    group: "Account",
    icon: ShieldCheckIcon,
  },
  {
    href: "/settings/preferences",
    label: "Preferences",
    group: "Workspace",
    icon: PaletteIcon,
  },
  {
    href: "/settings/notifications",
    label: "Notifications",
    group: "Workspace",
    icon: BellIcon,
  },
  {
    href: "/settings/billing",
    label: "Billing",
    group: "Admin",
    icon: CreditCardIcon,
  },
  {
    href: "/settings/workspace",
    label: "Workspace",
    group: "Admin",
    icon: Building2Icon,
  },
] as const;

export type SettingsPath = (typeof settingsItems)[number]["href"];

export function getActiveSettingsPath(path: string): SettingsPath {
  return settingsItems.some((item) => item.href === path) ? (path as SettingsPath) : "/settings";
}
