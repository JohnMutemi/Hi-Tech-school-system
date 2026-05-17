import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

type ThemeToggleProps = {
  /** Navbar over hero (transparent) vs scrolled solid bar */
  overHero?: boolean;
  className?: string;
};

export function ThemeToggle({ overHero = false, className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!mounted}
      className={cn(
        "relative grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors",
        overHero
          ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
          : "border-border bg-secondary text-foreground hover:bg-accent",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <Sun
        className={cn(
          "h-5 w-5 transition-all",
          isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          !overHero && "text-gold",
        )}
        aria-hidden
      />
      <Moon
        className={cn(
          "absolute h-5 w-5 transition-all",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0",
          overHero ? "text-white" : "text-primary",
        )}
        aria-hidden
      />
    </button>
  );
}
