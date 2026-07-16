import { BellIcon } from "@askrjs/lucide";
import {
  Block,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Grid,
  Label,
  Separator,
  Switch,
  Text,
} from "@askrjs/themes/components";
import { notificationChannels } from "./settings-data";

export function NotificationSettings() {
  return (
    <Card variant="raised">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose how Destroyer should keep you informed.</CardDescription>
        <CardAction>
          <BellIcon size={18} aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Block gap="lg">
          <Block gap="md">
            {[
              ["Route alerts", "Notify when route behavior changes.", true],
              ["Component updates", "Send weekly summaries about theme coverage.", false],
              ["Security notices", "Alert when a session setting changes.", true],
            ].map(([label, description, checked]) => (
              <Block key={String(label)} direction="row" align="center" justify="between" gap="md">
                <Block gap="0">
                  <Text weight="medium">{label}</Text>
                  <Text tone="muted" size="sm">
                    {description}
                  </Text>
                </Block>
                <Switch defaultChecked={Boolean(checked)} />
              </Block>
            ))}
          </Block>
          <Separator decorative />
          <Block gap="md">
            <Block gap="xs">
              <Text weight="medium">Delivery channels</Text>
              <Text tone="muted" size="sm">
                Choose where enabled notifications can appear.
              </Text>
            </Block>
            <Grid columns={{ base: 1, md: 2 }} gap="md">
              {notificationChannels.map((channel) => (
                <Block key={channel.id} direction="row" align="start" gap="sm">
                  <Checkbox
                    id={channel.id}
                    name="notification-channel"
                    value={channel.value}
                    defaultChecked={channel.defaultChecked}
                  />
                  <Block gap="0">
                    <Label for={channel.id}>{channel.label}</Label>
                    <Text tone="muted" size="sm">
                      {channel.description}
                    </Text>
                  </Block>
                </Block>
              ))}
            </Grid>
          </Block>
        </Block>
      </CardContent>
    </Card>
  );
}
