export const profileTabs = [
  { href: "/profile", label: "Overview" },
  { href: "/profile/activity", label: "Activity" },
  { href: "/profile/access", label: "Access" },
] as const;

export type ProfilePath = (typeof profileTabs)[number]["href"];

export function getActiveProfilePath(path: string): ProfilePath {
  return profileTabs.some((tab) => tab.href === path) ? (path as ProfilePath) : "/profile";
}
