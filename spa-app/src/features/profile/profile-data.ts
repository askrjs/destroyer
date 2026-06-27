export const profileTabs = [
  { href: "/profile", label: "Overview" },
  { href: "/profile/activity", label: "Activity" },
  { href: "/profile/access", label: "Access" },
] as const;

export type ProfilePath = (typeof profileTabs)[number]["href"];

export const profileActivity = [
  {
    title: "Opened settings",
    description: "Checked notification and workspace controls.",
    surface: "Settings",
    owner: "Local session",
    detail: "Route-backed settings kept sidebar active state and form controls in sync.",
  },
  {
    title: "Reviewed docs",
    description: "Expanded route verification notes in the docs shell.",
    surface: "Docs",
    owner: "Theme audit",
    detail: "Accordion state, collapsed rail hints, and docs navigation were reviewed together.",
  },
  {
    title: "Queued support note",
    description: "Used the contact workflow toast confirmation.",
    surface: "Contact",
    owner: "Support flow",
    detail: "Toast timing and close behavior were checked from the real contact form.",
  },
] as const;

export function getActiveProfilePath(path: string): ProfilePath {
  return profileTabs.some((tab) => tab.href === path) ? (path as ProfilePath) : "/profile";
}
