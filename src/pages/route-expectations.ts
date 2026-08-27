export interface RouteExpectation {
  readonly path: string;
  readonly authenticated: boolean;
  readonly heading: string;
}

export const routeExpectations: readonly RouteExpectation[] = [
  { path: "/", authenticated: false, heading: "Design system baseline" },
  { path: "/about", authenticated: false, heading: "About" },
  { path: "/contact", authenticated: false, heading: "Contact" },
  { path: "/docs", authenticated: false, heading: "Askr documentation" },
  { path: "/docs/installation", authenticated: false, heading: "Installation" },
  { path: "/docs/routing", authenticated: false, heading: "Routing" },
  { path: "/docs/theming", authenticated: false, heading: "Theming" },
  { path: "/docs/components", authenticated: false, heading: "Components" },
  { path: "/docs/forms", authenticated: false, heading: "Forms" },
  { path: "/docs/layouts", authenticated: false, heading: "Layouts" },
  { path: "/docs/settings", authenticated: false, heading: "Settings shell" },
  { path: "/docs/deployment", authenticated: false, heading: "Deployment" },
  { path: "/login", authenticated: false, heading: "Sign in" },
  { path: "/signup", authenticated: false, heading: "Create account" },
  { path: "/logs", authenticated: true, heading: "Logs" },
  { path: "/incidents", authenticated: true, heading: "Incidents" },
  { path: "/metrics", authenticated: true, heading: "Metrics" },
  { path: "/logout", authenticated: true, heading: "Sign out" },
  { path: "/profile", authenticated: true, heading: "Profile" },
  { path: "/profile/activity", authenticated: true, heading: "Profile" },
  { path: "/profile/access", authenticated: true, heading: "Profile" },
  { path: "/settings", authenticated: true, heading: "Settings" },
  { path: "/settings/security", authenticated: true, heading: "Settings" },
  { path: "/settings/preferences", authenticated: true, heading: "Settings" },
  { path: "/settings/notifications", authenticated: true, heading: "Settings" },
  { path: "/settings/billing", authenticated: true, heading: "Settings" },
  { path: "/settings/workspace", authenticated: true, heading: "Settings" },
];

export const unknownRouteExpectation = {
  path: "/route-that-does-not-exist",
  heading: "Not found",
} as const;
