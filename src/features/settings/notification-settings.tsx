import { state } from "@askrjs/askr";
import { action } from "@askrjs/askr/actions";
import { currentAuth } from "@askrjs/askr/router";
import { BellIcon } from "@askrjs/lucide";
import {
  Block,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Label,
  Switch,
  Text,
} from "@askrjs/themes/components";
import { operatorSettingsData, updateNotificationsAction } from "./settings-model";
import type { OperatorSettings } from "../../server/contracts";

export function NotificationSettings() {
  const settings = operatorSettingsData(currentAuth().principal?.id ?? "anonymous");
  const save = action<
    { inAppNotifications: "enabled" | "disabled"; version: string },
    OperatorSettings
  >(updateNotificationsAction);
  const [value, setValue] = state<"enabled" | "disabled">(
    settings.data?.inAppNotifications === false ? "disabled" : "enabled",
  );
  const mutationError = state("");
  let committed = value();
  let version = settings.data?.version ?? 1;
  let draining = false;
  const persistFinalIntent = async () => {
    if (draining) return;
    draining = true;
    mutationError.set("");
    try {
      while (committed !== value()) {
        const intended = value();
        const result = await save.submit({
          inAppNotifications: intended,
          version: String(version),
        });
        committed = intended;
        version = result.version;
      }
    } catch (error) {
      mutationError.set(error instanceof Error ? error.message : "Notification update failed.");
    } finally {
      draining = false;
      if (!mutationError() && committed !== value()) void persistFinalIntent();
    }
  };
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
        <Block gap="md">
          <Field>
            <Label for="settings-notifications">In-app notifications</Label>
            <Switch
              id="settings-notifications"
              name="inAppNotifications"
              checked={value() === "enabled"}
              onCheckedChange={(checked) => {
                setValue(checked ? "enabled" : "disabled");
                void persistFinalIntent();
              }}
            />
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
          <Text tone="muted" size="sm" role="status">
            {save.state().pending
              ? "Saving notification preference…"
              : "Notification preference saved."}
          </Text>
        </Block>
      </CardContent>
    </Card>
  );
}
