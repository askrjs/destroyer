import { Link, currentAuth, currentRoute, navigate } from "@askrjs/askr/router";
import {
  BoxIcon,
  CircleUserRoundIcon,
  LogInIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  UserRoundIcon,
} from "@askrjs/lucide";
import {
  Avatar,
  AvatarFallback,
  Block,
  Brand,
  BrandLabel,
  BrandMark,
  Button,
  Container,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Footer,
  FooterContent,
  FooterDescription,
  FooterLink,
  FooterLinks,
  FooterSection,
  FooterTitle,
  Header,
  Navbar,
  NavBrand,
  NavGroup,
  NavLink,
  Text,
} from "@askrjs/themes/components";
import { ThemeScope, ThemeToggle } from "@askrjs/themes/theme";

function ProfileMenu() {
  const principal = currentAuth().principal;
  const name = typeof principal?.name === "string" ? principal.name : "Operator";
  const email = typeof principal?.email === "string" ? principal.email : "";
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Open profile menu" variant="ghost" size="icon">
        <CircleUserRoundIcon size={18} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuLabel data-variant="account">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <Block direction="column" gap="0">
            <Text as="span" weight="semibold" size="sm">
              {name}
            </Text>
            <Text as="span" tone="muted" size="sm">
              {email}
            </Text>
          </Block>
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => navigate("/profile")}>
          <UserRoundIcon size={16} aria-hidden="true" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/settings")}>
          <SettingsIcon size={16} aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => navigate("/logout")}>
          <LogOutIcon size={16} aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AuthNavControl() {
  const route = currentRoute();

  if (currentAuth().authenticated) {
    return <ProfileMenu />;
  }

  if (route.path === "/login") {
    return null;
  }

  return (
    <>
      <Block hide={{ base: true, md: false }}>
        <Button asChild variant="outline" size="sm">
          <Link href="/login">
            <LogInIcon size={16} aria-hidden="true" />
            Sign in
          </Link>
        </Button>
      </Block>
      <Block hide={{ base: false, md: true }}>
        <Button asChild variant="outline" size="icon">
          <Link href="/login" aria-label="Sign in">
            <LogInIcon size={16} aria-hidden="true" />
          </Link>
        </Button>
      </Block>
    </>
  );
}

export function PageLayout({ children }: { children?: unknown }) {
  const route = currentRoute();
  const isAuthRoute =
    route.path === "/login" || route.path === "/signup" || route.path === "/logout";
  const isDocsRoute = route.path === "/docs" || route.path.startsWith("/docs/");

  return (
    <ThemeScope defaultTheme="light" storageKey="destroyer-theme">
      <Block minHeight="screen">
        {!isAuthRoute && !isDocsRoute && (
          <Header sticky>
            <Container paddingY="sm">
              <Navbar aria-label="Primary navigation" width="full">
                <NavBrand>
                  <Brand asChild>
                    <Link href="/">
                      <BrandMark aria-hidden="true">
                        <BoxIcon size={16} />
                      </BrandMark>
                      <BrandLabel>Destroyer</BrandLabel>
                    </Link>
                  </Brand>
                </NavBrand>
                <NavGroup>
                  <NavLink href="/docs">Docs</NavLink>
                  <NavLink href="/logs">Logs</NavLink>
                  <NavLink href="/metrics">Metrics</NavLink>
                  {currentAuth().authenticated ? (
                    <NavLink href="/settings">Settings</NavLink>
                  ) : null}
                  <Block hide={{ base: true, md: false }}>
                    <NavLink href="/about">About</NavLink>
                  </Block>
                  <Block hide={{ base: true, md: false }}>
                    <NavLink href="/contact">Contact</NavLink>
                  </Block>
                </NavGroup>
                <NavGroup align="end">
                  <ThemeToggle
                    aria-label="Toggle theme"
                    variant="ghost"
                    size="icon"
                    lightIcon={<SunIcon size={16} aria-hidden="true" />}
                    darkIcon={<MoonIcon size={16} aria-hidden="true" />}
                  />
                  <AuthNavControl />
                </NavGroup>
              </Navbar>
            </Container>
          </Header>
        )}
        {children}
        {!isAuthRoute && !isDocsRoute && (
          <Footer>
            <Container paddingY="2xl">
              <FooterContent>
                <FooterSection>
                  <Brand>
                    <BrandMark aria-hidden="true">
                      <BoxIcon size={16} />
                    </BrandMark>
                    <FooterTitle>Destroyer</FooterTitle>
                  </Brand>
                  <FooterDescription>
                    Destroyer is a compact Askr workspace for checking routes, theme behavior, and
                    SSR, APIs, operational workflows, and component composition in one application.
                  </FooterDescription>
                </FooterSection>

                <FooterSection>
                  <FooterTitle>Explore</FooterTitle>
                  <FooterLinks aria-label="Explore">
                    <FooterLink href="#routing">Routing</FooterLink>
                    <FooterLink href="#themes">Themes</FooterLink>
                    <FooterLink href="#components">Components</FooterLink>
                    <FooterLink href="#forms">Forms</FooterLink>
                  </FooterLinks>
                </FooterSection>

                <FooterSection>
                  <FooterTitle>Resources</FooterTitle>
                  <FooterLinks aria-label="Resources">
                    <FooterLink href="#docs">Docs</FooterLink>
                    <FooterLink href="#patterns">Patterns</FooterLink>
                    <FooterLink href="#tokens">Tokens</FooterLink>
                    <FooterLink href="#examples">Examples</FooterLink>
                  </FooterLinks>
                </FooterSection>
              </FooterContent>
            </Container>
          </Footer>
        )}
      </Block>
    </ThemeScope>
  );
}
