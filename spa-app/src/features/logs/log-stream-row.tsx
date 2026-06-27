import { Block, Text, type VirtualListRowComponentProps } from "@askrjs/themes/components";
import { getSeverityTone, type LogEntry } from "./logs-data";

export function LogStreamRow({ item }: VirtualListRowComponentProps<LogEntry>) {
  return (
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
    </Block>
  );
}
