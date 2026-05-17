import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/SiteLayout";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Mwingi Royal Junior Academy" },
      { name: "description", content: "Reach Mwingi Royal Junior Academy. Located 8KM off Mwingi–Tseikuru road, before Kyulungwa centre market." },
      { property: "og:title", content: "Contact — Mwingi Royal Junior Academy" },
      { property: "og:description", content: "Get in touch with our admissions team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Contact"
        title="We'd love to hear from you."
        intro="Reach out with questions about admissions, visits, or anything else."
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2">
        <div className="space-y-6">
          {[
            { icon: MapPin, title: "Location", body: "8KM off Mwingi–Tseikuru Road, before Kyulungwa Centre Market" },
            { icon: Phone, title: "Phone", body: "+254 700 000 000" },
            { icon: Mail, title: "Email", body: "info@mwingiroyal.ac.ke" },
            { icon: Clock, title: "Office Hours", body: "Mon – Fri, 8:00am – 5:00pm" },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-ocean">
                <Icon size={22} />
              </div>
              <div>
                <div className="font-serif text-lg font-bold">{title}</div>
                <div className="text-sm text-muted-foreground">{body}</div>
              </div>
            </div>
          ))}
        </div>

        <form className="rounded-xl border border-border bg-card p-7" onSubmit={(e) => e.preventDefault()}>
          <h3 className="font-serif text-2xl font-bold">Send a message</h3>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <input className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input type="email" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea rows={5} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button className="w-full rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Send Message
            </button>
          </div>
        </form>
      </section>
    </SiteLayout>
  );
}
