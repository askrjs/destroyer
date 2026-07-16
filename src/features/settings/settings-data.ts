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
    badge: "2FA",
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

export const notificationChannels = [
  {
    id: "settings-channel-email",
    label: "Email digest",
    description: "Send a daily summary for account and workspace changes.",
    value: "email",
    defaultChecked: true,
  },
  {
    id: "settings-channel-browser",
    label: "Browser alerts",
    description: "Show route and component updates while the app is open.",
    value: "browser",
    defaultChecked: true,
  },
  {
    id: "settings-channel-weekly",
    label: "Weekly report",
    description: "Bundle low-priority theme coverage notes into one update.",
    value: "weekly",
    defaultChecked: false,
  },
  {
    id: "settings-channel-webhook",
    label: "Webhook handoff",
    description: "Forward high-severity route events to workspace integrations.",
    value: "webhook",
    defaultChecked: false,
  },
] as const;

export const defaultRoleOptions = [
  {
    value: "viewer",
    label: "Viewer",
    description: "Can read workspace activity and route checks.",
  },
  {
    value: "member",
    label: "Member",
    description: "Can create checks and update shared settings.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Available after the workspace moves off Starter.",
    disabled: true,
  },
] as const;

export const securityActivity = [
  {
    event: "Two-factor check",
    actor: "Jamie Repanich",
    target: "Current browser",
    result: "Passed",
    time: "2 minutes ago",
    variant: "success",
  },
  {
    event: "Theme storage read",
    actor: "Destroyer SPA",
    target: "localStorage",
    result: "Allowed",
    time: "8 minutes ago",
    variant: "info",
  },
  {
    event: "Invite link review",
    actor: "Admin policy",
    target: "Workspace invites",
    result: "Watched",
    time: "18 minutes ago",
    variant: "secondary",
  },
  {
    event: "Session timeout check",
    actor: "Security settings",
    target: "Idle session",
    result: "Passed",
    time: "31 minutes ago",
    variant: "success",
  },
  {
    event: "Readonly profile audit",
    actor: "Destroyer SPA",
    target: "Profile fields",
    result: "Allowed",
    time: "44 minutes ago",
    variant: "info",
  },
  {
    event: "Workspace role check",
    actor: "Access policy",
    target: "Default member role",
    result: "Passed",
    time: "1 hour ago",
    variant: "success",
  },
  {
    event: "Notification route check",
    actor: "Route monitor",
    target: "Settings navigation",
    result: "Watched",
    time: "2 hours ago",
    variant: "secondary",
  },
  {
    event: "Billing access review",
    actor: "Admin policy",
    target: "Starter plan",
    result: "Allowed",
    time: "3 hours ago",
    variant: "info",
  },
  {
    event: "Profile tab visit",
    actor: "Destroyer SPA",
    target: "Access tab",
    result: "Passed",
    time: "Yesterday",
    variant: "success",
  },
  {
    event: "Invite policy sync",
    actor: "Workspace defaults",
    target: "Invite links",
    result: "Watched",
    time: "Yesterday",
    variant: "secondary",
  },
] as const;

export type SettingsPath = (typeof settingsItems)[number]["href"];

export function getActiveSettingsPath(path: string): SettingsPath {
  return settingsItems.some((item) => item.href === path) ? (path as SettingsPath) : "/settings";
}
