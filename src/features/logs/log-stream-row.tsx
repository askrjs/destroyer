import { Text, type VirtualListRowComponentProps } from "@askrjs/themes/components";
import { getSeverityTone, type LogEntry } from "./logs-data";

export function LogStreamRow({ item }: VirtualListRowComponentProps<LogEntry>) {
  return (
    <div
      class="log-stream-row"
      data-slot="block"
      data-ak-layout="true"
      data-severity={item.severity}
      aria-label={`${item.severity} ${item.service} event at ${item.time}`}
    >
      <div class="log-stream-row-content" data-slot="block" data-ak-layout="true">
        <div class="log-stream-row-lines" data-slot="block" data-ak-layout="true">
          <div class="log-stream-row-heading" data-slot="block" data-ak-layout="true">
            <div class="log-stream-row-message" data-slot="block" data-ak-layout="true">
              <span class="log-stream-row-severity" data-slot="block" data-ak-layout="true">
                <Text as="span" tone={getSeverityTone(item.severity)} weight="semibold" size="sm">
                  {item.severity}
                </Text>
              </span>
              <Text size="sm" truncate>
                {item.message}
              </Text>
            </div>
            <span class="log-stream-row-time" data-slot="block" data-ak-layout="true">
              <Text as="span" tone="muted" size="sm" font="mono" numeric="tabular">
                {item.time}
              </Text>
            </span>
          </div>

          <div class="log-stream-row-details" data-slot="block" data-ak-layout="true">
            <div class="log-stream-row-service-route" data-slot="block" data-ak-layout="true">
              <span class="shrinkable-log-service" data-slot="block" data-ak-layout="true">
                <Text as="span" tone="muted" size="sm" font="mono" truncate>
                  {item.service}
                </Text>
              </span>
              <Text as="span" tone="muted" size="sm" truncate>
                {item.route}
              </Text>
            </div>
            <div class="log-stream-row-latency" data-slot="block" data-ak-layout="true">
              <Text as="span" tone="muted" size="sm" font="mono" numeric="tabular">
                {item.latency}ms
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
