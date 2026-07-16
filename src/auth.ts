import type { AuthContext } from "@askrjs/auth";
import { safeRedirect } from "@askrjs/server/auth";

export async function resolveAuth(): Promise<AuthContext> {
  const response = await fetch("/auth/v1/session", { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("Unable to resolve the current identity.");
  return response.json() as Promise<AuthContext>;
}

async function mutate(
  path: string,
  method: "POST" | "DELETE",
  credentials?: { email: string; password: string },
): Promise<Response> {
  return fetch(path, {
    method,
    headers: {
      accept: "application/json",
      origin: location.origin,
      ...(credentials ? { "content-type": "application/json" } : {}),
    },
    ...(credentials ? { body: JSON.stringify(credentials) } : {}),
  });
}

export const signIn = (credentials: { email: string; password: string }) =>
  mutate("/auth/v1/session", "POST", credentials);
export const signUp = (credentials: { email: string; password: string }) =>
  mutate("/auth/v1/accounts", "POST", credentials);
export const signOut = () => mutate("/auth/v1/session", "DELETE");

export function validatedNext(search: string, fallback = "/logs"): string {
  return safeRedirect(fallback)(new URLSearchParams(search).get("next"));
}
