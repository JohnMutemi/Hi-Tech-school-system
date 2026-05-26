import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
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
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-xs uppercase tracking-widest text-primary font-medium">Find us</div>
          <h1 className="mt-3 font-display text-5xl md:text-6xl text-balance max-w-3xl">Waita Town. Easy to find, hard to forget.</h1>

          <div className="mt-12 grid lg:grid-cols-3 gap-6">
            {[
              { Icon: MapPin, t: "Campus", d: "20KM off Mwingi–Tseikuru Road, Waita Town, Kitui County, Kenya" },
              { Icon: Phone, t: "Phone", d: SCHOOL_PHONE },
              { Icon: Mail, t: "Email", d: SCHOOL_EMAIL },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-border bg-card p-6">
                <Icon className="text-primary" />
                <h2 className="mt-4 font-display text-xl">{t}</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="rounded-3xl overflow-hidden border border-border shadow-sm">
            <iframe
              title="Waita Progressive Academy on Google Maps"
              src="https://www.google.com/maps?q=Waita+Town,+Mwingi-Tseikuru+Road,+Kitui+County,+Kenya&output=embed"
              width="100%"
              height="520"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full block"
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
