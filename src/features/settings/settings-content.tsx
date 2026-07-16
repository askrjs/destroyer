import type { SettingsPath } from "./settings-data";
import { BillingSettings } from "./billing-settings";
import { NotificationSettings } from "./notification-settings";
import { PreferenceSettings } from "./preference-settings";
import { ProfileSettings } from "./profile-settings";
import { SecuritySettings } from "./security-settings";
import { WorkspaceSettings } from "./workspace-settings";

export function SettingsContent({ activePath }: { activePath: SettingsPath }) {
  if (activePath === "/settings/security") return <SecuritySettings />;
  if (activePath === "/settings/preferences") return <PreferenceSettings />;
  if (activePath === "/settings/notifications") return <NotificationSettings />;
  if (activePath === "/settings/billing") return <BillingSettings />;
  if (activePath === "/settings/workspace") return <WorkspaceSettings />;
  return <ProfileSettings />;
}
