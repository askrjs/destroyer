import { createPlot } from "@askrjs/charts";
import { Link, currentAuth } from "@askrjs/askr/router";
import {
  ActivityIcon,
  ChartBarIcon,
  ChartColumnIncreasingIcon,
  ChartLineIcon,
  FileCode2Icon,
} from "@askrjs/lucide";
import {
  Badge,
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
import { operationsMetricsData } from "../features/metrics/metrics-model";

const ResponseDistributionPlot = createPlot<ResponseDistributionRow>();
const RouteWorkloadPlot = createPlot<RouteWorkloadRow>();
const SubsystemMixPlot = createPlot<SubsystemMixRow>();
const ReliabilityPlot = createPlot<ReliabilityRow>();

export function MetricsPage() {
  const metrics = operationsMetricsData(currentAuth().principal?.id ?? "anonymous");
  const responseDistribution: readonly ResponseDistributionRow[] = (
    metrics.data?.latencyBands ?? []
  ).map((row) => ({
    id: row.id,
    latencyBand: row.label,
    requests: row.requests,
    description: `${row.requests} persisted requests in ${row.label}.`,
  }));
  const routeWorkload: readonly RouteWorkloadRow[] = (metrics.data?.routeWorkload ?? []).map(
    (row) => ({ ...row, description: `${row.requests} persisted requests for ${row.route}.` }),
  );
  const subsystemMix: readonly SubsystemMixRow[] = (metrics.data?.serviceMix ?? []).map((row) => ({
    id: row.id,
    subsystem: row.service,
    share: row.share,
    description: `${row.service} handled ${row.share.toFixed(1)}% of persisted requests.`,
  }));
  const reliabilityTrend: readonly ReliabilityRow[] = (metrics.data?.reliability ?? []).map(
    (row) => ({
      id: row.id,
      observedAt: new Date(row.observedAt),
      successRate: row.successRate,
      description: `${row.id} success rate: ${row.successRate.toFixed(2)}%.`,
    }),
  );
  const metricHighlights = [
    {
      label: "Requests",
      value: String(metrics.data?.requests ?? 0),
      detail: "Persisted operational events.",
      badge: "SQLite",
      variant: "success" as const,
    },
    {
      label: "P95 latency",
      value: `${metrics.data?.p95LatencyMs ?? 0}ms`,
      detail: "Calculated from stored log latency.",
      badge: "Live",
      variant: "info" as const,
    },
    {
      label: "Error rate",
      value: `${(metrics.data?.errorRate ?? 0).toFixed(2)}%`,
      detail: "Calculated from stored error events.",
      badge: "Measured",
      variant: "secondary" as const,
    },
  ];
  return (
    <Page>
      <PageHeader
        title="Metrics"
        description="Service telemetry for investigating load, reliability, and request cost across the workspace."
        actions={
          <ButtonGroup attached={false}>
            <Button asChild variant="outline">
              <Link href="/logs">
                <FileCode2Icon size={16} aria-hidden="true" />
                Review logs
              </Link>
            </Button>
          </ButtonGroup>
        }
      />

      <Grid as="section" columns={{ base: 1, md: 3 }} gap="lg">
        {metricHighlights.map(({ badge, detail, label, value, variant }) => (
          <Card key={label}>
            <CardHeader>
              <Stat>
                <StatLabel>{label}</StatLabel>
                <StatValue>{value}</StatValue>
              </Stat>
              <CardAction>
                <Badge variant={variant}>{badge}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <StatDescription>{detail}</StatDescription>
            </CardContent>
          </Card>
        ))}
      </Grid>

      <Grid
        as="section"
        columns={{ base: 1, xl: "minmax(0, 1.45fr) minmax(18rem, 0.8fr)" }}
        gap="lg"
      >
        <Card variant="raised">
          <CardHeader>
            <CardTitle>Response distribution</CardTitle>
            <CardDescription>
              Requests by latency band over the active 24-hour window.
            </CardDescription>
            <CardAction>
              <ChartColumnIncreasingIcon size={18} aria-hidden="true" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ResponseDistributionPlot.Root
              class="metrics-plot metrics-plot--primary"
              data={responseDistribution}
              rowKey="id"
              label="Response latency distribution"
              summary="Most requests complete within 200ms; six percent remain in the 400ms-and-over tail."
            >
              <ResponseDistributionPlot.Bar x="latencyBand" y="requests" title="description" />
              <ResponseDistributionPlot.Axis axis="y" label="Requests (thousands)" />
              <ResponseDistributionPlot.Tooltip />
            </ResponseDistributionPlot.Root>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subsystem mix</CardTitle>
            <CardDescription>Share of observable app events by owning subsystem.</CardDescription>
            <CardAction>
              <ActivityIcon size={18} aria-hidden="true" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <SubsystemMixPlot.Root
              class="metrics-plot metrics-plot--compact"
              data={subsystemMix}
              rowKey="id"
              label="Subsystem event mix"
              summary="Router and theme activity account for 64 percent of observed workspace events."
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
              data={routeWorkload}
              rowKey="id"
              label="Route workload"
              summary="Logs carry the highest workload while virtual rows and live updates are active."
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
            <CardDescription>Seven-day request success rate for the workspace.</CardDescription>
            <CardAction>
              <ChartLineIcon size={18} aria-hidden="true" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ReliabilityPlot.Root
              class="metrics-plot"
              data={reliabilityTrend}
              rowKey="id"
              label="Weekly reliability"
              summary="Reliability remains above 99.7 percent and ends the week at 99.92 percent."
            >
              <ReliabilityPlot.Scale channel="y" type="linear" domain={[99.5, 100]} nice={false} />
              <ReliabilityPlot.Axis axis="x" tickFormat={formatDay} />
              <ReliabilityPlot.Axis axis="y" tickFormat={(value) => formatPercent(Number(value))} />
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
    </Page>
  );
}
