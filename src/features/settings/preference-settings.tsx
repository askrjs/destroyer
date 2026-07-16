import { SlidersHorizontalIcon } from "@askrjs/lucide";
import {
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectPortal,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from "@askrjs/themes/components";

export function PreferenceSettings() {
  return (
    <Block gap="lg">
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Personalize the workspace experience.</CardDescription>
          <CardAction>
            <SlidersHorizontalIcon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Block gap="md">
            <Block rowFrom="md" align={{ base: "start", md: "center" }} justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Workspace density</Text>
                <Text tone="muted" size="sm">
                  Choose the default spacing for data-heavy surfaces.
                </Text>
              </Block>
              <ToggleGroup aria-label="Workspace density" type="single" defaultValue="comfortable">
                <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
                <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
              </ToggleGroup>
            </Block>
            <Separator decorative />
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Sync theme mode</Text>
                <Text tone="muted" size="sm">
                  Keep theme preference in local storage.
                </Text>
              </Block>
              <Switch defaultChecked />
            </Block>
          </Block>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Display defaults</CardTitle>
          <CardDescription>Default UI choices for new workspace views.</CardDescription>
        </CardHeader>
        <CardContent>
          <Grid columns={{ base: 1, md: 2 }} gap="md">
            <Field>
              <Label for="settings-view">Default view</Label>
              <Input id="settings-view" value="Dashboard" readonly />
            </Field>
            <Field>
              <Label for="settings-region">Region</Label>
              <Select name="region" defaultValue="us-east">
                <SelectTrigger id="settings-region">
                  <SelectValue placeholder="Choose a region" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent align="start" sideOffset={6}>
                    <SelectGroup>
                      <SelectLabel>Workspace region</SelectLabel>
                      <SelectItem value="us-east">US East</SelectItem>
                      <SelectItem value="us-west">US West</SelectItem>
                      <SelectItem value="eu-central">EU Central</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </SelectPortal>
              </Select>
            </Field>
          </Grid>
        </CardContent>
      </Card>
    </Block>
  );
}
