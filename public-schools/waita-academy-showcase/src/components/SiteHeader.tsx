import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Lock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getStaffLoginUrl } from "@/lib/staff-login";
import { logo } from "@/data/site-media";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/admissions", label: "Admissions" },
  { to: "/news", label: "News" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

function StaffLoginDialog({ children }: { children: React.ReactNode }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Lock size={18} className="text-primary shrink-0" /> Authorized access only
          </AlertDialogTitle>
          <AlertDialogDescription>
            This portal is restricted to Waita Progressive Academy staff. Unauthorized
            access is prohibited and may be monitored. Do you wish to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
          <AlertDialogAction asChild className="w-full sm:w-auto">
            <a href={getStaffLoginUrl()} rel="noopener noreferrer">
              Proceed
            </a>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <header
      className={cn(
        "site-header sticky top-0 z-50 border-b border-transparent backdrop-blur-md bg-background/85",
        scrolled && "site-header-scrolled"
      )}
    >
      <div className="site-container flex h-full items-center justify-between gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3 group shrink-0">
          <img
            src={logo}
            alt="Waita Progressive Academy logo"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg object-contain bg-background ring-1 ring-border shadow-sm transition group-hover:ring-primary/30"
          />
          <div className="min-w-0 leading-tight">
            <div className="font-display font-semibold text-foreground truncate">Waita</div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-muted-foreground truncate">
              Progressive Academy
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 xl:gap-8" aria-label="Main">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="site-nav-link py-1"
              activeProps={{ "data-status": "active" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <StaffLoginDialog>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 min-h-10 px-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Lock size={13} aria-hidden /> Staff Login
            </button>
          </StaffLoginDialog>
          <Link to="/admissions" className="site-btn site-btn-solid px-5 py-2 min-h-10 text-sm">
            Apply Now
          </Link>
        </div>

        <button
          type="button"
          className="lg:hidden flex items-center justify-center min-h-11 min-w-11 -mr-2 rounded-lg text-foreground hover:bg-muted/60 transition-colors"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 top-[var(--header-height)] z-40 bg-foreground/20 backdrop-blur-[2px]"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "lg:hidden fixed inset-x-0 top-[var(--header-height)] z-50 max-h-[calc(100dvh-var(--header-height))] overflow-y-auto border-t border-border bg-background shadow-lg transition-transform duration-200 ease-out",
          open ? "translate-y-0" : "-translate-y-2 pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
      >
        <nav className="site-container py-5 flex flex-col gap-1" aria-label="Mobile">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex min-h-12 items-center rounded-lg px-3 text-base text-foreground/85 hover:bg-muted/50 hover:text-primary transition-colors"
              activeProps={{ className: "bg-primary/8 text-primary font-medium" }}
              activeOptions={{ exact: n.to === "/" }}
              onClick={() => setOpen(false)}
            >
              {n.label}
            </Link>
          ))}
          <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
            <Link
              to="/admissions"
              className="site-btn site-btn-solid w-full"
              onClick={() => setOpen(false)}
            >
              Apply Now
            </Link>
            <StaffLoginDialog>
              <button
                type="button"
                className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-muted/40 transition-colors"
              >
                <Lock size={14} aria-hidden /> Staff Login
              </button>
            </StaffLoginDialog>
          </div>
        </nav>
      </div>
    </header>
  );
}
