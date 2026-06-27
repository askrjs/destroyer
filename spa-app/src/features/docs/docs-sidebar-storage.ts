const DOCS_SIDEBAR_STORAGE_KEY = "destroyer-docs-sidebar-collapsed";

export function getStoredDocsSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DOCS_SIDEBAR_STORAGE_KEY) === "true";
}

export function storeDocsSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DOCS_SIDEBAR_STORAGE_KEY, collapsed ? "true" : "false");
}
