import { Badge, Block, Text, type VirtualTableColumn } from "@askrjs/themes/components";
import { getBadgeVariant, type LogEntry } from "./logs-data";
import { LogDetailPopover } from "./log-detail-popover";

export const logColumns: readonly VirtualTableColumn<LogEntry>[] = [
  {
    id: "time",
    header: "Time",
    width: "6rem",
    cellComponent: ({ row }) => (
      <Text as="span" tone="muted" size="sm">
        {row.time}
      </Text>
    ),
  },
  {
    id: "severity",
    header: "Severity",
    width: "7rem",
    cellComponent: ({ row }) => (
      <Badge variant={getBadgeVariant(row.severity)}>{row.severity}</Badge>
    ),
  },
  {
    id: "service",
    header: "Service",
    width: "8rem",
    cellComponent: ({ row }) => <Text size="sm">{row.service}</Text>,
  },
  {
    id: "route",
    header: "Route",
    width: "12rem",
    cellComponent: ({ row }) => (
      <Text as="span" tone="muted" size="sm">
        {row.route}
      </Text>
    ),
  },
  {
    id: "latency",
    header: "Latency",
    width: "6rem",
    cellComponent: ({ row }) => <Text size="sm">{row.latency}ms</Text>,
  },
  {
    id: "details",
    header: "Details",
    width: "4rem",
    cellComponent: ({ row }) => (
      <Block center>
        <LogDetailPopover entry={row} />
      </Block>
    ),
  },
];
