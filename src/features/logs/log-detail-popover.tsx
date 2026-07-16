import { InfoIcon } from "@askrjs/lucide";
import {
  Badge,
  Block,
  Button,
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
  Separator,
  Text,
} from "@askrjs/themes/components";
import { getBadgeVariant, type LogEntry } from "./logs-data";

export function LogDetailPopover({ entry }: { entry: LogEntry }) {
  return (
    <Popover>
      <Button asChild variant="ghost" size="icon-xs">
        <PopoverTrigger aria-label={`View details for ${entry.id}`}>
          <InfoIcon size={16} aria-hidden="true" />
        </PopoverTrigger>
      </Button>
      <PopoverPortal>
        <PopoverContent
          aria-label="Log event details"
          side="left"
          align="start"
          sideOffset={8}
          width="md"
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
