import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { Mail, Phone, MapPin } from "lucide-react";
import { SCHOOL_EMAIL, SCHOOL_PHONE } from "@/data/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Map — Waita Progressive Academy" },
      { name: "description", content: "Find us in Waita Town. Contact the admissions office, school administration or visit our campus." },
      { property: "og:title", content: "Contact Waita Progressive Academy" },
      { property: "og:description", content: "Phone, email and map directions to our campus." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="Find us"
          title="Waita Town. Easy to find, hard to forget."
          description="Call, email, or visit us in person. Our admissions and administration teams are available during school hours."
        />

        <section className="site-section">
          <div className="site-container">
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              { Icon: MapPin, t: "Campus", d: "20KM off Mwingi–Tseikuru Road, Waita Town, Kitui County, Kenya" },
              { Icon: Phone, t: "Phone", d: SCHOOL_PHONE },
              { Icon: Mail, t: "Email", d: SCHOOL_EMAIL },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="site-card site-card-interactive p-6">
                <Icon className="text-primary" />
                <h2 className="mt-4 font-display text-xl">{t}</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-20">
          <div className="site-container">
          <div className="rounded-3xl overflow-hidden border border-border shadow-card">
            <iframe
              title="Waita Progressive Academy on Google Maps"
              src="https://www.google.com/maps?q=Waita+Town,+Mwingi-Tseikuru+Road,+Kitui+County,+Kenya&output=embed"
              width="100%"
              height="500"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full block"
            />
          </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
