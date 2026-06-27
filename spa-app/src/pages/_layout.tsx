import { Link, currentRoute } from "@askrjs/askr/router";
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
import { ThemeProvider, ThemeToggle } from "@askrjs/themes/theme";
import { demoUser, isSignedIn } from "../auth";

function ProfileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Open profile menu" data-variant="ghost" data-size="icon">
        <CircleUserRoundIcon size={18} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuLabel data-variant="account">
          <Avatar>
            <AvatarFallback>{demoUser.initials}</AvatarFallback>
          </Avatar>
          <Block direction="column" gap="0">
            <Text as="span" weight="semibold" size="sm">
              {demoUser.name}
            </Text>
            <Text as="span" tone="muted" size="sm">
              {demoUser.email}
            </Text>
          </Block>
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRoundIcon size={16} aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon size={16} aria-hidden="true" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem data-variant="destructive" asChild>
          <Link href="/logout">
            <LogOutIcon size={16} aria-hidden="true" />
            Sign out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AuthNavControl() {
  const route = currentRoute();

  if (isSignedIn()) {
    return <ProfileMenu />;
  }

  if (route.path === "/login") {
    return null;
  }

  return (
    <>
      <Block hide={{ base: true, md: false }}>
        <Link href="/login" data-slot="button" data-variant="outline" data-size="sm">
          <LogInIcon size={16} aria-hidden="true" />
          Sign in
        </Link>
      </Block>
      <Block hide={{ base: false, md: true }}>
        <Link
          href="/login"
          data-slot="button"
          data-variant="outline"
          data-size="icon"
          aria-label="Sign in"
        >
          <LogInIcon size={16} aria-hidden="true" />
        </Link>
      </Block>
    </>
  );
}

export function PageLayout({ children }: { children?: unknown }) {
  const route = currentRoute();
  const isAuthRoute = route.path === "/login" || route.path === "/logout";
  const isDocsRoute = route.path === "/docs" || route.path.startsWith("/docs/");

  return (
    <ThemeProvider defaultTheme="light" storageKey="destroyer-theme">
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
                  <NavLink href="/" match="exact">
                    Overview
                  </NavLink>
                  <NavLink href="/docs">Docs</NavLink>
                  <NavLink href="/logs">Logs</NavLink>
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
                    component composition in a real SPA shell.
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
    </ThemeProvider>
  );
}
