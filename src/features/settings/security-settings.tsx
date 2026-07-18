import { state } from "@askrjs/askr";
import { action, ActionForm } from "@askrjs/askr/actions";
import { currentAuth } from "@askrjs/askr/router";
import { KeyRoundIcon } from "@askrjs/lucide";
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
  DataTable,
  Field,
  Label,
  Slider,
  SliderRange,
  SliderThumb,
  SliderTrack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@askrjs/themes/components";
import { operatorActivityData, operatorSettingsData, updateSecurityAction } from "./settings-model";

export function SecuritySettings() {
  const principalId = currentAuth().principal?.id ?? "anonymous";
  const settings = operatorSettingsData(principalId);
  const activity = operatorActivityData(principalId);
  const save = action<{ sessionTimeoutMinutes: string; version: string }>(updateSecurityAction);
  const [sessionTimeout, setSessionTimeout] = state(settings.data?.sessionTimeoutMinutes ?? 30);
  const mutationError = state("");

  return (
    <Block gap="lg">
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Session policy backed by persisted operator settings.</CardDescription>
          <CardAction>
            <KeyRoundIcon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={updateSecurityAction}
            onSubmit={(event: Event) => {
              event.preventDefault();
              mutationError.set("");
              void save
                .submit({
                  sessionTimeoutMinutes: String(sessionTimeout()),
                  version: String(settings.data?.version ?? 1),
                })
                .catch((error: unknown) =>
                  mutationError.set(
                    error instanceof Error ? error.message : "Security update failed.",
                  ),
                );
            }}
          >
            <Field>
              <Block direction="row" align="center" justify="between" gap="md">
                <Block gap="0">
                  <Label for="session-timeout">Session timeout</Label>
                  <Text tone="muted" size="sm">
                    End idle sessions after {sessionTimeout()} minutes.
                  </Text>
                </Block>
                <Badge variant="secondary">{sessionTimeout()}m</Badge>
              </Block>
              <Slider
                id="session-timeout"
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
            </Field>
            {mutationError() ? (
              <Text tone="danger" role="alert">
                {mutationError()}
              </Text>
            ) : null}
            <Button type="submit" variant="primary" disabled={save.state().pending}>
              {save.state().pending ? "Saving…" : "Save security"}
            </Button>
          </ActionForm>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Security activity</CardTitle>
          <CardDescription>Persisted account and settings audit events.</CardDescription>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onPress={() => void activity.refresh()}>
              Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable>
            <Table aria-label="Security activity">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Event</TableHeaderCell>
                  <TableHeaderCell>Target</TableHeaderCell>
                  <TableHeaderCell>Time</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(activity.data ?? []).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.action}</TableCell>
                    <TableCell>{entry.target}</TableCell>
                    <TableCell>{new Date(entry.occurredAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTable>
        </CardContent>
      </Card>
    </Block>
  );
}
