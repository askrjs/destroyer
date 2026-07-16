import { Link } from "@askrjs/askr/router";
import {
  CircleUserRoundIcon,
  ComponentIcon,
  FileCode2Icon,
  FileTextIcon,
  RouteIcon,
  SettingsIcon,
} from "@askrjs/lucide";
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarSeparator,
  MenubarTrigger,
} from "@askrjs/themes/components";
import { docsContent, type DocsPath } from "./docs-data";

export function DocsArticleTools({ activePath }: { activePath: DocsPath }) {
  const content = docsContent[activePath];
  const copyRoutePath = () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    void navigator.clipboard.writeText(activePath).catch(() => {});
  };
  const menuLink = (href: string, children: unknown) =>
    (<Link href={href}>{children as never}</Link>) as never;

  return (
    <Menubar aria-label={`${content.title} article tools`}>
      <MenubarMenu value="view">
        <MenubarTrigger>
          <RouteIcon size={16} aria-hidden="true" />
          View
        </MenubarTrigger>
        <MenubarPortal>
          <MenubarContent side="bottom" align="start" sideOffset={8}>
            <MenubarLabel>Article</MenubarLabel>
            <MenubarGroup>
              <MenubarItem onPress={copyRoutePath}>
                <RouteIcon size={16} aria-hidden="true" />
                Copy route path
              </MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarLabel>Related</MenubarLabel>
            <MenubarGroup>
              <MenubarItem asChild>
                {menuLink(
                  "/docs/components",
                  <>
                    <ComponentIcon size={16} aria-hidden="true" />
                    Component guide
                  </>,
                )}
              </MenubarItem>
              <MenubarItem asChild>
                {menuLink(
                  "/settings",
                  <>
                    <SettingsIcon size={16} aria-hidden="true" />
                    Settings shell
                  </>,
                )}
              </MenubarItem>
              <MenubarItem asChild>
                {menuLink(
                  "/profile/activity",
                  <>
                    <CircleUserRoundIcon size={16} aria-hidden="true" />
                    Profile activity
                  </>,
                )}
              </MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarPortal>
      </MenubarMenu>
      <MenubarMenu value="export">
        <MenubarTrigger>
          <FileTextIcon size={16} aria-hidden="true" />
          Export
        </MenubarTrigger>
        <MenubarPortal>
          <MenubarContent side="bottom" align="end" sideOffset={8}>
            <MenubarLabel>Checks</MenubarLabel>
            <MenubarItem>
              <FileCode2Icon size={16} aria-hidden="true" />
              Copy markdown
            </MenubarItem>
            <MenubarItem disabled>
              <FileTextIcon size={16} aria-hidden="true" />
              Download PDF
            </MenubarItem>
          </MenubarContent>
        </MenubarPortal>
      </MenubarMenu>
    </Menubar>
  );
}
