import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo-bridge.png";
import { StaffLoginButton } from "@/components/site/StaffLoginButton";
import { ThemeToggle } from "@/components/site/ThemeToggle";

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
    const onScroll = () => setScrolled(window.scrollY > 24);
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
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="site-container flex min-h-[3.5rem] items-center justify-between gap-3 py-2 sm:min-h-[4rem] sm:py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3" onClick={closeMenu}>
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg sm:h-11 sm:w-11 ${
              scrolled || open ? "bg-secondary" : "bg-white/95 backdrop-blur"
            }`}
          >
            <img src={logo} alt="The Bridge Academy logo" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
          </span>
          <span
            className={`font-display text-base font-bold leading-tight sm:text-lg ${
              scrolled || open ? "text-foreground" : "text-white"
            }`}
          >
            The Bridge <span className="text-gold">Academy</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`min-h-11 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                scrolled
                  ? "text-foreground/80 hover:text-primary hover:bg-secondary"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
            >
              {l.label}
            </a>
          ))}
          <StaffLoginButton scrolled={scrolled} />
          <ThemeToggle overHero={!scrolled} className="ml-0.5" />
          <a
            href="#admissions"
            className="ml-1 inline-flex min-h-11 items-center justify-center rounded-md bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground shadow-card"
          >
            Apply Now
          </a>
        </nav>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle overHero={!scrolled && !open} />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${
              scrolled || open ? "text-foreground" : "text-white"
            }`}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-background overflow-hidden"
            aria-label="Mobile"
          >
            <div className="site-container flex max-h-[min(70vh,28rem)] flex-col gap-1 overflow-y-auto py-3 pb-6">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={closeMenu}
                  className="min-h-12 flex items-center rounded-lg px-4 text-base font-medium text-foreground/85 active:bg-secondary"
                >
                  {l.label}
                </a>
              ))}
              <StaffLoginButton variant="mobile" onNavigate={closeMenu} />
              <div className="mt-2 flex items-center gap-3 px-4">
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
        )}
      </AnimatePresence>
    </header>
  );
}
