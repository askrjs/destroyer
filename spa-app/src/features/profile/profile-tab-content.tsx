import type { ProfilePath } from "./profile-data";
import { ProfileAccess } from "./profile-access";
import { ProfileActivity } from "./profile-activity";
import { ProfileOverview } from "./profile-overview";

export function ProfileTabContent({ activePath }: { activePath: ProfilePath }) {
  if (activePath === "/profile/activity") return <ProfileActivity />;
  if (activePath === "/profile/access") return <ProfileAccess />;
  return <ProfileOverview />;
}
