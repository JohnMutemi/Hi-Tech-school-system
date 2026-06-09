import { Link } from "@tanstack/react-router";
import { logo } from "@/data/site-media";
import { SCHOOL_EMAIL, SCHOOL_PHONE } from "@/data/contact";

export function SiteFooter() {
  return (
    <footer className="mt-16 sm:mt-20 border-t border-border bg-gradient-footer text-primary-foreground site-footer-pattern">
      <div className="site-container py-12 sm:py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <img
              src={logo}
              alt="Waita Progressive Academy logo"
              className="h-10 w-10 rounded-lg object-contain bg-primary-foreground/10 ring-1 ring-gold/30"
            />
            <div className="font-display text-xl sm:text-2xl">Waita Progressive Academy</div>
          </div>
          <p className="mt-4 text-sm sm:text-base text-primary-foreground/75 max-w-lg">
            Nurturing curious minds in Waita Town since 2013. A conducive environment where character meets excellence.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/admissions" className="site-btn site-btn-primary">
              Apply for Admission
            </Link>
            <Link to="/contact" className="site-btn site-btn-secondary">
              Visit Campus
            </Link>
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-gold mb-3">Visit</div>
          <p className="text-sm text-primary-foreground/80 leading-relaxed">
            Waita Town
            <br />
            20KM off Mwingi–Tseikuru Road
            <br />
            Kitui County, Kenya
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-gold mb-3">Contact</div>
          <p className="text-sm text-primary-foreground/80 leading-relaxed">
            <a href={`mailto:${SCHOOL_EMAIL}`} className="hover:text-gold transition-colors">{SCHOOL_EMAIL}</a>
            <br />
            <a href={`tel:${SCHOOL_PHONE}`} className="hover:text-gold transition-colors">{SCHOOL_PHONE}</a>
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link to="/admissions" className="hover:text-gold">Apply</Link>
            <Link to="/news" className="hover:text-gold">News</Link>
            <Link to="/contact" className="hover:text-gold">Contact</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="site-container py-5 text-xs text-primary-foreground/60 flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Waita Progressive Academy. All rights reserved.</span>
          <span>Est. 2013 · Top performing since inception</span>
        </div>
      </div>
    </footer>
  );
}
