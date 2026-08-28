import { derive, state } from "@askrjs/askr";
import { createQuery } from "@askrjs/askr/data";
import { documentVisible, routeActive, timer } from "@askrjs/askr/resources";
import { Link, currentAuth, currentRoute, updateRouteQuery } from "@askrjs/askr/router";
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
  type VirtualListApi,
  VirtualTable,
  type VirtualTableApi,
} from "@askrjs/themes/components";
import { logColumns } from "../features/logs/log-table-columns";
import { LogStreamRow } from "../features/logs/log-stream-row";
import type { LogEntry } from "../features/logs/logs-data";
import {
  liveLogQuery,
  liveLogScope,
  toLogEntry,
  type LiveLogSnapshot,
} from "../features/logs/live-logs-resource";
import type { OperationsLogPage } from "../server/contracts";

const LOG_SEARCH_QUERY_KEY = "search";
const LOG_TABLE_HEADER_HEIGHT = 40;

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

function matchesLogFilter(entry: LogEntry, filter: string): boolean {
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
  const liveLogs = createQuery(liveLogQuery, {
    principalId: currentAuth().principal?.id ?? "anonymous",
  });
  const olderEntries = state<readonly LogEntry[]>([]);
  const historyStarted = state(false);
  const historyCursor = state<string | null>(null);
  const nextCursor = derive(() =>
    historyStarted() ? historyCursor() : (liveLogs.data?.nextCursor ?? null),
  );
  const historyPending = state(false);
  const historyError = state("");
  const liveListApi = state({ current: null as VirtualListApi<LogEntry> | null })();
  const logTableApi = state({ current: null as VirtualTableApi<LogEntry> | null })();
  const resumeInProgress = state(false);
  const activeLiveSnapshot = (): LiveLogSnapshot =>
    liveLogs.data ?? { entries: [], nextCursor: null, sequence: 0 };
  const liveSnapshot = (): LiveLogSnapshot => frozenLiveSnapshot() ?? activeLiveSnapshot();
  const currentEntries = () => [...liveSnapshot().entries, ...olderEntries()];
  const filteredLogEntries = derive(() =>
    currentEntries().filter((entry) => matchesLogFilter(entry, tableFilter())),
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

  const selectedLogRowKey = state<string | null>(filteredLogEntries()[0]?.id ?? null);
  const effectiveSelectedLogRowKey = derive(() => {
    const selected = selectedLogRowKey();
    const rows = filteredLogEntries();
    return selected !== null && rows.some((entry) => entry.id === selected)
      ? selected
      : (rows[0]?.id ?? null);
  });
  const pauseLiveMode = (event: Event, topOffset = 0) => {
    const viewport = event.currentTarget as HTMLElement | null;
    const hasScrolled = Boolean(
      viewport && (viewport.scrollTop > topOffset || viewport.scrollLeft > 0),
    );
    if (!hasScrolled || livePaused() || resumeInProgress()) {
      return;
    }

    frozenLiveSnapshot.set(activeLiveSnapshot());
    livePaused.set(true);
  };
  const setLiveMode = (nextLive: boolean) => {
    if (!nextLive) {
      resumeInProgress.set(false);
      frozenLiveSnapshot.set(activeLiveSnapshot());
      livePaused.set(true);
      return;
    }

    resumeInProgress.set(true);
    liveListApi.current?.scrollToTop();
    logTableApi.current?.scrollToTop();
    frozenLiveSnapshot.set(null);
    livePaused.set(false);
    olderEntries.set([]);
    historyStarted.set(false);
    historyCursor.set(null);
    historyError.set("");
    const finishResume = () => {
      requestAnimationFrame(() => {
        if (!livePaused()) {
          liveListApi.current?.scrollToTop();
          logTableApi.current?.scrollToTop();
        }
        resumeInProgress.set(false);
      });
    };
    void liveLogs.refresh().then(finishResume, finishResume);
  };
  const toggleLiveMode = () => setLiveMode(livePaused());
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
  const loadOlder = async () => {
    const cursor = nextCursor();
    if (!cursor || historyPending()) return;
    if (!historyStarted()) {
      frozenLiveSnapshot.set(activeLiveSnapshot());
      livePaused.set(true);
    }
    historyPending.set(true);
    historyError.set("");
    try {
      const response = await fetch(
        `/api/operations/logs?limit=80&cursor=${encodeURIComponent(cursor)}`,
        { credentials: "same-origin" },
      );
      if (!response.ok) throw new Error(`Log history request failed (${response.status}).`);
      const page = (await response.json()) as OperationsLogPage;
      olderEntries.set([...olderEntries(), ...page.entries.map(toLogEntry)]);
      historyCursor.set(page.nextCursor);
      historyStarted.set(true);
    } catch (cause) {
      historyError.set(cause instanceof Error ? cause.message : "Log history request failed.");
    } finally {
      historyPending.set(false);
    }
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
              <StatValue>{currentEntries().length}</StatValue>
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
              <StatValue>
                {currentEntries().filter((entry) => entry.severity === "warning").length}
              </StatValue>
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
              <StatValue>
                {currentEntries().filter((entry) => entry.severity === "error").length}
              </StatValue>
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
                <Badge variant={livePaused() ? "outline" : "success"}>
                  {livePaused() ? "Paused" : "Live"}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={livePaused() ? "Resume live stream" : "Pause live stream"}
                  aria-pressed={!livePaused()}
                  disabled={resumeInProgress()}
                  onPress={toggleLiveMode}
                >
                  {livePaused() ? (
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
              apiRef={liveListApi}
              aria-label="Recent log stream"
              viewport="lg"
              data-live-paused={livePaused() ? "true" : "false"}
              data-live-sequence={liveSnapshot().sequence}
              items={liveSnapshot().entries}
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
            <Block direction="column" gap="md">
              <Toolbar
                title="Event rows"
                align={{ base: "stretch", md: "center" }}
                actions={
                  <InputGroup class="shrinkable-input-group">
                    <InputGroupText>
                      <SearchIcon size={16} aria-hidden="true" />
                    </InputGroupText>
                    <DebouncedInput
                      aria-label="Filter log events"
                      debounceMs={0}
                      placeholder="Filter events"
                      value={tableFilter()}
                      onDebouncedInput={setTableFilter}
                    />
                  </InputGroup>
                }
              />
              {filteredLogEntries().length > 0 ? (
                <VirtualTable
                  apiRef={logTableApi}
                  aria-label="Log event details"
                  viewport="lg"
                  tableWidth="compact"
                  rows={filteredLogEntries()}
                  rowHeight={44}
                  headerHeight={LOG_TABLE_HEADER_HEIGHT}
                  overscan={4}
                  getKey={(entry) => entry.id}
                  columns={logColumns}
                  selectedRowKey={effectiveSelectedLogRowKey()}
                  onSelectedRowKeyChange={(key) => selectedLogRowKey.set(key)}
                  onScroll={(event) => pauseLiveMode(event, LOG_TABLE_HEADER_HEIGHT)}
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
              {historyError() ? (
                <Text role="alert" tone="danger">
                  {historyError()}
                </Text>
              ) : null}
              {nextCursor() ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={historyPending()}
                  onPress={() => void loadOlder()}
                >
                  {historyPending() ? "Loading older events…" : "Load older events"}
                </Button>
              ) : (
                <Text role="status" tone="muted">
                  All matching history loaded.
                </Text>
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
              <Block direction="column" gap="xs">
                <Text weight="medium">Dense status rows</Text>
                <Text tone="muted" size="sm">
                  The list keeps badges, timestamps, and long messages aligned inside fixed rows.
                </Text>
              </Block>
            </Block>
            <Block direction="row" align="start" gap="md">
              <TablePropertiesIcon size={18} aria-hidden="true" />
              <Block direction="column" gap="xs">
                <Text weight="medium">Horizontal table overflow</Text>
                <Text tone="muted" size="sm">
                  The table scrolls without breaking sticky headers or selected row contrast.
                </Text>
              </Block>
            </Block>
            <Block direction="row" align="start" gap="md">
              <RouteIcon size={18} aria-hidden="true" />
              <Block direction="column" gap="xs">
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
