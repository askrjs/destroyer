import { currentRoute } from "@askrjs/askr/router";
import { Grid, Page, PageHeader } from "@askrjs/themes/components";
import { SettingsContent } from "../features/settings/settings-content";
import { getActiveSettingsPath } from "../features/settings/settings-data";
import { SettingsSidebar } from "../features/settings/settings-sidebar";

export function SettingsPage() {
  const activePath = getActiveSettingsPath(currentRoute().path);

  return (
    <Page>
      <PageHeader
        title="Settings"
        description="A realistic settings surface with nested Askr workspace sections."
      />

      <Grid columns={{ base: 1, lg: "14rem minmax(0, 1fr)" }} gap="md">
        <SettingsSidebar activePath={activePath} />
        <SettingsContent activePath={activePath} />
      </Grid>
    </Page>
  );
}
