const DOCS_SIDEBAR_STORAGE_KEY = "destroyer-docs-sidebar-collapsed";

export function getStoredDocsSidebarCollapsed(): boolean {
  return false;
}

export function storeDocsSidebarCollapsed(collapsed: boolean): void {
  void DOCS_SIDEBAR_STORAGE_KEY;
  void collapsed;
}
