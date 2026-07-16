import { derive, state } from "@askrjs/askr";
import { createQuery } from "@askrjs/askr/data";
import { documentVisible, routeActive, timer } from "@askrjs/askr/resources";
import { Link, currentRoute, updateRouteQuery } from "@askrjs/askr/router";
import {
  ActivityIcon,
  CirclePauseIcon,
  CirclePlayIcon,
  FileCode2Icon,
  ListChecksIcon,
  RouteIcon,
  SearchIcon,
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
  DebouncedInput,
  EmptyState,
  Grid,
  InputGroup,
  InputGroupText,
  Page,
  PageHeader,
  Separator,
  Stat,
  StatDescription,
  StatLabel,
  StatValue,
  Text,
  Toolbar,
  VirtualList,
  VirtualTable,
} from "@askrjs/themes/components";
import { logColumns } from "../features/logs/log-table-columns";
import { LogStreamRow } from "../features/logs/log-stream-row";
import {
  latestErrors,
  liveLogFallbackEntries,
  logEntries,
  warningCount,
} from "../features/logs/logs-data";
import {
  fetchLiveLogs,
  liveLogQueryKey,
  liveLogScope,
  type LiveLogSnapshot,
} from "../features/logs/live-logs-resource";

const LOG_SEARCH_QUERY_KEY = "search";

function normalizeLogFilter(filter: string | null): string {
  return filter?.trim() ?? "";
}

function syncLogSearchQuery(filter: string): void {
  updateRouteQuery(
    {
      [LOG_SEARCH_QUERY_KEY]: filter || null,
    },
    { history: "replace" },
  );
}

function matchesLogFilter(entry: (typeof logEntries)[number], filter: string): boolean {
  const query = filter.trim().toLowerCase();
  if (!query) return true;

  return [
    entry.id,
    entry.time,
    entry.service,
    entry.route,
    entry.severity,
    entry.requestId,
    entry.message,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function LogsPage() {
  const livePaused = state(false);
  const frozenLiveSnapshot = state<LiveLogSnapshot | null>(null);
  const route = currentRoute();
  const tableFilter = state(normalizeLogFilter(route.query.get(LOG_SEARCH_QUERY_KEY)));
  const liveLogs = createQuery({
    key: liveLogQueryKey,
    fetch: fetchLiveLogs,
  });
  const filteredLogEntries = derive(() =>
    logEntries.filter((entry) => matchesLogFilter(entry, tableFilter())),
  );

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
  const currentTableFilter = tableFilter();
  const currentFilteredLogEntries = filteredLogEntries();
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
  const setTableFilter = (value: string) => {
    const nextFilter = normalizeLogFilter(value);

    if (nextFilter === tableFilter()) {
      return;
    }

    tableFilter.set(nextFilter);
    syncLogSearchQuery(nextFilter);
  };
  const clearTableFilter = () => {
    setTableFilter("");
  };

  return (
    <Page>
      <PageHeader
        title="Logs"
        description="A high-volume operations surface for validating virtualized list and table styling in Destroyer."
        actions={
          <ButtonGroup attached={false}>
            <Button asChild variant="outline">
              <Link href="/docs/components">
                <FileCode2Icon size={16} aria-hidden="true" />
                Component notes
              </Link>
            </Button>
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
              viewport="lg"
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
            <Block gap="md">
              <Toolbar
                title="Event rows"
                actions={
                  <InputGroup>
                    <InputGroupText>
                      <SearchIcon size={16} aria-hidden="true" />
                    </InputGroupText>
                    <DebouncedInput
                      aria-label="Filter log events"
                      debounceMs={0}
                      placeholder="Filter events"
                      value={currentTableFilter}
                      onDebouncedInput={setTableFilter}
                    />
                  </InputGroup>
                }
              />
              {currentFilteredLogEntries.length > 0 ? (
                <VirtualTable
                  aria-label="Log event details"
                  viewport="lg"
                  tableWidth="compact"
                  rows={currentFilteredLogEntries}
                  rowHeight={44}
                  headerHeight={40}
                  overscan={4}
                  getKey={(entry) => entry.id}
                  columns={logColumns}
                  defaultSelectedRowKey={currentFilteredLogEntries[0]?.id}
                  onScroll={pauseLiveMode}
                />
              ) : (
                <EmptyState
                  icon={<SearchIcon size={22} aria-hidden="true" />}
                  title="No matching events"
                  titleAs="h3"
                  description="No log events match the current filter."
                  action={
                    <Button type="button" variant="outline" onPress={clearTableFilter}>
                      Clear filter
                    </Button>
                  }
                />
              )}
            </Block>
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
