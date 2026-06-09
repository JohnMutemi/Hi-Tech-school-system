import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logo } from "@/data/site-media";
import { StaffLoginButton } from "@/components/site/StaffLoginButton";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#admissions", label: "Admissions" },
  { href: "#news", label: "News" },
  { href: "#gallery", label: "Gallery" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <header
      className={cn(
        "site-header sticky top-0 z-50 border-b border-transparent backdrop-blur-md bg-background/85",
        (scrolled || open) && "site-header-scrolled",
      )}
    >
      <div className="site-container flex h-full items-center justify-between gap-3">
        <Link
          to="/"
          className="group flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
          onClick={closeMenu}
        >
          <img
            src={logo}
            alt="The Bridge Academy logo"
            className="h-9 w-9 rounded-lg object-contain bg-background ring-1 ring-border shadow-sm transition group-hover:ring-primary/30 sm:h-10 sm:w-10"
          />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-base font-semibold text-foreground sm:text-lg">
              The Bridge
            </div>
            <div className="truncate text-[9px] uppercase tracking-[0.16em] text-muted-foreground sm:text-[10px] sm:tracking-[0.18em]">
              Academy
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="min-h-11 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
            >
              {l.label}
            </a>
          ))}
          <StaffLoginButton scrolled={true} />
          <ThemeToggle className="ml-0.5" />
          <a
            href="#admissions"
            className="ml-1 inline-flex min-h-11 items-center justify-center rounded-md bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground shadow-card"
          >
            Apply Now
          </a>
        </nav>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-foreground"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              className="lg:hidden fixed inset-0 top-[var(--header-height)] z-40 bg-foreground/20 backdrop-blur-[2px]"
              aria-label="Close menu"
              onClick={closeMenu}
            />
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="lg:hidden fixed inset-x-0 top-[var(--header-height)] z-50 max-h-[calc(100dvh-var(--header-height))] overflow-y-auto border-t border-border bg-background shadow-lg"
              aria-label="Mobile"
            >
              <div className="site-container flex flex-col gap-1 py-4 pb-6">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={closeMenu}
                    className="flex min-h-12 items-center rounded-lg px-3 text-base font-medium text-foreground/85 transition-colors hover:bg-secondary hover:text-primary"
                  >
                    {l.label}
                  </a>
                ))}
                <StaffLoginButton variant="mobile" onNavigate={closeMenu} />
                <div className="mt-2 flex items-center gap-3 border-t border-border px-3 pt-4">
                  <span className="text-sm font-medium text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                <a
                  href="#admissions"
                  onClick={closeMenu}
                  className="mt-2 flex min-h-12 items-center justify-center rounded-md bg-gradient-gold px-5 text-base font-semibold text-gold-foreground"
                >
                  Apply Now
                </a>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
