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
    version: string;
  }>(updatePreferencesAction);
  const [density, setDensity] = state(settings.data?.density ?? "comfortable");
  const [region, setRegion] = state(settings.data?.region ?? "us-east");
  const [theme, setTheme] = state(settings.data?.theme ?? "system");
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
                version: String(settings.data?.version ?? 1),
              })
              .catch((error: unknown) =>
                mutationError.set(
                  error instanceof Error ? error.message : "Preferences update failed.",
                ),
              );
          }}
        >
          <Grid columns={{ base: 1, md: 3 }} gap="md">
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
        </ActionForm>
      </CardContent>
    </Card>
  );
}
