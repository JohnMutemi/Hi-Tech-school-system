import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { SiteContainer } from "@/components/site/layout";
import { logo } from "@/data/site-media";
import { mailtoUrl, SCHOOL_EMAIL, SCHOOL_PHONE_DISPLAY, telUrl } from "@/lib/contact";

const exploreLinks = [
  ["About", "#about"],
  ["Admissions", "#admissions"],
  ["News", "#news"],
  ["Gallery", "#gallery"],
  ["Contact", "#contact"],
] as const;

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <SiteContainer className="py-12 sm:py-14 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <img
                src={logo}
                alt="The Bridge Academy logo"
                className="h-10 w-10 rounded-lg object-contain bg-primary-foreground/10 ring-1 ring-gold/30 sm:h-11 sm:w-11"
              />
              <span className="font-display text-lg font-bold leading-tight sm:text-xl">
                The Bridge <span className="text-gold">Academy</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">
              A high-performing private comprehensive school nurturing excellence, character, and
              curiosity since 2007.
            </p>
            <p className="mt-3 font-display text-sm italic text-gold/90">
              A learning Experience with a Difference
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-gold">
              Explore
            </h4>
            <ul className="mt-4 space-y-2">
              {exploreLinks.map(([label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    className="inline-flex min-h-10 items-center text-sm text-white/80 transition hover:text-gold"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-gold">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>Near Malioni Centre, Kavingoni Junction, Mwingi–Kyuso Road, Kenya</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a href={telUrl()} className="hover:text-gold">
                  {SCHOOL_PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a href={mailtoUrl()} className="hover:text-gold break-all">
                  {SCHOOL_EMAIL}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-gold">
              Follow Us
            </h4>
            <div className="mt-4 flex gap-2">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="grid h-11 w-11 place-items-center rounded-lg bg-white/10 transition hover:bg-gradient-gold hover:text-gold-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 text-center text-xs text-white/60 sm:mt-12 sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} The Bridge Academy. All rights reserved.</p>
          <p>Designed with care for our learners and their families.</p>
        </div>
      </SiteContainer>
    </footer>
  );
}
