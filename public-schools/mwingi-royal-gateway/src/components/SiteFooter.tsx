import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail } from "lucide-react";
import { StaffLoginButton } from "@/components/StaffLoginButton";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-primary text-primary-foreground sm:mt-24">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:gap-10 sm:px-6 sm:py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-serif text-2xl font-bold">Mwingi Royal Junior Academy</div>
          <p className="mt-3 max-w-md text-sm text-primary-foreground/75">
            A centre of excellence nurturing curious minds and confident leaders since 2016.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-wider">Explore</div>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/admissions" className="hover:text-white">Admissions</Link></li>
            <li><Link to="/news" className="hover:text-white">News</Link></li>
            <li><Link to="/gallery" className="hover:text-white">Gallery</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-wider">Visit</div>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0" />8KM off Mwingi–Tseikuru Rd, before Kyulungwa Centre</li>
            <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0" />+254 700 000 000</li>
            <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0" />info@mwingiroyal.ac.ke</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-5 py-5 text-xs text-primary-foreground/60 sm:flex-row sm:items-center sm:px-6">
          <div>© {new Date().getFullYear()} Mwingi Royal Junior Academy. All rights reserved.</div>
          <StaffLoginButton variant="footer" />
        </div>
      </div>
    </footer>
  );
}
