# Destroyer Agent Notes

Destroyer is a realistic integration app for hardening `@askrjs/themes` in normal product flows. Do not turn it into a component gallery.

## Adding A Theme Component

1. Pick one component and one natural location for it.
   - Use existing pages and workflows before adding new demo-only surfaces.
   - Prefer realistic app jobs: settings preferences, account security, docs navigation, profile activity, contact support, or workspace admin.

2. Define the behavior being exercised.
   - State what the component should prove before coding: keyboard behavior, portal placement, responsive layout, disabled state, selected state, focus ring, overflow, dark mode, or route persistence.
   - Add only the states that fit the page.

3. Implement the smallest useful slice.
   - Keep copy and layout domain-specific.
   - Reuse `@askrjs/themes/components` and existing page primitives.
   - Keep responsive props readable; prefer named helpers such as `rowFrom` when they express the layout directly.
   - Use component props such as `SidebarMenuButton tooltip` and explicit `tooltipSide` before reaching for raw data attributes.

4. Verify functionality with focused tests.
   - If the underlying primitive changed, run the focused `askr-ui` browser test for that primitive.
   - If only Destroyer changed, run `npm run build` from `destroyer/spa-app`.
   - If `askr-themes` was rebuilt, restart the Destroyer dev server because packaging refreshes `askr-themes/dist` while Vite is watching it.

5. Verify visually in the running SPA.
   - Open the exact route in the browser and exercise the component with real clicks and keyboard input.
   - Check desktop and mobile viewports.
   - Confirm no clipped content, overlapping text, layout shift, off-screen portal content, or stale route state.
   - Check console and page errors.

6. Polish the component before adding another.
   - Fix theme CSS or Destroyer composition issues immediately.
   - Mirror theme CSS changes into `askr-themes/templates/theme` when default theme source changes.
   - Do not move on while the current component looks unfinished or makes the page feel artificial.

## High-Value Component Order

Prioritize components that expose real integration risks:

1. `Select` in Settings.
2. `Checkbox`, `RadioGroup`, and `Switch` in preference/security forms.
3. `AlertDialog` for destructive workspace actions.
4. `Table` with `ScrollArea` for audit/activity data.
5. `Accordion` or `Collapsible` in Docs.
6. `Tabs` on Profile or Settings.
7. `Slider` for numeric settings that need keyboard and pointer coverage.
8. `ToggleGroup` for compact segmented choices.
9. `HoverCard` for contextual metadata that should not interrupt the workflow.
10. `Menubar` for dense document or app actions with nested menus.
11. `Skeleton` for loading states inside existing content structure.
12. `VirtualList` and `VirtualTable` for dense operational data surfaces.

Current coverage:

- `Select`: Settings > Preferences > Display defaults.
- `Checkbox`: Settings > Notifications > Delivery channels.
- `RadioGroup`: Settings > Workspace > Default role.
- `Sidebar` tooltip props: Docs collapsed navigation and rail controls.
- `AlertDialog`: Settings > Workspace > Invite links.
- `ScrollArea`: Settings > Security > Security activity.
- `Accordion`: Docs article verification notes.
- `Tabs`: Profile route sections.
- `Slider`: Settings > Security > Session timeout.
- `ToggleGroup`: Settings > Preferences > Workspace density.
- `HoverCard`: Profile > Activity > Surface metadata badges.
- `Menubar`: Docs article header tools.
- `Skeleton`: Settings > Security > Security activity refresh.
- `VirtualList`: Logs > Live stream.
- `VirtualTable`: Logs > Event detail.
