import { currentRoute, navigate } from "@askrjs/askr/router";
import {
  BellIcon,
  Building2Icon,
  CreditCardIcon,
  KeyRoundIcon,
  MonitorIcon,
  PaletteIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  UserRoundIcon,
} from "@askrjs/lucide";
import {
  Badge,
  Block,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Grid,
  Input,
  Label,
  Page,
  PageHeader,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Switch,
  Text,
} from "@askrjs/themes/components";
import { demoUser } from "../auth";

const settingsItems = [
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

type SettingsPath = (typeof settingsItems)[number]["href"];

function getActivePath(path: string): SettingsPath {
  return settingsItems.some((item) => item.href === path) ? (path as SettingsPath) : "/settings";
}

function SettingsSidebar({ activePath }: { activePath: SettingsPath }) {
  const groups = ["Account", "Workspace", "Admin"] as const;

  return (
    <Sidebar width="full" minHeight="auto" padding="0" shrink={false}>
      <SidebarHeader>
        <Text as="strong" weight="semibold">Settings</Text>
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
                        <SidebarMenuButton
                          active={activePath === item.href}
                          onClick={() => navigate(item.href)}
                        >
                          <Icon size={16} aria-hidden="true" />
                          <Text as="span" size="sm" weight="medium">{item.label}</Text>
                          {badge ? <Badge variant="secondary">{badge}</Badge> : null}
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

function ProfileSettings() {
  return (
    <Block gap="lg">
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Personal details used across the Destroyer workspace.</CardDescription>
          <CardAction>
            <Badge variant="success">Signed in</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Grid columns={{ base: 1, md: 2 }} gap="md">
            <Field>
              <Label for="settings-name">Display name</Label>
              <Input id="settings-name" value={demoUser.name} readonly />
            </Field>
            <Field>
              <Label for="settings-email">Email</Label>
              <Input id="settings-email" value={demoUser.email} readonly />
            </Field>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Public profile</CardTitle>
          <CardDescription>Control what other workspace members can see.</CardDescription>
        </CardHeader>
        <CardContent>
          <Block gap="md">
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Show workspace activity</Text>
                <Text tone="muted" size="sm">Display recent route and component checks.</Text>
              </Block>
              <Switch defaultChecked />
            </Block>
            <Separator decorative />
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Include contact email</Text>
                <Text tone="muted" size="sm">Let teammates reach this demo account.</Text>
              </Block>
              <Switch />
            </Block>
          </Block>
        </CardContent>
      </Card>
    </Block>
  );
}

function SecuritySettings() {
  return (
    <Block gap="lg">
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Keep the local demo session locked down.</CardDescription>
          <CardAction>
            <KeyRoundIcon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Block gap="md">
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Two-factor authentication</Text>
                <Text tone="muted" size="sm">Require a verification step before signing in.</Text>
              </Block>
              <Switch defaultChecked />
            </Block>
            <Separator decorative />
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Session timeout</Text>
                <Text tone="muted" size="sm">Automatically end idle sessions after 30 minutes.</Text>
              </Block>
              <Badge variant="secondary">30m</Badge>
            </Block>
          </Block>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>Devices currently using this browser session.</CardDescription>
        </CardHeader>
        <CardContent>
          <Block direction="row" align="center" justify="between" gap="md">
            <Block direction="row" align="center" gap="md">
              <MonitorIcon size={18} aria-hidden="true" />
              <Block gap="0">
                <Text weight="medium">Current browser</Text>
                <Text tone="muted" size="sm">Local demo session</Text>
              </Block>
            </Block>
            <Badge variant="success">Current</Badge>
          </Block>
        </CardContent>
      </Card>
    </Block>
  );
}

function PreferenceSettings() {
  return (
    <Block gap="lg">
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Personalize the workspace experience.</CardDescription>
          <CardAction>
            <SlidersHorizontalIcon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Block gap="md">
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Compact density</Text>
                <Text tone="muted" size="sm">Use tighter spacing in data-heavy surfaces.</Text>
              </Block>
              <Switch />
            </Block>
            <Separator decorative />
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Sync theme mode</Text>
                <Text tone="muted" size="sm">Keep theme preference in local storage.</Text>
              </Block>
              <Switch defaultChecked />
            </Block>
          </Block>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Display defaults</CardTitle>
          <CardDescription>Default UI choices for new workspace views.</CardDescription>
        </CardHeader>
        <CardContent>
          <Grid columns={{ base: 1, md: 2 }} gap="md">
            <Field>
              <Label for="settings-view">Default view</Label>
              <Input id="settings-view" value="Dashboard" readonly />
            </Field>
            <Field>
              <Label for="settings-region">Region</Label>
              <Input id="settings-region" value="US East" readonly />
            </Field>
          </Grid>
        </CardContent>
      </Card>
    </Block>
  );
}

function NotificationSettings() {
  return (
    <Card variant="raised">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose how Destroyer should keep you informed.</CardDescription>
        <CardAction>
          <BellIcon size={18} aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Block gap="md">
          {[
            ["Route alerts", "Notify when route behavior changes.", true],
            ["Component updates", "Send weekly summaries about theme coverage.", false],
            ["Security notices", "Alert when a session setting changes.", true],
          ].map(([label, description, checked]) => (
            <Block key={String(label)} direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">{label}</Text>
                <Text tone="muted" size="sm">{description}</Text>
              </Block>
              <Switch defaultChecked={Boolean(checked)} />
            </Block>
          ))}
        </Block>
      </CardContent>
    </Card>
  );
}

function BillingSettings() {
  return (
    <Block gap="lg">
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Plan and billing details for this workspace.</CardDescription>
          <CardAction>
            <Badge variant="info">Starter</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Grid columns={{ base: 1, md: 3 }} gap="md">
            <Block background="muted" padding="md" radius="lg" gap="xs">
              <Text tone="muted" size="sm">Plan</Text>
              <Text weight="semibold">Starter</Text>
            </Block>
            <Block background="muted" padding="md" radius="lg" gap="xs">
              <Text tone="muted" size="sm">Seats</Text>
              <Text weight="semibold">3 active</Text>
            </Block>
            <Block background="muted" padding="md" radius="lg" gap="xs">
              <Text tone="muted" size="sm">Renewal</Text>
              <Text weight="semibold">Demo only</Text>
            </Block>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Recent billing activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Block direction="row" align="center" justify="between" gap="md">
            <Text tone="muted" size="sm">No invoices are generated for local demo sessions.</Text>
            <Button type="button" variant="outline" size="sm">Download sample</Button>
          </Block>
        </CardContent>
      </Card>
    </Block>
  );
}

function WorkspaceSettings() {
  return (
    <Block gap="lg">
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Team defaults and access controls.</CardDescription>
          <CardAction>
            <Building2Icon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Grid columns={{ base: 1, md: 2 }} gap="md">
            <Field>
              <Label for="settings-workspace-name">Workspace name</Label>
              <Input id="settings-workspace-name" value="Destroyer" readonly />
            </Field>
            <Field>
              <Label for="settings-access">Default role</Label>
              <Input id="settings-access" value="Member" readonly />
            </Field>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Access</CardTitle>
          <CardDescription>Controls for new teammates and shared links.</CardDescription>
        </CardHeader>
        <CardContent>
          <Block gap="md">
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Invite links</Text>
                <Text tone="muted" size="sm">Allow admins to create scoped invite links.</Text>
              </Block>
              <Switch defaultChecked />
            </Block>
            <Separator decorative />
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Require approval</Text>
                <Text tone="muted" size="sm">New members need an admin review.</Text>
              </Block>
              <Switch />
            </Block>
          </Block>
        </CardContent>
      </Card>
    </Block>
  );
}

function SettingsContent({ activePath }: { activePath: SettingsPath }) {
  if (activePath === "/settings/security") return <SecuritySettings />;
  if (activePath === "/settings/preferences") return <PreferenceSettings />;
  if (activePath === "/settings/notifications") return <NotificationSettings />;
  if (activePath === "/settings/billing") return <BillingSettings />;
  if (activePath === "/settings/workspace") return <WorkspaceSettings />;
  return <ProfileSettings />;
}

export function SettingsPage() {
  const activePath = getActivePath(currentRoute().path);

  return (
    <Page>
      <PageHeader
        title="Settings"
        description="A realistic settings surface with nested Askr workspace sections."
      />

      <Grid columns={{ base: 1, lg: "14rem minmax(0, 1fr)" }} gap="md">
        <SettingsSidebar activePath={activePath} />
        <SettingsContent activePath={activePath} />
      </Grid>
    </Page>
  );
}
