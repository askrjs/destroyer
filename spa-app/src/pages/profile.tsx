import { currentRoute } from "@askrjs/askr/router";
import { ShieldCheckIcon, UserRoundIcon } from "@askrjs/lucide";
import {
  Badge,
  Block,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Grid,
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
  Page,
  PageHeader,
  Separator,
  Tab,
  Tabs,
  Text,
} from "@askrjs/themes/components";
import { demoUser } from "../auth";

const profileTabs = [
  { href: "/profile", label: "Overview" },
  { href: "/profile/activity", label: "Activity" },
  { href: "/profile/access", label: "Access" },
] as const;

type ProfilePath = (typeof profileTabs)[number]["href"];

function getActiveProfilePath(path: string): ProfilePath {
  return profileTabs.some((tab) => tab.href === path) ? (path as ProfilePath) : "/profile";
}

function ProfileOverview() {
  return (
    <Block direction="column" gap="md">
      <Text tone="muted">
        This profile is intentionally local to the sample app. It gives the shell a realistic
        signed-in state without requiring a backend.
      </Text>
      <Grid columns={{ base: 1, md: 2 }} gap="md">
        <Block background="muted" padding="md" radius="lg" gap="xs">
          <Text tone="muted" size="sm">
            Workspace
          </Text>
          <Text weight="semibold">Destroyer</Text>
        </Block>
        <Block background="muted" padding="md" radius="lg" gap="xs">
          <Text tone="muted" size="sm">
            Session scope
          </Text>
          <Text weight="semibold">Local browser</Text>
        </Block>
      </Grid>
    </Block>
  );
}

function ProfileActivity() {
  const activity = [
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

  return (
    <Block direction="column" gap="md">
      {activity.map((entry) => (
        <Block key={entry.title} direction="row" gap="md" align="start">
          <HoverCard openDelay={120} closeDelay={120}>
            <HoverCardTrigger data-variant="plain">
              <Badge variant="outline">{entry.surface}</Badge>
            </HoverCardTrigger>
            <HoverCardPortal>
              <HoverCardContent side="top" align="start" sideOffset={8}>
                <Block gap="xs">
                  <Text weight="semibold" size="sm">
                    {entry.owner}
                  </Text>
                  <Text tone="muted" size="sm">
                    {entry.detail}
                  </Text>
                </Block>
              </HoverCardContent>
            </HoverCardPortal>
          </HoverCard>
          <Block gap="0">
            <Text weight="medium">{entry.title}</Text>
            <Text tone="muted" size="sm">
              {entry.description}
            </Text>
          </Block>
        </Block>
      ))}
    </Block>
  );
}

function ProfileAccess() {
  return (
    <Block direction="column" gap="md">
      <Block direction="row" align="center" justify="between" gap="md">
        <Block gap="0">
          <Text weight="medium">Workspace role</Text>
          <Text tone="muted" size="sm">
            Review the access model attached to this local demo identity.
          </Text>
        </Block>
        <Badge variant="secondary">Member</Badge>
      </Block>
      <Separator decorative />
      <Dialog>
        <DialogTrigger data-slot="button" data-variant="outline">
          <ShieldCheckIcon size={16} aria-hidden="true" />
          Review access
        </DialogTrigger>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>
            <DialogTitle>Workspace access</DialogTitle>
            <DialogDescription>
              {demoUser.name} is using a local demo session for the Destroyer workspace.
            </DialogDescription>
            <Block direction="column" gap="md">
              <Block direction="row" align="center" justify="between" gap="md">
                <Text tone="muted" size="sm">
                  Role
                </Text>
                <Badge variant="secondary">Member</Badge>
              </Block>
              <Block direction="row" align="center" justify="between" gap="md">
                <Text tone="muted" size="sm">
                  Session
                </Text>
                <Badge variant="success">Active</Badge>
              </Block>
              <Block direction="row" align="center" justify="between" gap="md">
                <Text tone="muted" size="sm">
                  Scope
                </Text>
                <Text weight="semibold" size="sm">
                  Local browser
                </Text>
              </Block>
            </Block>
            <Block direction="row" justify="end" gap="sm">
              <DialogClose data-slot="button" data-variant="outline">
                Close
              </DialogClose>
            </Block>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </Block>
  );
}

function ProfileTabContent({ activePath }: { activePath: ProfilePath }) {
  if (activePath === "/profile/activity") return <ProfileActivity />;
  if (activePath === "/profile/access") return <ProfileAccess />;
  return <ProfileOverview />;
}

export function ProfilePage() {
  const activePath = getActiveProfilePath(currentRoute().path);

  return (
    <Page>
      <PageHeader
        title="Profile"
        description="Demo account details shown with Askr theme primitives."
      />

      <Grid
        as="section"
        columns={{ base: 1, lg: "minmax(0, 0.9fr) minmax(18rem, 0.6fr)" }}
        gap="lg"
      >
        <Card variant="raised">
          <CardHeader>
            <CardTitle>{demoUser.name}</CardTitle>
            <CardDescription>{demoUser.email}</CardDescription>
            <CardAction>
              <Badge variant="success">Signed in</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Block direction="column" gap="md">
              <Tabs aria-label="Profile sections">
                {profileTabs.map((tab) => (
                  <Tab key={tab.href} href={tab.href} match="exact">
                    {tab.label}
                  </Tab>
                ))}
              </Tabs>
              <Separator decorative />
              <ProfileTabContent activePath={activePath} />
            </Block>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Current sample identity.</CardDescription>
            <CardAction>
              <UserRoundIcon size={18} aria-hidden="true" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <Block direction="column" gap="sm">
              <Text size="sm" tone="muted">
                Display name
              </Text>
              <Text weight="semibold">{demoUser.name}</Text>
              <Text size="sm" tone="muted">
                Email
              </Text>
              <Text weight="semibold">{demoUser.email}</Text>
              <Separator decorative />
              <Block direction="row" align="center" justify="between" gap="md">
                <Text tone="muted" size="sm">
                  Role
                </Text>
                <Badge variant="secondary">Member</Badge>
              </Block>
            </Block>
          </CardContent>
        </Card>
      </Grid>
    </Page>
  );
}
