import { state } from "@askrjs/askr";
import { action, ActionForm } from "@askrjs/askr/actions";
import { currentAuth } from "@askrjs/askr/router";
import { SlidersHorizontalIcon } from "@askrjs/lucide";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Grid,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  SelectValue,
  Text,
} from "@askrjs/themes/components";
import { operatorSettingsData, updatePreferencesAction } from "./settings-model";

export function PreferenceSettings() {
  const settings = operatorSettingsData(currentAuth().principal?.id ?? "anonymous");
  const save = action<{
    density: "comfortable" | "compact";
    region: "us-east" | "us-west" | "eu-west";
    theme: "system" | "light" | "dark";
    timezone: "America/New_York" | "America/Los_Angeles" | "Europe/Dublin";
    version: string;
  }>(updatePreferencesAction);
  const [density, setDensity] = state(settings.data?.density ?? "comfortable");
  const [region, setRegion] = state(settings.data?.region ?? "us-east");
  const [theme, setTheme] = state(settings.data?.theme ?? "system");
  const [timezone, setTimezone] = state(settings.data?.timezone ?? "America/New_York");
  const mutationError = state("");
  return (
    <Card variant="raised">
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Persisted display defaults for this operator.</CardDescription>
        <CardAction>
          <SlidersHorizontalIcon size={18} aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ActionForm
          action={updatePreferencesAction}
          onSubmit={(event: Event) => {
            event.preventDefault();
            mutationError.set("");
            void save
              .submit({
                density: density(),
                region: region(),
                theme: theme(),
                timezone: timezone(),
                version: String(settings.data?.version ?? 1),
              })
              .catch((error: unknown) =>
                mutationError.set(
                  error instanceof Error ? error.message : "Preferences update failed.",
                ),
              );
          }}
        >
          <Grid columns={{ base: 1, md: 2 }} gap="md">
            <Field>
              <Label for="settings-timezone">Timezone</Label>
              <Select
                name="timezone"
                value={timezone()}
                onValueChange={(value) => {
                  if (
                    value === "America/New_York" ||
                    value === "America/Los_Angeles" ||
                    value === "Europe/Dublin"
                  )
                    setTimezone(value);
                }}
              >
                <SelectTrigger id="settings-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent>
                    {region() === "us-east" ? (
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    ) : null}
                    {region() === "us-west" ? (
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    ) : null}
                    {region() === "eu-west" ? (
                      <SelectItem value="Europe/Dublin">Dublin Time</SelectItem>
                    ) : null}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </Field>
            <Field>
              <Label for="settings-density">Workspace density</Label>
              <Select
                name="density"
                value={density()}
                onValueChange={(value) => {
                  if (value === "comfortable" || value === "compact") setDensity(value);
                }}
              >
                <SelectTrigger id="settings-density">
                  <SelectValue />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </SelectPortal>
              </Select>
            </Field>
            <Field>
              <Label for="settings-region">Region</Label>
              <Select
                name="region"
                value={region()}
                onValueChange={(value) => {
                  if (value === "us-east" || value === "us-west" || value === "eu-west") {
                    setRegion(value);
                    setTimezone(
                      value === "us-east"
                        ? "America/New_York"
                        : value === "us-west"
                          ? "America/Los_Angeles"
                          : "Europe/Dublin",
                    );
                  }
                }}
              >
                <SelectTrigger id="settings-region">
                  <SelectValue />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent>
                    <SelectItem value="us-east">US East</SelectItem>
                    <SelectItem value="us-west">US West</SelectItem>
                    <SelectItem value="eu-west">EU West</SelectItem>
                  </SelectContent>
                </SelectPortal>
              </Select>
            </Field>
            <Field>
              <Label for="settings-theme">Theme preference</Label>
              <Select
                name="theme"
                value={theme()}
                onValueChange={(value) => {
                  if (value === "system" || value === "light" || value === "dark") setTheme(value);
                }}
              >
                <SelectTrigger id="settings-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
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
          <Button type="submit" variant="primary" disabled={save.state().pending}>
            Save preferences
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={save.state().pending}
            onPress={() => {
              setDensity(settings.data?.density ?? "comfortable");
              setRegion(settings.data?.region ?? "us-east");
              setTheme(settings.data?.theme ?? "system");
              setTimezone(settings.data?.timezone ?? "America/New_York");
              mutationError.set("");
            }}
          >
            Reset preferences
          </Button>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
