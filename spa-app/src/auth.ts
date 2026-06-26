const AUTH_STORAGE_KEY = "destroyer-auth";

export type DemoUser = {
  name: string;
  email: string;
  initials: string;
};

export const demoUser: DemoUser = {
  name: "Sponge Bob",
  email: "sponge.bob@example.com",
  initials: "SB",
};

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function isSignedIn(): boolean {
  if (!hasStorage()) return false;
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

export function signIn(): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
}

export function signOut(): void {
  if (!hasStorage()) return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
