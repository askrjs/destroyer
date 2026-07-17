import { createPlot } from "@askrjs/charts";
import { Link } from "@askrjs/askr/router";
import {
  ActivityIcon,
  ChartBarIcon,
  ChartColumnIncreasingIcon,
  ChartLineIcon,
  FileCode2Icon,
  FlameIcon,
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
  metricHighlights,
  reliabilityTrend,
  requestTrace,
  responseDistribution,
  routeWorkload,
  subsystemMix,
  type ReliabilityRow,
  type RequestTraceRow,
  type ResponseDistributionRow,
  type RouteWorkloadRow,
  type SubsystemMixRow,
} from "../features/metrics/metrics-data";

const ResponseDistributionPlot = createPlot<ResponseDistributionRow>();
const RouteWorkloadPlot = createPlot<RouteWorkloadRow>();
const SubsystemMixPlot = createPlot<SubsystemMixRow>();
const ReliabilityPlot = createPlot<ReliabilityRow>();
const RequestTracePlot = createPlot<RequestTraceRow>();

export function MetricsPage() {
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

      <Card>
        <CardHeader>
          <CardTitle>Slow request anatomy</CardTitle>
          <CardDescription>
            A 246ms logs search, broken down from ingress through database aggregation.
          </CardDescription>
          <CardAction>
            <FlameIcon size={18} aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <RequestTracePlot.Root
            class="metrics-plot metrics-plot--trace"
            data={requestTrace}
            rowKey="id"
            label="Logs request trace"
            summary="Database work consumes 114ms, service work consumes 74ms, and API work consumes 58ms."
          >
            <RequestTracePlot.Scale channel="x" type="linear" domain={[0, 246]} nice={false} />
            <RequestTracePlot.Scale channel="y" type="band" />
            <RequestTracePlot.Axis axis="x" label="Elapsed time (ms)" />
            <RequestTracePlot.Rect
              x="startMs"
              x2="endMs"
              y="lane"
              fill="subsystem"
              title="description"
              radius={3}
            />
            <RequestTracePlot.Legend label="Request stage" interactive />
            <RequestTracePlot.Tooltip />
          </RequestTracePlot.Root>
        </CardContent>
      </Card>
    </Page>
  );
}
