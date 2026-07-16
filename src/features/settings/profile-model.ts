import { createQuery, defineQuery } from "@askrjs/askr/data";
import { defineAction } from "@askrjs/askr/actions";
import { schema } from "@askrjs/schema";
import type { OperatorProfile } from "../../server/dependencies";

export const operatorProfileQuery = defineQuery<{ principalId: string }, OperatorProfile>({
  key: ({ principalId }) => `operator-profile:${principalId}`,
  async fetch({ signal }) {
    const response = await fetch("/api/profile", { signal, credentials: "same-origin" });
    if (!response.ok) throw new Error(`Profile request failed (${response.status}).`);
    return response.json() as Promise<OperatorProfile>;
  },
});

export const updateProfileAction = defineAction({
  id: "update-profile",
  input: schema.object({
    displayName: schema.string({ minLength: 2, maxLength: 80 }),
    version: schema.string({ pattern: "^[1-9][0-9]*$" }),
  }),
  invalidates: ["operator-profile"],
});

export const operatorProfileData = (principalId: string) =>
  createQuery(operatorProfileQuery, { principalId });
