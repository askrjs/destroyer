import { state } from "@askrjs/askr";
import { currentAuth, currentRoute, navigate } from "@askrjs/askr/router";
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
  VirtualList,
} from "@askrjs/themes/components";
import { incidentsData } from "../features/incidents/incidents-model";
import type { IncidentRecord } from "../server/contracts";

export function IncidentsPage() {
  const incidents = incidentsData(currentAuth().principal?.id ?? "anonymous");
  const route = currentRoute<never, { incidentId?: string }>();
  const evidenceIncident = (incidents.data ?? []).find(
    (incident) => incident.id === route.state?.incidentId,
  );
  const pending = state("");
  const error = state("");
  const selected = state<readonly string[]>([]);
  const expandedIncidentId = state<string | null>(null);
  const exportSelected = () => {
    const rows = (incidents.data ?? []).filter((incident) => selected().includes(incident.id));
    const csv = [
      "id,title,service,severity,status",
      ...rows.map((incident) =>
        [incident.id, incident.title, incident.service, incident.severity, incident.status]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "selected-incidents.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };
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
      <Button
        type="button"
        variant="outline"
        disabled={selected().length === 0}
        onPress={exportSelected}
      >
        Export selected
      </Button>
      {route.query.get("review") === "evidence" ? (
        <Card aria-label="Evidence confirmation">
          <CardHeader>
            <CardTitle>Confirm incident evidence</CardTitle>
            <CardDescription>
              {evidenceIncident
                ? `Review the staged evidence for ${evidenceIncident.title}.`
                : "The originating incident is unavailable in this history entry."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onPress={() => history.back()}>
              Back to incidents
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <VirtualList
        aria-label="Operational incidents"
        viewport="lg"
        items={incidents.data ?? []}
        rowHeight={220}
        getRowHeight={(incident) => (expandedIncidentId() === incident.id ? 310 : 220)}
        overscan={1}
        getKey={(incident) => incident.id}
        rowComponent={({ item: incident }) => (
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
                <Button
                  type="button"
                  variant="ghost"
                  onPress={() =>
                    navigate("/incidents?review=evidence", {
                      state: { incidentId: incident.id },
                    })
                  }
                >
                  Review evidence
                </Button>
              </Block>
              <Collapsible
                open={expandedIncidentId() === incident.id}
                onOpenChange={(open) => expandedIncidentId.set(open ? incident.id : null)}
              >
                <CollapsibleTrigger>View timeline</CollapsibleTrigger>
                <CollapsibleContent>
                  <Text>Created · {new Date(incident.createdAt).toLocaleString()}</Text>
                  <Text>
                    {incident.status} · {new Date(incident.updatedAt).toLocaleString()} · version{" "}
                    {incident.version}
                  </Text>
                  <Button type="button" variant="ghost">
                    Inspect timeline evidence
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        )}
      />
    </Page>
  );
}
