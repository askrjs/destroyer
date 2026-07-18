import { currentAuth } from "@askrjs/askr/router";
import { Badge, Block, Text } from "@askrjs/themes/components";
import { operatorActivityData } from "../settings/settings-model";

export function ProfileActivity() {
  const activity = operatorActivityData(currentAuth().principal?.id ?? "anonymous");
  return (
    <Block direction="column" gap="md">
      {(activity.data ?? []).map((entry) => (
        <Block key={entry.id} direction="row" gap="md" align="start">
          <Badge variant="outline">{entry.action}</Badge>
          <Block gap="0">
            <Text weight="medium">{entry.target}</Text>
            <Text tone="muted" size="sm">
              {new Date(entry.occurredAt).toLocaleString()}
            </Text>
          </Block>
        </Block>
      ))}
    </Block>
  );
}
