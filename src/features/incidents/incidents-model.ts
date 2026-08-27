import { createQuery, defineQuery, queryScope } from "@askrjs/askr/data";
import type { IncidentRecord } from "../../server/contracts";

const incidentsScope = queryScope("destroyer.incidents");
export const incidentsQuery = defineQuery<{ principalId: string }, readonly IncidentRecord[]>({
  key: ({ principalId }) => incidentsScope.key(principalId),
  async fetch({ signal }) {
    const response = await fetch("/api/operations/incidents", {
      credentials: "same-origin",
      signal,
    });
    if (!response.ok) throw new Error(`Incident request failed (${response.status}).`);
    return response.json() as Promise<readonly IncidentRecord[]>;
  },
});
export const incidentsData = (principalId: string) => createQuery(incidentsQuery, { principalId });
