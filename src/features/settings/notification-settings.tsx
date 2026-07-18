import { state } from "@askrjs/askr";
import { action, ActionForm } from "@askrjs/askr/actions";
import { currentAuth } from "@askrjs/askr/router";
import { BellIcon } from "@askrjs/lucide";
import {
  Block,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  SelectValue,
  Text,
} from "@askrjs/themes/components";
import { operatorSettingsData, updateNotificationsAction } from "./settings-model";

export function NotificationSettings() {
  const settings = operatorSettingsData(currentAuth().principal?.id ?? "anonymous");
  const save = action<{ inAppNotifications: "enabled" | "disabled"; version: string }>(
    updateNotificationsAction,
  );
  const [value, setValue] = state<"enabled" | "disabled">(
    settings.data?.inAppNotifications === false ? "disabled" : "enabled",
  );
  const mutationError = state("");
  return (
    <Card variant="raised">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Destroyer supports only in-app notifications.</CardDescription>
        <CardAction>
          <BellIcon size={18} aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ActionForm
          action={updateNotificationsAction}
          onSubmit={(event: Event) => {
            event.preventDefault();
            mutationError.set("");
            void save
              .submit({ inAppNotifications: value(), version: String(settings.data?.version ?? 1) })
              .catch((error: unknown) =>
                mutationError.set(
                  error instanceof Error ? error.message : "Notification update failed.",
                ),
              );
          }}
        >
          <Field>
            <Label for="settings-notifications">In-app notifications</Label>
            <Select
              name="inAppNotifications"
              value={value()}
              onValueChange={(nextValue) => {
                if (nextValue === "enabled" || nextValue === "disabled") setValue(nextValue);
              }}
            >
              <SelectTrigger id="settings-notifications">
                <SelectValue />
              </SelectTrigger>
              <SelectPortal>
                <SelectContent>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </SelectPortal>
            </Select>
          </Field>
          <Block gap="sm">
            <Text tone="muted" size="sm">
              No external email, webhook, or scheduled delivery is claimed.
            </Text>
            {mutationError() ? (
              <Text tone="danger" role="alert">
                {mutationError()}
              </Text>
            ) : null}
          </Block>
          <Button type="submit" variant="primary" disabled={save.state().pending}>
            Save notifications
          </Button>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
