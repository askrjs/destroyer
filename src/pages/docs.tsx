import { state } from "@askrjs/askr";
import { Link, currentRoute } from "@askrjs/askr/router";
import { BoxesIcon } from "@askrjs/lucide";
import { Block, Button, Grid, Text } from "@askrjs/themes/components";
import { DocsArticle } from "../features/docs/docs-article";
import { getActiveDocsPath } from "../features/docs/docs-data";
import { DocsSidebar } from "../features/docs/docs-sidebar";
import {
  getStoredDocsSidebarCollapsed,
  storeDocsSidebarCollapsed,
} from "../features/docs/docs-sidebar-storage";

export function DocsPage() {
  const activePath = getActiveDocsPath(currentRoute().path);
  const [collapsed, setCollapsed] = state(getStoredDocsSidebarCollapsed());
  const setDocsSidebarCollapsed = (nextCollapsed: boolean) => {
    setCollapsed(nextCollapsed);
    storeDocsSidebarCollapsed(nextCollapsed);
  };

  return (
    <Block as="main" grow width="full" background="canvas">
      <Grid
        columns={{
          base: "3.75rem minmax(0, 1fr)",
          lg: collapsed() ? "4.5rem minmax(0, 1fr)" : "16rem minmax(0, 1fr)",
        }}
        gap="0"
        align="stretch"
      >
        <DocsSidebar
          activePath={activePath}
          collapsed={collapsed()}
          onToggle={() => setDocsSidebarCollapsed(!collapsed())}
        />
        <Block padding={{ base: "md", lg: "2xl" }}>
          <Block maxWidth="lg" gap="2xl">
            <Block rowFrom="md" align={{ base: "start", md: "center" }} justify="between" gap="md">
              <Block gap="xs">
                <Text as="strong" weight="bold" size="lg">
                  Docs
                </Text>
                <Text tone="muted">
                  Full-width documentation shell with a collapsible left navigation.
                </Text>
              </Block>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings">
                  <BoxesIcon size={16} aria-hidden="true" />
                  Open settings
                </Link>
              </Button>
            </Block>
            <DocsArticle activePath={activePath} />
          </Block>
        </Block>
      </Grid>
    </Block>
  );
}
