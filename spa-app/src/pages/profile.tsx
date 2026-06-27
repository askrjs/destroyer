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
  Page,
  PageHeader,
  Separator,
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
            <Block direction="column" gap="sm">
              <Text tone="muted">
                This profile is intentionally local to the sample app. It gives the shell a
                realistic signed-in state without requiring a backend.
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
              <Text size="sm" tone="muted">
                Display name
              </Text>
              <Text weight="semibold">{demoUser.name}</Text>
              <Text size="sm" tone="muted">
                Email
              </Text>
              <Text weight="semibold">{demoUser.email}</Text>
              <Separator decorative />
              <Dialog>
                <DialogTrigger data-slot="button" data-variant="outline" data-width="full">
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
          </CardContent>
        </Card>
      </Grid>
    </Page>
  );
}
