import { navigate } from "@askrjs/askr/router";
import {
  LayoutPanelTopIcon,
  PaintbrushIcon,
  RouteIcon,
  ShieldCheckIcon,
} from "@askrjs/lucide";
import {
  Alert,
  Badge,
  Block,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Page,
  PageHeader,
  Separator,
} from "@askrjs/themes/components";

const validations = [
  {
    title: "Client routing",
    description: "The layout keeps active navigation stable across three SPA routes.",
    badge: "Routes",
    variant: "info",
    Icon: RouteIcon,
  },
  {
    title: "Theme contract",
    description: "Shared tokens drive light, dark, and persisted theme state.",
    badge: "Tokens",
    variant: "success",
    Icon: PaintbrushIcon,
  },
  {
    title: "Page composition",
    description: "Page headers, cards, alerts, and forms stay in the theme system.",
    badge: "Catalog",
    variant: "secondary",
    Icon: LayoutPanelTopIcon,
  },
] as const;

export function AboutPage() {
  return (
    <Page>
      <PageHeader
        title="About Destroyer"
        description="Destroyer is a small integration target for the Askr SPA path and the default theme catalog."
        actions={
          <Button type="button" variant="primary" onPress={() => navigate("/contact")}>
            Contact
          </Button>
        }
      />

      <Alert
        variant="success"
        icon={<ShieldCheckIcon size={18} aria-hidden="true" />}
        title="Focused sample"
        description="This app stays intentionally small so visual and routing regressions are easy to spot."
      />

      <Block direction={{ base: "column", lg: "row" }} gap="lg" align="stretch">
        {validations.map(({ Icon, badge, description, title, variant }) => (
          <Block key={title} direction="column" grow>
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                <CardAction>
                  <Badge variant={variant}>{badge}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <Block direction="row" align="center" gap="sm">
                  <Block center padding="sm" radius="md" background="selected">
                    <Icon size={20} aria-hidden="true" />
                  </Block>
                  <span>{title}</span>
                </Block>
              </CardContent>
            </Card>
          </Block>
        ))}
      </Block>

      <Card variant="raised">
        <CardHeader>
          <CardTitle>What stays simple</CardTitle>
          <CardDescription>
            The SPA is a visual baseline, not a full component gallery or product dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Separator decorative />
          <Block direction="column" gap="sm" paddingY="md">
            <Block direction="row" align="center" gap="sm">
              <ShieldCheckIcon size={16} aria-hidden="true" />
              <span>No app-local styling unless the theme primitives cannot express the layout.</span>
            </Block>
            <Block direction="row" align="center" gap="sm">
              <ShieldCheckIcon size={16} aria-hidden="true" />
              <span>No extra routes beyond overview, about, contact, and the fallback.</span>
            </Block>
            <Block direction="row" align="center" gap="sm">
              <ShieldCheckIcon size={16} aria-hidden="true" />
              <span>No SSR or SSG changes in this pass.</span>
            </Block>
          </Block>
        </CardContent>
      </Card>
    </Page>
  );
}
