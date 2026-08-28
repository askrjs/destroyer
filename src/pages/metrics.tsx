import { createPlot } from "@askrjs/charts";
import { derive } from "@askrjs/askr";
import { createQuery } from "@askrjs/askr/data";
import { Link, currentAuth } from "@askrjs/askr/router";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ChartBarIcon,
  ChartColumnIncreasingIcon,
  ChartLineIcon,
  FileCode2Icon,
} from "@askrjs/lucide";
import {
  Badge,
  Block,
  Alert,
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
  Stat,
  StatDescription,
  StatLabel,
  StatValue,
} from "@askrjs/themes/components";
import {
  formatDay,
  formatPercent,
  type ReliabilityRow,
  type ResponseDistributionRow,
  type RouteWorkloadRow,
  type SubsystemMixRow,
} from "../features/metrics/metrics-data";
import { liveLogQuery } from "../features/logs/live-logs-resource";
import { operationsMetricsData, operationsSummaryData } from "../features/metrics/metrics-model";

const ResponseDistributionPlot = createPlot<ResponseDistributionRow>();
const RouteWorkloadPlot = createPlot<RouteWorkloadRow>();
const SubsystemMixPlot = createPlot<SubsystemMixRow>();
const ReliabilityPlot = createPlot<ReliabilityRow>();

function OperationsHealthBadge({ principalId }: { principalId: string }) {
  const summary = operationsSummaryData(principalId);
  return (
    <Badge aria-label="Healthy service count" variant="success">
      {summary.data?.healthyServices ?? 0} healthy
    </Badge>
  );
}

export function MetricsPage() {
  const principalId = currentAuth().principal?.id ?? "anonymous";
  const summary = operationsSummaryData(principalId);
  const metrics = operationsMetricsData(principalId);
  const logs = createQuery(liveLogQuery, { principalId });
  const hasMetricSeries =
    (metrics.data?.latencyBands.length ?? 0) > 0 ||
    (metrics.data?.routeWorkload.length ?? 0) > 0 ||
    (metrics.data?.serviceMix.length ?? 0) > 0 ||
    (metrics.data?.reliability.length ?? 0) > 0;
  const responseDistribution = derive<readonly ResponseDistributionRow[]>(() =>
    (metrics.data?.latencyBands ?? []).map((row) => ({
      id: row.id,
      latencyBand: row.label,
      requests: row.requests,
      description: `${row.requests} persisted requests in ${row.label}.`,
    })),
  );
  const routeWorkload = derive<readonly RouteWorkloadRow[]>(() =>
    (metrics.data?.routeWorkload ?? []).map((row) => ({
      ...row,
      description: `${row.requests} persisted requests for ${row.route}.`,
    })),
  );
  const subsystemMix = derive<readonly SubsystemMixRow[]>(() =>
    (metrics.data?.serviceMix ?? []).map((row) => ({
      id: row.id,
      subsystem: row.service,
      share: row.share,
      description: `${row.service} handled ${row.share.toFixed(1)}% of persisted requests.`,
    })),
  );
  const reliabilityTrend = derive<readonly ReliabilityRow[]>(() =>
    (metrics.data?.reliability ?? []).map((row) => ({
      id: row.id,
      observedAt: new Date(row.observedAt),
      successRate: row.successRate,
      description: `${row.id} success rate: ${row.successRate.toFixed(2)}%.`,
    })),
  );
  return (
    <Page>
      <PageHeader
        title="Metrics"
        description="Service telemetry for investigating load, reliability, and request cost across the workspace."
        actions={
          <Block direction="row" align="center" gap="sm">
            <OperationsHealthBadge principalId={principalId} />
            <ButtonGroup attached={false}>
              <Button type="button" variant="outline" onPress={() => void metrics.refresh()}>
                <ActivityIcon size={16} aria-hidden="true" />
                Refresh metrics
              </Button>
              <Button asChild variant="outline">
                <Link href="/logs">
                  <FileCode2Icon size={16} aria-hidden="true" />
                  Review logs
                </Link>
              </Button>
            </ButtonGroup>
          </Block>
        }
      />

      {metrics.error ? (
        <Alert
          variant="danger"
          icon={<AlertTriangleIcon size={18} aria-hidden="true" />}
          title="Metrics could not be loaded"
          description="The operational query failed before returning telemetry."
          actions={
            <Button type="button" variant="outline" onPress={() => void metrics.refresh()}>
              Retry metrics
            </Button>
          }
        />
      ) : null}

      <Grid as="section" columns={{ base: 1, xl: 2 }} gap="lg">
        <Card variant="raised" aria-busy={summary.loading || summary.refreshing}>
          <CardHeader>
            <CardTitle>Service summary</CardTitle>
            <CardDescription>
              Current service and incident health from the summary API.
            </CardDescription>
            <CardAction>
              <Button type="button" variant="outline" onPress={() => void summary.refresh()}>
                Refresh summary
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {summary.error ? (
              <Alert
                variant="danger"
                title="Summary could not be loaded"
                description="The summary query failed without collapsing metrics or logs."
              />
            ) : (
              <StatDescription>
                {summary.data?.healthyServices ?? 0} healthy services;{" "}
                {summary.data?.openIncidents ?? 0} open incidents.
              </StatDescription>
            )}
          </CardContent>
        </Card>

        <Card variant="raised" aria-busy={logs.loading || logs.refreshing}>
          <CardHeader>
            <CardTitle>Recent log evidence</CardTitle>
            <CardDescription>Latest persisted events from the logs API.</CardDescription>
            <CardAction>
              <Button type="button" variant="outline" onPress={() => void logs.refresh()}>
                Refresh logs
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {logs.error ? (
              <Alert
                variant="danger"
                title="Logs could not be loaded"
                description="The logs query failed without collapsing summary or metrics."
              />
            ) : (
              <StatDescription>
                {logs.data?.entries.length ?? 0} recent persisted events.
              </StatDescription>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid as="section" columns={{ base: 1, md: 3 }} gap="lg">
        <Card>
          <CardHeader>
            <Stat>
              <StatLabel>Requests</StatLabel>
              <StatValue>{() => metrics.data?.requests ?? 0}</StatValue>
            </Stat>
            <CardAction>
              <Badge variant="success">SQLite</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <StatDescription>Persisted operational events.</StatDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Stat>
              <StatLabel>P95 latency</StatLabel>
              <StatValue>{() => `${metrics.data?.p95LatencyMs ?? 0}ms`}</StatValue>
            </Stat>
            <CardAction>
              <Badge variant="info">Live</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <StatDescription>Calculated from stored log latency.</StatDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Stat>
              <StatLabel>Error rate</StatLabel>
              <StatValue>{() => `${(metrics.data?.errorRate ?? 0).toFixed(2)}%`}</StatValue>
            </Stat>
            <CardAction>
              <Badge variant="secondary">Measured</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <StatDescription>Calculated from stored error events.</StatDescription>
          </CardContent>
        </Card>
      </Grid>

      {!metrics.loading && !metrics.error && !hasMetricSeries ? (
        <Alert
          variant="info"
          title="No telemetry in this window"
          description="The metrics query completed successfully, but no operational series were returned."
        />
      ) : null}

      {hasMetricSeries ? (
        <>
          <Grid
            as="section"
            columns={{ base: 1, xl: "minmax(0, 1.45fr) minmax(18rem, 0.8fr)" }}
            gap="lg"
          >
            <Card variant="raised">
              <CardHeader>
                <CardTitle>Response distribution</CardTitle>
                <CardDescription>
                  Requests by latency band across persisted log history.
                </CardDescription>
                <CardAction>
                  <ChartColumnIncreasingIcon size={18} aria-hidden="true" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <ResponseDistributionPlot.Root
                  class="metrics-plot metrics-plot--primary"
                  data={responseDistribution()}
                  rowKey="id"
                  label="Response latency distribution"
                  summary="Request counts grouped into latency bands from persisted operational events."
                >
                  <ResponseDistributionPlot.Bar x="latencyBand" y="requests" title="description" />
                  <ResponseDistributionPlot.Axis axis="y" label="Requests" />
                  <ResponseDistributionPlot.Tooltip />
                </ResponseDistributionPlot.Root>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subsystem mix</CardTitle>
                <CardDescription>
                  Share of observable app events by owning subsystem.
                </CardDescription>
                <CardAction>
                  <ActivityIcon size={18} aria-hidden="true" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <SubsystemMixPlot.Root
                  class="metrics-plot metrics-plot--compact"
                  data={subsystemMix()}
                  rowKey="id"
                  label="Subsystem event mix"
                  summary="Relative share of persisted operational events for the six busiest services."
                >
                  <SubsystemMixPlot.Arc
                    value="share"
                    category="subsystem"
                    fill="subsystem"
                    title="description"
                    innerRadius={0.58}
                  />
                  <SubsystemMixPlot.Legend label="Subsystem" interactive />
                  <SubsystemMixPlot.Tooltip />
                </SubsystemMixPlot.Root>
              </CardContent>
            </Card>
          </Grid>

          <Grid as="section" columns={{ base: 1, xl: 2 }} gap="lg">
            <Card>
              <CardHeader>
                <CardTitle>Route workload</CardTitle>
                <CardDescription>
                  Where request-handling work is concentrated right now.
                </CardDescription>
                <CardAction>
                  <ChartBarIcon size={18} aria-hidden="true" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <RouteWorkloadPlot.Root
                  class="metrics-plot"
                  data={routeWorkload()}
                  rowKey="id"
                  label="Route workload"
                  summary="Persisted request counts grouped by route."
                >
                  <RouteWorkloadPlot.Bar
                    x="route"
                    y="requests"
                    orientation="horizontal"
                    title="description"
                  />
                  <RouteWorkloadPlot.Tooltip />
                </RouteWorkloadPlot.Root>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reliability trend</CardTitle>
                <CardDescription>
                  Daily request success rate across persisted log history.
                </CardDescription>
                <CardAction>
                  <ChartLineIcon size={18} aria-hidden="true" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <ReliabilityPlot.Root
                  class="metrics-plot"
                  data={reliabilityTrend()}
                  rowKey="id"
                  label="Weekly reliability"
                  summary="Daily success rate calculated from persisted error and request events."
                >
                  <ReliabilityPlot.Scale
                    channel="y"
                    type="linear"
                    domain={[99.5, 100]}
                    nice={false}
                  />
                  <ReliabilityPlot.Axis axis="x" tickFormat={formatDay} />
                  <ReliabilityPlot.Axis
                    axis="y"
                    tickFormat={(value) => formatPercent(Number(value))}
                  />
                  <ReliabilityPlot.Grid axis="y" />
                  <ReliabilityPlot.Line
                    x="observedAt"
                    y="successRate"
                    title="description"
                    strokeWidth={2}
                  />
                  <ReliabilityPlot.Point x="observedAt" y="successRate" title="description" r={4} />
                  <ReliabilityPlot.Tooltip />
                  <ReliabilityPlot.Crosshair axes="x" />
                </ReliabilityPlot.Root>
              </CardContent>
            </Card>
          </Grid>
        </>
      ) : null}
    </Page>
  );
}
