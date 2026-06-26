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
  Text,
} from "@askrjs/themes/components";
import { demoUser } from "../auth";

export function ProfilePage() {
  return (
    <Page>
      <PageHeader
        title="Profile"
        description="Demo account details shown with Askr theme primitives."
      />

      <Grid as="section" columns={{ base: 1, lg: "minmax(0, 0.9fr) minmax(18rem, 0.6fr)" }} gap="lg">
        <Card variant="raised">
          <CardHeader>
            <CardTitle>{demoUser.name}</CardTitle>
            <CardDescription>{demoUser.email}</CardDescription>
            <CardAction>
              <Badge variant="success">Signed in</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Block direction="column" gap="sm">
              <Text tone="muted">
                This profile is intentionally local to the sample app. It gives the shell a realistic
                signed-in state without requiring a backend.
              </Text>
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
              <Text size="sm" tone="muted">Display name</Text>
              <Text weight="semibold">{demoUser.name}</Text>
              <Text size="sm" tone="muted">Email</Text>
              <Text weight="semibold">{demoUser.email}</Text>
            </Block>
          </CardContent>
        </Card>
      </Grid>
    </Page>
  );
}
