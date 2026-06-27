import { LaptopIcon, MoonIcon, SunIcon } from "@askrjs/lucide";

export function getNextThemeName(theme: string): string {
  if (theme === "light") return "dark";
  if (theme === "dark") return "system";
  return "light";
}

export function getThemeLabel(theme: string): string {
  if (theme === "dark") return "Dark";
  if (theme === "system") return "System";
  return "Light";
}

export function getThemeIcon(theme: string) {
  if (theme === "dark") return MoonIcon;
  if (theme === "system") return LaptopIcon;
  return SunIcon;
}
