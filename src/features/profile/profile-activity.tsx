import {
  Badge,
  Block,
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
  Text,
} from "@askrjs/themes/components";
import { profileActivity } from "./profile-data";

export function ProfileActivity() {
  return (
    <Block direction="column" gap="md">
      {profileActivity.map((entry) => (
        <Block key={entry.title} direction="row" gap="md" align="start">
          <HoverCard openDelay={120} closeDelay={120}>
            <HoverCardTrigger data-variant="plain">
              <Badge variant="outline">{entry.surface}</Badge>
            </HoverCardTrigger>
            <HoverCardPortal>
              <HoverCardContent side="top" align="start" sideOffset={8}>
                <Block gap="xs">
                  <Text weight="semibold" size="sm">
                    {entry.owner}
                  </Text>
                  <Text tone="muted" size="sm">
                    {entry.detail}
                  </Text>
                </Block>
              </HoverCardContent>
            </HoverCardPortal>
          </HoverCard>
          <Block gap="0">
            <Text weight="medium">{entry.title}</Text>
            <Text tone="muted" size="sm">
              {entry.description}
            </Text>
          </Block>
        </Block>
      ))}
    </Block>
  );
}
