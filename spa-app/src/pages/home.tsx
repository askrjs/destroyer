import { Link } from "@askrjs/askr/router";
import {
  CheckCircle2Icon,
  Code2Icon,
  GaugeIcon,
  LayersIcon,
  PaletteIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
  ZapIcon,
} from "@askrjs/lucide";
import {
  Alert,
  Badge,
  Block,
  Button,
  ButtonGroup,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Grid,
  Input,
  InputGroup,
  InputGroupText,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Label,
  Page,
  PageHeader,
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
  Progress,
  ProgressIndicator,
  Separator,
  Stat,
  StatDescription,
  StatLabel,
  StatValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@askrjs/themes/components";
import { ThemePicker } from "@askrjs/themes/theme";

const metrics = [
  {
    label: "Routes",
    value: "3",
    detail: "SPA paths share one mounted shell.",
    badge: "Live",
    variant: "success",
  },
  {
    label: "Theme modes",
    value: "3",
    detail: "Light, dark, and system are token-driven.",
    badge: "Synced",
    variant: "info",
  },
  {
    label: "Entrypoint",
    value: "1",
    detail: "Askr components import from one package surface.",
    badge: "Simple",
    variant: "secondary",
  },
] as const;

const packages = [
  { name: "@askrjs/themes", role: "Theme CSS", status: "Aligned", variant: "success" },
  { name: "@askrjs/ui", role: "Primitives", status: "Mounted", variant: "info" },
  { name: "@askrjs/lucide", role: "Icons", status: "Ready", variant: "secondary" },
] as const;

const checks = [
  "Active navigation is route-aware",
  "Theme state persists through the provider",
  "Cards, tables, forms, badges, and progress share one theme",
] as const;

export function HomePage() {
  return (
    <Page>
      <PageHeader
        title="Destroyer"
        description="A small Askr workspace showing routing, theming, and component composition in one app surface."
        actions={
          <ButtonGroup attached={false}>
            <Link href="/about" data-slot="button" data-variant="primary">
              <SparklesIcon size={16} aria-hidden="true" />
              Review app
            </Link>
            <Link href="/contact" data-slot="button" data-variant="outline">
              Open form
            </Link>
          </ButtonGroup>
        }
      />

      <Grid
        as="section"
        columns={{ base: 1, lg: "minmax(0, 1.35fr) minmax(18rem, 0.85fr)" }}
        gap="lg"
      >
        <Card variant="raised">
          <CardHeader>
            <CardTitle>Design system baseline</CardTitle>
            <CardDescription>
              Route-aware navigation, cards, tables, forms, progress, badges, and alerts all use
              Askr packages.
            </CardDescription>
            <CardAction>
              <Badge variant="success">Askr system</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Block direction="column" gap="md">
              <Item variant="muted">
                <ItemMedia>
                  <LayersIcon size={18} aria-hidden="true" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Application shell</ItemTitle>
                  <ItemDescription>
                    Sticky header, active routes, and responsive content.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="outline">Ready</Badge>
                </ItemActions>
              </Item>
              <Item>
                <ItemMedia>
                  <PaletteIcon size={18} aria-hidden="true" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Theme contract</ItemTitle>
                  <ItemDescription>Default theme CSS carries the visual polish.</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="info">Synced</Badge>
                </ItemActions>
              </Item>
            </Block>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coverage</CardTitle>
            <CardDescription>What this sample exercises.</CardDescription>
            <CardAction>
              <Popover>
                <PopoverTrigger
                  aria-label="View coverage details"
                  data-slot="button"
                  data-variant="ghost"
                  data-size="icon"
                >
                  <GaugeIcon size={18} aria-hidden="true" />
                </PopoverTrigger>
                <PopoverPortal>
                  <PopoverContent
                    side="bottom"
                    align="end"
                    sideOffset={8}
                    style={{ inlineSize: "min(20rem, calc(100vw - 2rem))" }}
                  >
                    <Text as="strong" weight="semibold" size="sm">
                      Coverage details
                    </Text>
                    <Text tone="muted" size="sm">
                      These scores track how much of the current shell is exercised by routes, theme
                      controls, forms, tables, and navigation states.
                    </Text>
                    <Block direction="row" align="center" justify="between" gap="md">
                      <Text tone="muted" size="sm">
                        Next target
                      </Text>
                      <Badge variant="info">Overlays</Badge>
                    </Block>
                  </PopoverContent>
                </PopoverPortal>
              </Popover>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Block direction="column" gap="md">
              <Block direction="column" gap="xs">
                <Block direction="row" align="center" justify="between" gap="md">
                  <Text as="span" tone="muted" size="sm">
                    Visual parity
                  </Text>
                  <Text as="strong" weight="semibold" size="sm">
                    92%
                  </Text>
                </Block>
                <Progress value={92}>
                  <ProgressIndicator />
                </Progress>
              </Block>
              <Block direction="column" gap="xs">
                <Block direction="row" align="center" justify="between" gap="md">
                  <Text as="span" tone="muted" size="sm">
                    Route polish
                  </Text>
                  <Text as="strong" weight="semibold" size="sm">
                    86%
                  </Text>
                </Block>
                <Progress value={86}>
                  <ProgressIndicator />
                </Progress>
              </Block>
              <Block direction="column" gap="xs">
                <Block direction="row" align="center" justify="between" gap="md">
                  <Text as="span" tone="muted" size="sm">
                    Day one UX
                  </Text>
                  <Text as="strong" weight="semibold" size="sm">
                    89%
                  </Text>
                </Block>
                <Progress value={89}>
                  <ProgressIndicator />
                </Progress>
              </Block>
            </Block>
          </CardContent>
        </Card>
      </Grid>

      <Grid as="section" columns={{ base: 1, lg: 3 }} gap="lg">
        {metrics.map(({ badge, detail, label, value, variant }) => (
          <Card key={label}>
            <CardHeader>
              <Stat>
                <StatLabel>{label}</StatLabel>
                <StatValue>{value}</StatValue>
              </Stat>
              <CardAction>
                <Badge variant={variant}>{badge}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <StatDescription>{detail}</StatDescription>
            </CardContent>
          </Card>
        ))}
      </Grid>

      <Grid
        as="section"
        columns={{ base: 1, lg: "minmax(0, 1.35fr) minmax(18rem, 0.85fr)" }}
        gap="lg"
      >
        <Card variant="raised">
          <CardHeader>
            <CardTitle>Release surface</CardTitle>
            <CardDescription>Package status shown with the shared table primitive.</CardDescription>
            <CardAction>
              <Button size="sm" variant="ghost">
                <Code2Icon size={14} aria-hidden="true" />
                Inspect
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div data-slot="data-table">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Package</TableHeaderCell>
                    <TableHeaderCell>Role</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.name}>
                      <TableCell>{pkg.name}</TableCell>
                      <TableCell>{pkg.role}</TableCell>
                      <TableCell>
                        <Badge variant={pkg.variant}>{pkg.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>Everyday form controls using the active theme.</CardDescription>
            <CardAction>
              <Settings2Icon size={18} aria-hidden="true" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <Block direction="column" gap="md">
              <Field>
                <Label for="theme-search">Search components</Label>
                <InputGroup>
                  <InputGroupText>
                    <SearchIcon size={16} aria-hidden="true" />
                  </InputGroupText>
                  <Input id="theme-search" name="theme-search" placeholder="button, card, table" />
                </InputGroup>
              </Field>
              <Field>
                <Label for="theme-mode">Theme mode</Label>
                <ThemePicker id="theme-mode" />
              </Field>
              <Alert
                variant="info"
                icon={<ZapIcon size={17} aria-hidden="true" />}
                title="Token-backed visuals"
                description="The SPA uses the same default theme CSS as package consumers."
              />
            </Block>
          </CardContent>
        </Card>
      </Grid>

      <Card>
        <CardHeader>
          <CardTitle>Readiness checks</CardTitle>
          <CardDescription>Small checks that keep the sample honest.</CardDescription>
          <CardAction>
            <Badge variant="success">Passing</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Separator decorative />
          <Grid columns={{ base: 1, lg: 3 }} gap="lg">
            {checks.map((check) => (
              <Item key={check} size="sm">
                <ItemMedia>
                  <CheckCircle2Icon size={16} aria-hidden="true" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{check}</ItemTitle>
                </ItemContent>
              </Item>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Page>
  );
}
