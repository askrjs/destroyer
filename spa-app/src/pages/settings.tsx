import { state } from "@askrjs/askr";
import { Link, currentRoute } from "@askrjs/askr/router";
import {
  BellIcon,
  Building2Icon,
  CreditCardIcon,
  FileClockIcon,
  KeyRoundIcon,
  Link2OffIcon,
  MonitorIcon,
  PaletteIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  UserRoundIcon,
} from "@askrjs/lucide";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Block,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Grid,
  Input,
  Label,
  Page,
  PageHeader,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  ScrollAreaViewport,
  Separator,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectPortal,
  SelectTrigger,
  SelectValue,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Skeleton,
  Slider,
  SliderRange,
  SliderThumb,
  SliderTrack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  ToggleGroup,
  ToggleGroupItem,
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

const notificationChannels = [
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

const defaultRoleOptions = [
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

const securityActivity = [
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

type SettingsPath = (typeof settingsItems)[number]["href"];

function getActivePath(path: string): SettingsPath {
  return settingsItems.some((item) => item.href === path) ? (path as SettingsPath) : "/settings";
}

function SettingsSidebar({ activePath }: { activePath: SettingsPath }) {
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
                <Text tone="muted" size="sm">
                  Display recent route and component checks.
                </Text>
              </Block>
              <Switch defaultChecked />
            </Block>
            <Separator decorative />
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Include contact email</Text>
                <Text tone="muted" size="sm">
                  Let teammates reach this demo account.
                </Text>
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
  const [sessionTimeout, setSessionTimeout] = state(30);
  const [activityLoading, setActivityLoading] = state(false);
  const refreshActivity = () => {
    if (activityLoading()) return;

    setActivityLoading(true);
    window.setTimeout(() => {
      setActivityLoading(false);
    }, 800);
  };

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
                <Text tone="muted" size="sm">
                  Require a verification step before signing in.
                </Text>
              </Block>
              <Switch defaultChecked />
            </Block>
            <Separator decorative />
            <Block gap="sm">
              <Block direction="row" align="center" justify="between" gap="md">
                <Block gap="0">
                  <Text weight="medium">Session timeout</Text>
                  <Text tone="muted" size="sm">
                    Automatically end idle sessions after {sessionTimeout()} minutes.
                  </Text>
                </Block>
                <Badge variant="secondary">{sessionTimeout()}m</Badge>
              </Block>
              <Slider
                aria-label="Session timeout"
                min={15}
                max={120}
                step={15}
                value={sessionTimeout()}
                onValueChange={setSessionTimeout}
              >
                <SliderTrack>
                  <SliderRange />
                  <SliderThumb aria-label="Session timeout in minutes" />
                </SliderTrack>
              </Slider>
              <Block direction="row" align="center" justify="between" gap="sm">
                <Text tone="muted" size="sm">
                  15m
                </Text>
                <Text tone="muted" size="sm">
                  2h
                </Text>
              </Block>
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
                <Text tone="muted" size="sm">
                  Local demo session
                </Text>
              </Block>
            </Block>
            <Badge variant="success">Current</Badge>
          </Block>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Security activity</CardTitle>
          <CardDescription>Recent local checks that touched account access.</CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activityLoading()}
              onPress={refreshActivity}
            >
              <FileClockIcon size={16} aria-hidden="true" />
              Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ScrollArea>
            <ScrollAreaViewport data-size="content" tabindex={0}>
              <div data-slot="data-table">
                <Table aria-label="Security activity" style={{ minInlineSize: "44rem" }}>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Event</TableHeaderCell>
                      <TableHeaderCell>Actor</TableHeaderCell>
                      <TableHeaderCell>Target</TableHeaderCell>
                      <TableHeaderCell>Result</TableHeaderCell>
                      <TableHeaderCell>Time</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activityLoading()
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={`security-activity-loading-${index}`}>
                            <TableCell>
                              <Skeleton style={{ blockSize: "1rem", inlineSize: "9rem" }} />
                            </TableCell>
                            <TableCell>
                              <Skeleton style={{ blockSize: "1rem", inlineSize: "7rem" }} />
                            </TableCell>
                            <TableCell>
                              <Skeleton style={{ blockSize: "1rem", inlineSize: "8rem" }} />
                            </TableCell>
                            <TableCell>
                              <Skeleton style={{ blockSize: "1.25rem", inlineSize: "4.5rem" }} />
                            </TableCell>
                            <TableCell>
                              <Skeleton style={{ blockSize: "1rem", inlineSize: "6rem" }} />
                            </TableCell>
                          </TableRow>
                        ))
                      : securityActivity.map((entry) => (
                          <TableRow key={`${entry.event}-${entry.time}`}>
                            <TableCell>{entry.event}</TableCell>
                            <TableCell>{entry.actor}</TableCell>
                            <TableCell>{entry.target}</TableCell>
                            <TableCell>
                              <Badge variant={entry.variant}>{entry.result}</Badge>
                            </TableCell>
                            <TableCell>{entry.time}</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollAreaViewport>
          </ScrollArea>
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
            <Block rowFrom="md" align={{ base: "start", md: "center" }} justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Workspace density</Text>
                <Text tone="muted" size="sm">
                  Choose the default spacing for data-heavy surfaces.
                </Text>
              </Block>
              <ToggleGroup aria-label="Workspace density" type="single" defaultValue="comfortable">
                <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
                <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
              </ToggleGroup>
            </Block>
            <Separator decorative />
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Sync theme mode</Text>
                <Text tone="muted" size="sm">
                  Keep theme preference in local storage.
                </Text>
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
              <Select name="region" defaultValue="us-east">
                <SelectTrigger id="settings-region">
                  <SelectValue placeholder="Choose a region" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent align="start" sideOffset={6}>
                    <SelectGroup>
                      <SelectLabel>Workspace region</SelectLabel>
                      <SelectItem value="us-east">US East</SelectItem>
                      <SelectItem value="us-west">US West</SelectItem>
                      <SelectItem value="eu-central">EU Central</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </SelectPortal>
              </Select>
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
        <Block gap="lg">
          <Block gap="md">
            {[
              ["Route alerts", "Notify when route behavior changes.", true],
              ["Component updates", "Send weekly summaries about theme coverage.", false],
              ["Security notices", "Alert when a session setting changes.", true],
            ].map(([label, description, checked]) => (
              <Block key={String(label)} direction="row" align="center" justify="between" gap="md">
                <Block gap="0">
                  <Text weight="medium">{label}</Text>
                  <Text tone="muted" size="sm">
                    {description}
                  </Text>
                </Block>
                <Switch defaultChecked={Boolean(checked)} />
              </Block>
            ))}
          </Block>
          <Separator decorative />
          <Block gap="md">
            <Block gap="xs">
              <Text weight="medium">Delivery channels</Text>
              <Text tone="muted" size="sm">
                Choose where enabled notifications can appear.
              </Text>
            </Block>
            <Grid columns={{ base: 1, md: 2 }} gap="md">
              {notificationChannels.map((channel) => (
                <Block key={channel.id} direction="row" align="start" gap="sm">
                  <Checkbox
                    id={channel.id}
                    name="notification-channel"
                    value={channel.value}
                    defaultChecked={channel.defaultChecked}
                  />
                  <Block gap="0">
                    <Label for={channel.id}>{channel.label}</Label>
                    <Text tone="muted" size="sm">
                      {channel.description}
                    </Text>
                  </Block>
                </Block>
              ))}
            </Grid>
          </Block>
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
              <Text tone="muted" size="sm">
                Plan
              </Text>
              <Text weight="semibold">Starter</Text>
            </Block>
            <Block background="muted" padding="md" radius="lg" gap="xs">
              <Text tone="muted" size="sm">
                Seats
              </Text>
              <Text weight="semibold">3 active</Text>
            </Block>
            <Block background="muted" padding="md" radius="lg" gap="xs">
              <Text tone="muted" size="sm">
                Renewal
              </Text>
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
            <Text tone="muted" size="sm">
              No invoices are generated for local demo sessions.
            </Text>
            <Button type="button" variant="outline" size="sm">
              Download sample
            </Button>
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
              <Label id="settings-access-label">Default role</Label>
              <RadioGroup
                aria-labelledby="settings-access-label"
                name="default-role"
                defaultValue="member"
                orientation="horizontal"
              >
                {defaultRoleOptions.map((role) => (
                  <RadioGroupItem
                    key={role.value}
                    value={role.value}
                    disabled={"disabled" in role ? role.disabled : false}
                  >
                    <Block gap="0">
                      <Text weight="medium">{role.label}</Text>
                      <Text tone="muted" size="sm">
                        {role.description}
                      </Text>
                    </Block>
                  </RadioGroupItem>
                ))}
              </RadioGroup>
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
                <Text tone="muted" size="sm">
                  Allow admins to create scoped invite links.
                </Text>
              </Block>
              <Switch defaultChecked />
            </Block>
            <Separator decorative />
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Require approval</Text>
                <Text tone="muted" size="sm">
                  New members need an admin review.
                </Text>
              </Block>
              <Switch />
            </Block>
          </Block>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Invite links</CardTitle>
          <CardDescription>Rotate shared links when access policy changes.</CardDescription>
          <CardAction>
            <Link2OffIcon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Block rowFrom="md" align={{ base: "start", md: "center" }} justify="between" gap="md">
            <Block gap="xs">
              <Text weight="medium">Reset all active invite links</Text>
              <Text tone="muted" size="sm">
                Existing demo invite URLs stop working and admins can generate fresh links.
              </Text>
            </Block>
            <AlertDialog>
              <AlertDialogTrigger data-slot="button" data-variant="destructive">
                <Trash2Icon size={16} aria-hidden="true" />
                Reset links
              </AlertDialogTrigger>
              <AlertDialogPortal>
                <AlertDialogOverlay />
                <AlertDialogContent>
                  <AlertDialogTitle>Reset workspace invite links?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This is a local Destroyer action, but it uses the same confirmation pattern a
                    production workspace would need before invalidating shared access.
                  </AlertDialogDescription>
                  <Block direction="row" justify="end" gap="sm">
                    <AlertDialogCancel data-slot="button" data-variant="outline">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction data-slot="button" data-variant="destructive">
                      Reset links
                    </AlertDialogAction>
                  </Block>
                </AlertDialogContent>
              </AlertDialogPortal>
            </AlertDialog>
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
