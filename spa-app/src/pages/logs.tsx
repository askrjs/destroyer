import { state } from "@askrjs/askr";
import { createQuery, queryScope } from "@askrjs/askr/data";
import { documentVisible, routeActive, timer } from "@askrjs/askr/resources";
import { Link } from "@askrjs/askr/router";
import {
  ActivityIcon,
  CirclePauseIcon,
  CirclePlayIcon,
  FileCode2Icon,
  InfoIcon,
  ListChecksIcon,
  RouteIcon,
  ServerCogIcon,
  TablePropertiesIcon,
} from "@askrjs/lucide";
import {
  Badge,
  Block,
  Button,
  ButtonGroup,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Grid,
  Page,
  PageHeader,
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
  Separator,
  Stat,
  StatDescription,
  StatLabel,
  StatValue,
  Text,
  VirtualList,
  type VirtualListRowComponentProps,
  VirtualTable,
  type VirtualTableColumn,
} from "@askrjs/themes/components";

type LogSeverity = "debug" | "info" | "warning" | "error";

type LogEntry = {
  id: string;
  time: string;
  service: string;
  route: string;
  severity: LogSeverity;
  latency: number;
  requestId: string;
  message: string;
};

type LiveLogSnapshot = {
  entries: LogEntry[];
  sequence: number;
};

const LIVE_LOG_LIMIT = 80;
const LIVE_LOG_START_INDEX = 9600;
const liveLogScope = queryScope("destroyer.logs");
const liveLogQueryKey = liveLogScope.key("live");

const services = ["router", "theme", "auth", "billing", "docs", "settings"] as const;
const routes = [
  "/docs",
  "/docs/components",
  "/settings/security",
  "/settings/preferences",
  "/profile/activity",
  "/contact",
] as const;
const messages = [
  "Route transition committed without remounting shell state.",
  "Theme token read completed from local storage.",
  "Virtualized viewport retained its scroll anchor.",
  "Security activity table refreshed from local cache.",
  "Profile route badge metadata resolved for hover details.",
  "Settings form state synchronized with route segment.",
  "Docs rail collapsed state restored before first paint.",
  "Contact workflow queued toast confirmation.",
] as const;

function getSeverity(index: number): LogSeverity {
  if (index % 29 === 0) return "error";
  if (index % 11 === 0) return "warning";
  if (index % 5 === 0) return "debug";
  return "info";
}

function getBadgeVariant(severity: LogSeverity) {
  if (severity === "error") return "danger";
  if (severity === "warning") return "warning";
  if (severity === "debug") return "secondary";
  return "info";
}

function getSeverityTone(severity: LogSeverity) {
  if (severity === "error") return "danger";
  if (severity === "warning") return "warning";
  if (severity === "debug") return "muted";
  return "info";
}

function createLogEntry(index: number): LogEntry {
  const service = services[index % services.length];
  const route = routes[(index * 2) % routes.length];
  const minute = String(58 - (index % 55)).padStart(2, "0");
  const second = String((index * 7) % 60).padStart(2, "0");

  return {
    id: `evt-${String(84720 + index)}`,
    time: `09:${minute}:${second}`,
    service,
    route,
    severity: getSeverity(index),
    latency: 38 + ((index * 17) % 220),
    requestId: `req_${(index * 7919).toString(16).padStart(6, "0")}`,
    message: messages[index % messages.length],
  };
}

function formatLocalLogTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${hour}:${minute}:${second}`;
}

function createLiveLogEntry(index: number, timestamp: number): LogEntry {
  return {
    ...createLogEntry(index),
    time: formatLocalLogTime(timestamp),
  };
}

function createLiveLogWindow(sequence: number, timestamp: number): LogEntry[] {
  const snapshotStart = LIVE_LOG_START_INDEX + sequence * LIVE_LOG_LIMIT;

  return Array.from({ length: LIVE_LOG_LIMIT }, (_, index) =>
    createLiveLogEntry(snapshotStart + index, timestamp - index * 1000),
  );
}

const logEntries: LogEntry[] = Array.from({ length: 420 }, (_, index) => createLogEntry(index));
const liveLogFallbackEntries = createLiveLogWindow(0, Date.now());

function createAbortError(): Error {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

function waitForLiveLogDelay(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, ms);

    function handleAbort() {
      clearTimeout(timeout);
      reject(createAbortError());
    }

    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

let liveLogSequence = 0;

async function fetchLiveLogs({ signal }: { signal: AbortSignal }): Promise<LiveLogSnapshot> {
  await waitForLiveLogDelay(120 + (liveLogSequence % 4) * 25, signal);

  liveLogSequence += 1;
  const timestamp = Date.now();

  return {
    sequence: liveLogSequence,
    entries: createLiveLogWindow(liveLogSequence, timestamp),
  };
}

const latestErrors = logEntries.filter((entry) => entry.severity === "error").length;
const warningCount = logEntries.filter((entry) => entry.severity === "warning").length;

function virtualNode(node: unknown): never {
  return node as never;
}

function LogStreamRow({ item }: VirtualListRowComponentProps<LogEntry>): never {
  return virtualNode(
    <Block
      width="full"
      direction="row"
      align="stretch"
      data-severity={item.severity}
      aria-label={`${item.severity} ${item.service} event at ${item.time}`}
    >
      <Block width="full" direction="row" align="center" paddingX="md" paddingY="sm">
        <Block gap="xs" grow>
          <Block direction="row" align="center" justify="between" gap="sm">
            <Block direction="row" align="center" gap="sm" grow>
              <Block as="span" shrink={false}>
                <Text as="span" tone={getSeverityTone(item.severity)} weight="semibold" size="sm">
                  {item.severity}
                </Text>
              </Block>
              <Text size="sm" truncate>
                {item.message}
              </Text>
            </Block>
            <Block as="span" shrink={false}>
              <Text as="span" tone="muted" size="sm" font="mono" numeric="tabular">
                {item.time}
              </Text>
            </Block>
          </Block>

          <Block direction="row" align="center" justify="between" gap="sm">
            <Block direction="row" align="center" gap="sm" grow>
              <Block as="span" shrink={false}>
                <Text as="span" tone="muted" size="sm" font="mono">
                  {item.service}
                </Text>
              </Block>
              <Text as="span" tone="muted" size="sm" truncate>
                {item.route}
              </Text>
            </Block>
            <Block direction="row" align="center" shrink={false}>
              <Text as="span" tone="muted" size="sm" font="mono" numeric="tabular">
                {item.latency}ms
              </Text>
            </Block>
          </Block>
        </Block>
      </Block>
    </Block>,
  );
}

function LogDetailPopover({ entry }: { entry: LogEntry }) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`View details for ${entry.id}`}
        data-variant="ghost"
        data-size="icon-xs"
      >
        <InfoIcon size={16} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          aria-label="Log event details"
          side="left"
          align="start"
          sideOffset={8}
          data-width="md"
        >
          <Block gap="sm">
            <Block direction="row" align="center" justify="between" gap="md">
              <Badge variant={getBadgeVariant(entry.severity)}>{entry.severity}</Badge>
              <Text as="span" tone="muted" size="sm" font="mono" numeric="tabular">
                {entry.time}
              </Text>
            </Block>
            <Text weight="semibold" size="sm" wrap="anywhere">
              {entry.message}
            </Text>
            <Separator decorative />
            <Block gap="xs">
              <Block direction="row" align="center" justify="between" gap="md">
                <Text tone="subtle" size="sm">
                  Service
                </Text>
                <Text size="sm" font="mono">
                  {entry.service}
                </Text>
              </Block>
              <Block direction="row" align="center" justify="between" gap="md">
                <Text tone="subtle" size="sm">
                  Latency
                </Text>
                <Text size="sm" font="mono" numeric="tabular">
                  {entry.latency}ms
                </Text>
              </Block>
              <Block direction="row" align="center" justify="between" gap="md">
                <Text tone="subtle" size="sm">
                  Route
                </Text>
                <Text size="sm" font="mono">
                  {entry.route}
                </Text>
              </Block>
              <Block direction="row" align="center" justify="between" gap="md">
                <Text tone="subtle" size="sm">
                  Request
                </Text>
                <Text size="sm" font="mono" numeric="tabular">
                  {entry.requestId}
                </Text>
              </Block>
            </Block>
          </Block>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}

const logColumns: readonly VirtualTableColumn<LogEntry>[] = [
  {
    id: "time",
    header: "Time",
    width: "6rem",
    cellComponent: ({ row }) =>
      virtualNode(
        <Text as="span" tone="muted" size="sm">
          {row.time}
        </Text>,
      ),
  },
  {
    id: "severity",
    header: "Severity",
    width: "7rem",
    cellComponent: ({ row }) =>
      virtualNode(<Badge variant={getBadgeVariant(row.severity)}>{row.severity}</Badge>),
  },
  {
    id: "service",
    header: "Service",
    width: "8rem",
    cellComponent: ({ row }) => virtualNode(<Text size="sm">{row.service}</Text>),
  },
  {
    id: "route",
    header: "Route",
    width: "12rem",
    cellComponent: ({ row }) =>
      virtualNode(
        <Text as="span" tone="muted" size="sm">
          {row.route}
        </Text>,
      ),
  },
  {
    id: "latency",
    header: "Latency",
    width: "6rem",
    cellComponent: ({ row }) => virtualNode(<Text size="sm">{row.latency}ms</Text>),
  },
  {
    id: "details",
    header: "Details",
    width: "4rem",
    cellComponent: ({ row }) =>
      virtualNode(
        <Block center>
          <LogDetailPopover entry={row} />
        </Block>,
      ),
  },
];

export function LogsPage() {
  const livePaused = state(false);
  const frozenLiveSnapshot = state<LiveLogSnapshot | null>(null);
  const liveLogs = createQuery({
    key: liveLogQueryKey,
    fetch: fetchLiveLogs,
  });

  timer(
    1600,
    () => {
      if (!livePaused()) {
        liveLogScope.invalidate(["live"]);
      }
    },
    {
      when: [routeActive("/logs"), documentVisible()],
    },
  );

  const liveModePaused = livePaused();
  const activeLiveSnapshot = liveLogs.data ?? {
    entries: liveLogFallbackEntries,
    sequence: 0,
  };
  const liveSnapshot = frozenLiveSnapshot() ?? activeLiveSnapshot;
  const pauseLiveMode = (event: Event) => {
    const viewport = event.currentTarget as HTMLElement | null;
    const hasScrolled = Boolean(viewport && (viewport.scrollTop > 0 || viewport.scrollLeft > 0));

    if (!hasScrolled || livePaused()) {
      return;
    }

    frozenLiveSnapshot.set(activeLiveSnapshot);
    livePaused.set(true);
  };
  const setLiveMode = (nextLive: boolean) => {
    if (!nextLive) {
      frozenLiveSnapshot.set(activeLiveSnapshot);
      livePaused.set(true);
      return;
    }

    frozenLiveSnapshot.set(null);
    livePaused.set(false);
    void liveLogs.refresh();
  };
  const toggleLiveMode = () => setLiveMode(liveModePaused);

  return (
    <Page>
      <PageHeader
        title="Logs"
        description="A high-volume operations surface for validating virtualized list and table styling in Destroyer."
        actions={
          <ButtonGroup attached={false}>
            <Link href="/docs/components" data-slot="button" data-variant="outline">
              <FileCode2Icon size={16} aria-hidden="true" />
              Component notes
            </Link>
          </ButtonGroup>
        }
      />

      <Grid as="section" columns={{ base: 1, md: 3 }} gap="lg">
        <Card>
          <CardHeader>
            <Stat>
              <StatLabel>Events</StatLabel>
              <StatValue>{logEntries.length}</StatValue>
            </Stat>
            <CardAction>
              <Badge variant="info">Virtualized</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <StatDescription>Rows stay windowed while the page remains responsive.</StatDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Stat>
              <StatLabel>Warnings</StatLabel>
              <StatValue>{warningCount}</StatValue>
            </Stat>
            <CardAction>
              <ListChecksIcon size={18} aria-hidden="true" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <StatDescription>Severity badges exercise dense row content.</StatDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Stat>
              <StatLabel>Errors</StatLabel>
              <StatValue>{latestErrors}</StatValue>
            </Stat>
            <CardAction>
              <Badge variant="danger">Watch</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <StatDescription>
              Selected virtual table rows remain visible and readable.
            </StatDescription>
          </CardContent>
        </Card>
      </Grid>

      <Grid
        as="section"
        columns={{ base: 1, xl: "minmax(18rem, 0.8fr) minmax(0, 1.45fr)" }}
        gap="lg"
      >
        <Card variant="raised">
          <CardHeader>
            <CardTitle>Live stream</CardTitle>
            <CardDescription>Recent route, theme, and workspace events.</CardDescription>
            <CardAction>
              <Block direction="row" align="center" gap="xs">
                <Badge variant={liveModePaused ? "outline" : "success"}>
                  {liveModePaused ? "Paused" : "Live"}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={liveModePaused ? "Resume live stream" : "Pause live stream"}
                  aria-pressed={!liveModePaused}
                  onPress={toggleLiveMode}
                >
                  {liveModePaused ? (
                    <CirclePlayIcon size={18} aria-hidden="true" />
                  ) : (
                    <CirclePauseIcon size={18} aria-hidden="true" />
                  )}
                </Button>
              </Block>
            </CardAction>
          </CardHeader>
          <CardContent>
            <VirtualList
              aria-label="Recent log stream"
              data-viewport="lg"
              data-live-paused={liveModePaused ? "true" : "false"}
              data-live-sequence={liveSnapshot.sequence}
              items={liveSnapshot.entries}
              rowHeight={64}
              overscan={3}
              getKey={(entry) => entry.id}
              rowComponent={LogStreamRow}
              onScroll={pauseLiveMode}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event detail</CardTitle>
            <CardDescription>
              Keyboard-selectable virtual table with sticky headers.
            </CardDescription>
            <CardAction>
              <TablePropertiesIcon size={18} aria-hidden="true" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <VirtualTable
              aria-label="Log event details"
              data-viewport="lg"
              data-table-width="compact"
              rows={logEntries}
              rowHeight={44}
              headerHeight={40}
              overscan={4}
              getKey={(entry) => entry.id}
              columns={logColumns}
              defaultSelectedRowKey={logEntries[0]?.id}
              onScroll={pauseLiveMode}
            />
          </CardContent>
        </Card>
      </Grid>

      <Card>
        <CardHeader>
          <CardTitle>What this route verifies</CardTitle>
          <CardDescription>
            Virtualized primitives in a realistic operational workflow.
          </CardDescription>
          <CardAction>
            <ActivityIcon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Separator decorative />
          <Grid columns={{ base: 1, md: 3 }} gap="lg">
            <Block direction="row" align="start" gap="md">
              <ServerCogIcon size={18} aria-hidden="true" />
              <Block gap="xs">
                <Text weight="medium">Dense status rows</Text>
                <Text tone="muted" size="sm">
                  The list keeps badges, timestamps, and long messages aligned inside fixed rows.
                </Text>
              </Block>
            </Block>
            <Block direction="row" align="start" gap="md">
              <TablePropertiesIcon size={18} aria-hidden="true" />
              <Block gap="xs">
                <Text weight="medium">Horizontal table overflow</Text>
                <Text tone="muted" size="sm">
                  The table scrolls without breaking sticky headers or selected row contrast.
                </Text>
              </Block>
            </Block>
            <Block direction="row" align="start" gap="md">
              <RouteIcon size={18} aria-hidden="true" />
              <Block gap="xs">
                <Text weight="medium">Route-backed access</Text>
                <Text tone="muted" size="sm">
                  Logs are part of the app navigation, not a detached component showcase.
                </Text>
              </Block>
            </Block>
          </Grid>
        </CardContent>
      </Card>
    </Page>
  );
}
