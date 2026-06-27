import {
  Badge,
  Block,
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
  Separator,
  Switch,
  Text,
} from "@askrjs/themes/components";
import { demoUser } from "../../auth";

export function ProfileSettings() {
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
