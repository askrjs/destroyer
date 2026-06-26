import { Link } from "@askrjs/askr/router";
import { Header, Navbar, NavBrand, NavLink } from "@askrjs/themes/core";
import { ThemeProvider, ThemeToggle } from "@askrjs/themes/theme";
import { MoonIcon, SunIcon } from "@askrjs/lucide";

export function PageLayout({ children }: { children?: unknown }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="destroyer-theme">
      <Header sticky>
        <Navbar aria-label="Primary navigation" width="auto">
          <NavBrand>
            <Link href="/">Destroyer</Link>
          </NavBrand>


          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>

          <ThemeToggle
            aria-label="Toggle theme"
            variant="ghost"
            size="icon"
            lightIcon={<SunIcon size={16} aria-hidden="true" />}
            darkIcon={<MoonIcon size={16} aria-hidden="true" />}
          />
        </Navbar>
      </Header>

      {children}
    </ThemeProvider>
  );
}
