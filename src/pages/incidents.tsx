import { state } from "@askrjs/askr";
import { currentAuth } from "@askrjs/askr/router";
import {
  Badge,
  Block,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Page,
  PageHeader,
  Text,
} from "@askrjs/themes/components";
import { incidentsData } from "../features/incidents/incidents-model";
import type { IncidentRecord } from "../server/contracts";

export function IncidentsPage() {
  const incidents = incidentsData(currentAuth().principal?.id ?? "anonymous");
  const pending = state("");
  const error = state("");
  const selected = state<readonly string[]>([]);
  const mutate = async (incident: IncidentRecord, status: "acknowledged" | "resolved") => {
    pending.set(incident.id);
    error.set("");
    try {
      const response = await fetch(`/api/operations/incidents/${encodeURIComponent(incident.id)}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, version: incident.version }),
      });
      if (!response.ok)
        throw new Error(
          response.status === 409
            ? "Incident changed in another session."
            : `Incident update failed (${response.status}).`,
        );
      location.reload();
    } catch (cause) {
      error.set(cause instanceof Error ? cause.message : "Incident update failed.");
      pending.set("");
    }
  };
  const bulkAcknowledge = async () => {
    const targets = (incidents.data ?? []).filter(
      (incident) => selected().includes(incident.id) && incident.status === "investigating",
    );
    error.set("");
    pending.set("bulk");
    try {
      for (const incident of targets) {
        const response = await fetch(
          `/api/operations/incidents/${encodeURIComponent(incident.id)}`,
          {
            method: "POST",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status: "acknowledged", version: incident.version }),
          },
        );
        if (!response.ok) throw new Error(`Bulk acknowledgement failed (${response.status}).`);
      }
      location.reload();
    } catch (cause) {
      pending.set("");
      error.set(cause instanceof Error ? cause.message : "Bulk acknowledgement failed.");
    }
  };
  return (
    <Page>
      <PageHeader
        title="Incidents"
        description="Acknowledge and resolve operational incidents without leaving the workspace."
      />
      {error() ? (
        <Text role="alert" tone="danger">
          {error()}
        </Text>
      ) : null}
      <Button
        type="button"
        disabled={pending() === "bulk" || selected().length === 0}
        onPress={() => void bulkAcknowledge()}
      >
        Acknowledge selected
      </Button>
      <Block gap="md" aria-label="Operational incidents">
        {(incidents.data ?? []).map((incident) => (
          <Card key={incident.id}>
            <CardHeader>
              <CardTitle>{incident.title}</CardTitle>
              <CardDescription>
                {incident.service} · Updated {new Date(incident.updatedAt).toLocaleString()}
              </CardDescription>
              <CardAction>
                <Badge>{incident.severity}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Block direction={{ base: "column", sm: "row" }} gap="sm">
                <Checkbox
                  aria-label={`Select ${incident.title}`}
                  checked={selected().includes(incident.id)}
                  onCheckedChange={(checked) =>
                    selected.set(
                      checked
                        ? [...selected(), incident.id]
                        : selected().filter((id) => id !== incident.id),
                    )
                  }
                />
                <Text>Status: {incident.status}</Text>
                {incident.status === "investigating" ? (
                  <Button
                    disabled={pending() === incident.id}
                    onPress={() => void mutate(incident, "acknowledged")}
                  >
                    Acknowledge
                  </Button>
                ) : null}
                {incident.status !== "resolved" ? (
                  <Button
                    variant="outline"
                    disabled={pending() === incident.id}
                    onPress={() => void mutate(incident, "resolved")}
                  >
                    Resolve
                  </Button>
                ) : null}
              </Block>
              <Collapsible>
                <CollapsibleTrigger>View timeline</CollapsibleTrigger>
                <CollapsibleContent>
                  <Text>Created · {new Date(incident.createdAt).toLocaleString()}</Text>
                  <Text>
                    {incident.status} · {new Date(incident.updatedAt).toLocaleString()} · version{" "}
                    {incident.version}
                  </Text>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))}
      </Block>
    </Page>
  );
}
