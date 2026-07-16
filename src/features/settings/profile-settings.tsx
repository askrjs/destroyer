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
  Separator,
  Switch,
  Text,
} from "@askrjs/themes/components";
import { currentAuth } from "@askrjs/askr/router";
import { state } from "@askrjs/askr";
import { action, ActionForm, type ActionValidationError } from "@askrjs/askr/actions";
import { operatorProfileData, updateProfileAction } from "./profile-model";

export function ProfileSettings() {
  const principal = currentAuth().principal;
  const profile = operatorProfileData(principal?.id ?? "anonymous");
  const update = action<{ displayName: string; version: string }>(updateProfileAction);
  const initialError = update.state().error as ActionValidationError | undefined;
  const initialName =
    initialError?.kind === "invalid" && typeof initialError.values.displayName === "string"
      ? initialError.values.displayName
      : (profile.data?.displayName ?? (typeof principal?.name === "string" ? principal.name : ""));
  const [displayName, setDisplayName] = state(initialName);
  const error = (update.state().error as ActionValidationError | undefined)?.fieldErrors
    .displayName?.[0];
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
          <ActionForm
            action={updateProfileAction}
            onSubmit={(event: Event) => {
              event.preventDefault();
              void update
                .submit({ displayName: displayName(), version: String(profile.data?.version ?? 1) })
                .catch(() => undefined);
            }}
          >
            <Grid columns={{ base: 1, md: 2 }} gap="md">
              <Field>
                <Label for="settings-name">Display name</Label>
                <Input
                  id="settings-name"
                  name="displayName"
                  value={displayName()}
                  onInput={(event: Event) =>
                    setDisplayName((event.target as HTMLInputElement).value)
                  }
                />
                <input type="hidden" name="version" value={profile.data?.version ?? 1} />
                {error ? (
                  <Text tone="danger" role="alert">
                    {error}
                  </Text>
                ) : null}
              </Field>
              <Field>
                <Label for="settings-email">Email</Label>
                <Input
                  id="settings-email"
                  value={typeof principal?.email === "string" ? principal.email : ""}
                  readonly
                />
              </Field>
            </Grid>
            <Button type="submit" variant="primary" disabled={update.state().pending}>
              Save profile
            </Button>
          </ActionForm>
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
