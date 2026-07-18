import { state } from "@askrjs/askr";
import { action, ActionForm, type ActionValidationError } from "@askrjs/askr/actions";
import { currentAuth } from "@askrjs/askr/router";
import {
  Badge,
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
  Select,
  SelectContent,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  SelectValue,
  Text,
} from "@askrjs/themes/components";
import { operatorSettingsData, updateProfileAction } from "./settings-model";

export function ProfileSettings() {
  const principal = currentAuth().principal;
  const settings = operatorSettingsData(principal?.id ?? "anonymous");
  const update = action<{
    displayName: string;
    profileVisibility: "workspace" | "private";
    version: string;
  }>(updateProfileAction);
  const initialError = update.state().error as ActionValidationError | undefined;
  const [displayName, setDisplayName] = state<string>(
    initialError?.kind === "invalid" && typeof initialError.values.displayName === "string"
      ? initialError.values.displayName
      : String(settings.data?.displayName ?? principal?.name ?? ""),
  );
  const [visibility, setVisibility] = state<"workspace" | "private">(
    settings.data?.profileVisibility ?? "workspace",
  );
  const mutationError = state("");
  const fieldError = (update.state().error as ActionValidationError | undefined)?.fieldErrors
    .displayName?.[0];

  return (
    <Card variant="raised">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Personal details stored with optimistic version checks.</CardDescription>
        <CardAction>
          <Badge variant="success">Signed in</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ActionForm
          action={updateProfileAction}
          onSubmit={(event: Event) => {
            event.preventDefault();
            mutationError.set("");
            void update
              .submit({
                displayName: displayName(),
                profileVisibility: visibility(),
                version: String(settings.data?.version ?? 1),
              })
              .catch((error: unknown) =>
                mutationError.set(
                  error instanceof Error ? error.message : "Profile update failed.",
                ),
              );
          }}
        >
          <Grid columns={{ base: 1, md: 2 }} gap="md">
            <Field>
              <Label for="settings-name">Display name</Label>
              <Input
                id="settings-name"
                name="displayName"
                value={displayName()}
                onInput={(event: Event) => setDisplayName((event.target as HTMLInputElement).value)}
              />
              {fieldError ? <Text tone="danger">{fieldError}</Text> : null}
            </Field>
            <Field>
              <Label for="settings-email">Email</Label>
              <Input id="settings-email" value={principal?.email ?? ""} readonly />
            </Field>
            <Field>
              <Label for="settings-visibility">Profile visibility</Label>
              <Select
                name="profileVisibility"
                value={visibility()}
                onValueChange={(value) => {
                  if (value === "workspace" || value === "private") setVisibility(value);
                }}
              >
                <SelectTrigger id="settings-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent>
                    <SelectItem value="workspace">Workspace members</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </SelectPortal>
              </Select>
            </Field>
          </Grid>
          {mutationError() ? (
            <Text tone="danger" role="alert">
              {mutationError()}
            </Text>
          ) : null}
          <Button type="submit" variant="primary" disabled={update.state().pending}>
            {update.state().pending ? "Saving…" : "Save profile"}
          </Button>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
