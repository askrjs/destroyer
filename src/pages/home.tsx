import { Link } from "@askrjs/askr/router";
import { derive, state } from "@askrjs/askr";
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
  DataTable,
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
  ProgressCircle,
  ProgressCircleIndicator,
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
import { checks, metrics, packages } from "../features/home/home-data";

export function HomePage() {
  const packageSearch = state("");
  const filteredPackages = derive(() => {
    const query = packageSearch().trim().toLowerCase();
    return query
      ? packages.filter((pkg) =>
          `${pkg.name} ${pkg.role} ${pkg.status}`.toLowerCase().includes(query),
        )
      : packages;
  });
  return (
    <Page>
      <PageHeader
        title="Destroyer"
        description="A full-stack operations workspace with SSR, authenticated APIs, observability, and production-oriented workflows."
        actions={
          <ButtonGroup attached={false}>
            <Button asChild variant="primary">
              <Link href="/about">
                <SparklesIcon size={16} aria-hidden="true" />
                Review app
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Open form</Link>
            </Button>
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
            <CardDescription>What this application exercises together.</CardDescription>
            <CardAction>
              <Popover>
                <Button asChild variant="ghost" size="icon">
                  <PopoverTrigger aria-label="View coverage details">
                    <GaugeIcon size={18} aria-hidden="true" />
                  </PopoverTrigger>
                </Button>
                <PopoverPortal>
                  <PopoverContent side="bottom" align="end" sideOffset={8} width="md">
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
              <Block
                direction="row"
                align="center"
                gap="md"
                background="muted"
                padding="md"
                radius="md"
              >
                <ProgressCircle aria-label="Overall component coverage" value={89}>
                  <ProgressCircleIndicator />
                </ProgressCircle>
                <Block direction="column" gap="xs">
                  <Block direction="row" align="baseline" gap="sm">
                    <Text as="strong" size="lg" weight="semibold" numeric="tabular">
                      89%
                    </Text>
                    <Text weight="medium">Overall coverage</Text>
                  </Block>
                  <Text tone="muted" size="sm">
                    Routes, overlays, forms, and virtualized surfaces are exercised together.
                  </Text>
                </Block>
              </Block>
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
              <Button asChild size="sm" variant="ghost">
                <Link href="/logs">
                  <Code2Icon size={14} aria-hidden="true" />
                  Inspect logs
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <DataTable>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Package</TableHeaderCell>
                    <TableHeaderCell>Role</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPackages().map((pkg) => (
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
            </DataTable>
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
                  <Input
                    id="theme-search"
                    name="theme-search"
                    placeholder="themes, primitives, icons"
                    value={packageSearch()}
                    onInput={(event: Event) =>
                      packageSearch.set((event.target as HTMLInputElement).value)
                    }
                  />
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
                description="The server-rendered workspace and hydrated client share the same theme contract."
              />
            </Block>
          </CardContent>
        </Card>
      </Grid>

      <Card>
        <CardHeader>
          <CardTitle>Readiness checks</CardTitle>
          <CardDescription>Operational checks that keep the application honest.</CardDescription>
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
