export type ScenarioDisposition = "standard" | "finding";

export interface ScenarioDefinition {
  id: `S${number}`;
  milestone: "original-32";
  route: string;
  behavior: string;
  testTitle: string;
  disposition: ScenarioDisposition;
}

const scenario = (
  id: ScenarioDefinition["id"],
  route: string,
  behavior: string,
  testTitle: string,
  disposition: ScenarioDisposition = "standard",
): ScenarioDefinition => ({ id, milestone: "original-32", route, behavior, testTitle, disposition });

export const scenarioCatalog = [
  scenario("S01", "/settings/workspace", "Dirty navigation cancel, discard, save, focus, persistence, and beforeunload", "dirty Workspace navigation"),
  scenario("S02", "/settings/workspace", "Two-tab optimistic conflict preserves local input", "two-page optimistic conflict"),
  scenario("S03", "/settings/workspace", "Pre-mutation failure retries exactly once", "retry exactly once"),
  scenario("S04", "/settings/workspace", "Held save safely completes after route teardown", "held Workspace save"),
  scenario("S05", "/settings/workspace", "DropdownMenu to AlertDialog unwind restores focus", "unwind invite actions", "finding"),
  scenario("S06", "/logs", "Extreme mobile log content keeps its Popover operable", "extreme log details", "finding"),
  scenario("S07", "/logs", "Session expiry tears down an open overlay", "session expires"),
  scenario("S08", "/settings/preferences", "Open Select survives breakpoint resize and restores focus", "Select portal", "finding"),
  scenario("S09", "/settings/workspace", "Protected mobile deep link survives login", "protected mobile deep link"),
  scenario("S10", "/logs", "Back and Forward restore URL, state, scroll, and focus", "Back and Forward", "finding"),
  scenario("S11", "/settings/preferences", "Live theme changes update an open portal", "open Select portal themed"),
  scenario("S12", "/contact", "Forced-colors mode remains operable with long copy", "forced-colors"),
  scenario("S13", "/contact", "Real 200 percent zoom asserts effective layout width", "zoom-200"),
  scenario("S14", "/contact", "Reduced-motion mode remains operable", "reduced-motion"),
  scenario("S15", "/login", "Immediate pre-hydration interaction preserves server liveness", "before hydration", "finding"),
  scenario("S16", "/metrics", "Preload and mounted-query failures recover independently", "independent route and mounted failures"),
  scenario("S17", "/incidents", "Incident selection and bulk acknowledgement persist", "bulk acknowledge"),
  scenario("S18", "/incidents", "Timeline resolution rejects optimistic conflicts", "timeline detail"),
  scenario("S19", "/incidents", "Virtualized incident detail, actions, CSV export, and focus remain coherent", "virtualized incident operations"),
  scenario("S20", "/logs", "Cursor history load-more retries after failure", "cursor-backed log history"),
  scenario("S21", "/logs", "Live insertion preserves row selection", "virtual-table selection", "finding"),
  scenario("S22", "/logs", "Filtering preserves valid selection and clears invalid selection", "filter cardinalities and selection"),
  scenario("S23", "/metrics", "Summary, metrics, and logs fail or hold independently", "independent Metrics sections", "finding"),
  scenario("S24", "/settings/workspace", "Approver group persists only for manual approval", "approver group"),
  scenario("S25", "/settings/preferences", "Timezone follows region and reset restores confirmed state", "constrain timezone"),
  scenario("S26", "/settings/notifications", "Rapid autosave resolves to final intent", "rapid notification changes"),
  scenario("S27", "/settings", "Profile validation, failure, retry, and conflict preserve input", "profile input", "finding"),
  scenario("S28", "/settings/security", "Typed deletion removes authentication", "typed confirmation"),
  scenario("S29", "/signup", "Account setup is keyboard operable", "using only the keyboard"),
  scenario("S30", "/signup", "Duplicate submission produces one effect", "duplicate account submissions"),
  scenario("S31", "/settings/workspace", "Offline dirty state survives reconnect and retry", "dirty Workspace input offline"),
  scenario("S32", "/settings/notifications", "Released stale response cannot overwrite later intent", "reverse-order stale response"),
] as const satisfies readonly ScenarioDefinition[];
