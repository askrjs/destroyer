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
              <select
                id="settings-density"
                value={density()}
                onChange={(event: Event) =>
                  setDensity((event.target as HTMLSelectElement).value as "comfortable" | "compact")
                }
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </Field>
            <Field>
              <Label for="settings-region">Region</Label>
              <select
                id="settings-region"
                value={region()}
                onChange={(event: Event) =>
                  setRegion(
                    (event.target as HTMLSelectElement).value as "us-east" | "us-west" | "eu-west",
                  )
                }
              >
                <option value="us-east">US East</option>
                <option value="us-west">US West</option>
                <option value="eu-west">EU West</option>
              </select>
            </Field>
            <Field>
              <Label for="settings-theme">Theme preference</Label>
              <select
                id="settings-theme"
                value={theme()}
                onChange={(event: Event) =>
                  setTheme((event.target as HTMLSelectElement).value as "system" | "light" | "dark")
                }
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
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
