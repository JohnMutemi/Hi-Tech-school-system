import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md border-2 border-dashed border-gold/40 bg-primary-foreground/10 text-gold/70 grid place-items-center font-display text-[10px] font-semibold tracking-wider">LOGO</div>
            <div className="font-display text-xl">Waita Progressive Academy</div>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/70 max-w-md">
            Nurturing curious minds in Waita Town since 2013. A conducive environment where character meets excellence.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-gold mb-3">Visit</div>
          <p className="text-sm text-primary-foreground/80">Waita Town<br/>20KM off Mwingi–Tseikuru Road<br/>Kitui County, Kenya</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-gold mb-3">Contact</div>
          <p className="text-sm text-primary-foreground/80">admissions@waita.ac.ke<br/>+254 700 000 000</p>
          <div className="mt-4 flex gap-4 text-sm">
            <Link to="/admissions" className="hover:text-gold">Apply</Link>
            <Link to="/news" className="hover:text-gold">News</Link>
            <Link to="/contact" className="hover:text-gold">Contact</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto max-w-7xl px-6 py-5 text-xs text-primary-foreground/60 flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Waita Progressive Academy. All rights reserved.</span>
          <span>Est. 2013 · Top performing since inception</span>
        </div>
      </div>
    </footer>
  );
}
