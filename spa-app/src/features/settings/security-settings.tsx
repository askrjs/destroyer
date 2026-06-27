import { state } from "@askrjs/askr";
import { FileClockIcon, KeyRoundIcon, MonitorIcon } from "@askrjs/lucide";
import {
  Badge,
  Block,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  ScrollArea,
  ScrollAreaViewport,
  Separator,
  Skeleton,
  Spinner,
  Slider,
  SliderRange,
  SliderThumb,
  SliderTrack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@askrjs/themes/components";
import { securityActivity } from "./settings-data";

export function SecuritySettings() {
  const [sessionTimeout, setSessionTimeout] = state(30);
  const [activityLoading, setActivityLoading] = state(false);
  const refreshActivity = () => {
    if (activityLoading()) return;

    setActivityLoading(true);
    window.setTimeout(() => {
      setActivityLoading(false);
    }, 800);
  };

  return (
    <Block gap="lg">
      <Card variant="raised">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Keep the local demo session locked down.</CardDescription>
          <CardAction>
            <KeyRoundIcon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Block gap="md">
            <Block direction="row" align="center" justify="between" gap="md">
              <Block gap="0">
                <Text weight="medium">Two-factor authentication</Text>
                <Text tone="muted" size="sm">
                  Require a verification step before signing in.
                </Text>
              </Block>
              <Switch defaultChecked />
            </Block>
            <Separator decorative />
            <Block gap="sm">
              <Block direction="row" align="center" justify="between" gap="md">
                <Block gap="0">
                  <Text weight="medium">Session timeout</Text>
                  <Text tone="muted" size="sm">
                    Automatically end idle sessions after {sessionTimeout()} minutes.
                  </Text>
                </Block>
                <Badge variant="secondary">{sessionTimeout()}m</Badge>
              </Block>
              <Slider
                aria-label="Session timeout"
                min={15}
                max={120}
                step={15}
                value={sessionTimeout()}
                onValueChange={setSessionTimeout}
              >
                <SliderTrack>
                  <SliderRange />
                  <SliderThumb aria-label="Session timeout in minutes" />
                </SliderTrack>
              </Slider>
              <Block direction="row" align="center" justify="between" gap="sm">
                <Text tone="muted" size="sm">
                  15m
                </Text>
                <Text tone="muted" size="sm">
                  2h
                </Text>
              </Block>
            </Block>
          </Block>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>Devices currently using this browser session.</CardDescription>
        </CardHeader>
        <CardContent>
          <Block direction="row" align="center" justify="between" gap="md">
            <Block direction="row" align="center" gap="md">
              <MonitorIcon size={18} aria-hidden="true" />
              <Block gap="0">
                <Text weight="medium">Current browser</Text>
                <Text tone="muted" size="sm">
                  Local demo session
                </Text>
              </Block>
            </Block>
            <Badge variant="success">Current</Badge>
          </Block>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Security activity</CardTitle>
          <CardDescription>Recent local checks that touched account access.</CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activityLoading()}
              onPress={refreshActivity}
            >
              {activityLoading() ? (
                <Spinner label="Refreshing activity" size="sm" />
              ) : (
                <FileClockIcon size={16} aria-hidden="true" />
              )}
              {activityLoading() ? "Refreshing" : "Refresh"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ScrollArea>
            <ScrollAreaViewport data-size="content" tabindex={0}>
              <DataTable>
                <Table aria-label="Security activity" style={{ minInlineSize: "44rem" }}>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Event</TableHeaderCell>
                      <TableHeaderCell>Actor</TableHeaderCell>
                      <TableHeaderCell>Target</TableHeaderCell>
                      <TableHeaderCell>Result</TableHeaderCell>
                      <TableHeaderCell>Time</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activityLoading()
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={`security-activity-loading-${index}`}>
                            <TableCell>
                              <Skeleton height="1rem" width="9rem" />
                            </TableCell>
                            <TableCell>
                              <Skeleton height="1rem" width="7rem" />
                            </TableCell>
                            <TableCell>
                              <Skeleton height="1rem" width="8rem" />
                            </TableCell>
                            <TableCell>
                              <Skeleton height="1.25rem" width="4.5rem" />
                            </TableCell>
                            <TableCell>
                              <Skeleton height="1rem" width="6rem" />
                            </TableCell>
                          </TableRow>
                        ))
                      : securityActivity.map((entry) => (
                          <TableRow key={`${entry.event}-${entry.time}`}>
                            <TableCell>{entry.event}</TableCell>
                            <TableCell>{entry.actor}</TableCell>
                            <TableCell>{entry.target}</TableCell>
                            <TableCell>
                              <Badge variant={entry.variant}>{entry.result}</Badge>
                            </TableCell>
                            <TableCell>{entry.time}</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </DataTable>
            </ScrollAreaViewport>
          </ScrollArea>
        </CardContent>
      </Card>
    </Block>
  );
}
