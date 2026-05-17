import { Link } from "@tanstack/react-router";
import { useState } from "react";
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Lock size={18} className="text-primary" /> Authorized access only
          </AlertDialogTitle>
          <AlertDialogDescription>
            This portal is restricted to Waita Progressive Academy staff. Unauthorized
            access is prohibited and may be monitored. Do you wish to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <a href={getStaffLoginUrl()} rel="noopener noreferrer">Proceed</a>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-md border-2 border-dashed border-muted-foreground/40 bg-muted text-muted-foreground grid place-items-center font-display text-[10px] font-semibold tracking-wider">LOGO</div>
          <div className="leading-tight">
            <div className="font-display font-semibold text-foreground">Waita</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Progressive Academy</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm text-foreground/80 hover:text-primary transition-colors" activeProps={{ className: "text-primary font-medium" }} activeOptions={{ exact: n.to === "/" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <StaffLoginDialog>
            <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Lock size={13} /> Staff Login
            </button>
          </StaffLoginDialog>
          <Link to="/admissions" className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 transition">Apply</Link>
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-6 py-4 flex flex-col gap-3">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="text-foreground/80" onClick={() => setOpen(false)}>{n.label}</Link>
            ))}
            <Link to="/admissions" className="mt-2 inline-flex justify-center rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-medium" onClick={() => setOpen(false)}>Apply</Link>
            <StaffLoginDialog>
              <button className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-2">
                <Lock size={13} /> Staff Login
              </button>
            </StaffLoginDialog>
          </div>
        </div>
      )}
    </header>
  );
}
