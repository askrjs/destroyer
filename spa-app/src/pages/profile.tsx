import { currentRoute } from "@askrjs/askr/router";
import { UserRoundIcon } from "@askrjs/lucide";
import {
  Badge,
  Block,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
  Page,
  PageHeader,
  Separator,
  Tab,
  Tabs,
  Text,
} from "@askrjs/themes/components";
import { demoUser } from "../auth";
import { getActiveProfilePath, profileTabs } from "../features/profile/profile-data";
import { ProfileTabContent } from "../features/profile/profile-tab-content";

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
