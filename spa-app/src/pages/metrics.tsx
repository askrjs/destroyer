import { Link } from "@askrjs/askr/router";
import {
  ChartBarIcon,
  ChartColumnIncreasingIcon,
  ChartLineIcon,
  ChartPieIcon,
  DonutIcon,
  FileCode2Icon,
  FlameIcon,
} from "@askrjs/lucide";
import {
  BarChart,
  ChartPanel,
  ChartShell,
  DonutChart,
  FlameGraph,
  LineChart,
  PieChart,
} from "@askrjs/charts/components";
import {
  Badge,
  Block,
  Button,
  ButtonGroup,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  Grid,
  Page,
  PageHeader,
  Stat,
  StatDescription,
  StatLabel,
  StatValue,
  Text,
} from "@askrjs/themes/components";
import {
  channelMix,
  formatCount,
  formatMs,
  formatPercent,
  issueShare,
  metricHighlights,
  reliabilityTrend,
  requestTraceFlame,
  responseHistogram,
  routeWorkload,
} from "../features/metrics/metrics-data";

export function MetricsPage() {
  return (
    <Page>
      <PageHeader
        title="Metrics"
        description="Operational charts for checking Askr chart primitives inside a realistic dashboard route."
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

      <ChartShell
        title="Service telemetry"
        description="Production-style telemetry for latency, route workload, event composition, hardening status, reliability, and request cost."
      >
        <Grid columns={{ base: 1, xl: 2 }} gap="lg">
          <ChartPanel
            title="Response distribution"
            description="Histogram-style bins for route and resource latency."
          >
            <Block direction="row" align="center" gap="sm">
              <ChartColumnIncreasingIcon size={18} aria-hidden="true" />
              <Text tone="muted" size="sm">
                Requests by latency band
              </Text>
            </Block>
            <BarChart
              label="Response latency histogram"
              variant="histogram"
              data={responseHistogram}
              summary="Most requests land under 200ms, with slow calls isolated into the tail bin."
              valueFormatter={formatCount}
              animate
            />
          </ChartPanel>

          <ChartPanel
            title="Route workload"
            description="Horizontal bars for where app work is happening."
          >
            <Block direction="row" align="center" gap="sm">
              <ChartBarIcon size={18} aria-hidden="true" />
              <Text tone="muted" size="sm">
                Activity by route
              </Text>
            </Block>
            <BarChart
              label="Route workload"
              data={routeWorkload}
              summary="Logs currently carry the highest workload because virtual rows and live updates are active."
              valueFormatter={formatCount}
              animate
            />
          </ChartPanel>

          <ChartPanel
            title="Event composition"
            description="Donut chart for subsystem activity across the app shell."
          >
            <Block direction="row" align="center" gap="sm">
              <DonutIcon size={18} aria-hidden="true" />
              <Text tone="muted" size="sm">
                Share by subsystem
              </Text>
            </Block>
            <DonutChart
              label="Subsystem event mix"
              data={channelMix}
              totalLabel="Events"
              summary="Router and theme events account for most of the visible app activity."
              valueFormatter={formatPercent}
              animate
            />
          </ChartPanel>

          <ChartPanel
            title="Issue share"
            description="Pie chart for current hardening work status."
          >
            <Block direction="row" align="center" gap="sm">
              <ChartPieIcon size={18} aria-hidden="true" />
              <Text tone="muted" size="sm">
                Work by state
              </Text>
            </Block>
            <PieChart
              label="Hardening issue share"
              data={issueShare}
              summary="Most findings are resolved or being watched; only a small share is escalated."
              valueFormatter={formatPercent}
              animate
            />
          </ChartPanel>
        </Grid>

        <Grid columns={{ base: 1, xl: "minmax(0, 1.45fr) minmax(18rem, 0.8fr)" }} gap="lg">
          <ChartPanel
            title="Request trace"
            description="Flame graph for where a logs request spends time."
          >
            <Block direction="row" align="center" gap="sm">
              <FlameIcon size={18} aria-hidden="true" />
              <Text tone="muted" size="sm">
                API to service to database
              </Text>
            </Block>
            <FlameGraph
              label="Logs request trace"
              data={requestTraceFlame}
              labelDensity="compact"
              summary="The request spends most of its time in database work, with service enrichment close behind."
              valueFormatter={formatMs}
              animate
            />
          </ChartPanel>

          <ChartPanel
            title="Reliability trend"
            description="Line chart for the weekly app success rate."
          >
            <Block direction="row" align="center" gap="sm">
              <ChartLineIcon size={18} aria-hidden="true" />
              <Text tone="muted" size="sm">
                Seven-day success rate
              </Text>
            </Block>
            <LineChart
              label="Weekly reliability"
              data={reliabilityTrend}
              min={99.5}
              max={100}
              summary="Reliability stays above 99.7% while the app exercises route and data updates."
              valueFormatter={formatPercent}
              showGrid
              animate
            />
          </ChartPanel>
        </Grid>
      </ChartShell>
    </Page>
  );
}
