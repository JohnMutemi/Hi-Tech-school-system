import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Check, Download } from "lucide-react";
import { SCHOOL_EMAIL } from "@/data/contact";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Waita Progressive Academy" },
      { name: "description", content: "Download the Waita Progressive Academy admission form. Form 1 intake and select transfer slots are open for 2027." },
      { property: "og:title", content: "Admissions at Waita Progressive Academy" },
      { property: "og:description", content: "Download the admission form to begin your child's Waita journey." },
    ],
  }),
  component: Admissions,
});

function Admissions() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-primary text-primary-foreground py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-xs uppercase tracking-widest text-gold">Admissions 2027</div>
            <h1 className="mt-3 font-display text-5xl md:text-7xl text-balance max-w-3xl">Begin your child's Waita journey.</h1>
            <p className="mt-6 text-primary-foreground/80 max-w-2xl text-lg">Form 1 applications and a limited number of transfer placements are open. Download the official admission form below, complete it and return it to our admissions office.</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-12 gap-12">
          <aside className="lg:col-span-4 space-y-8">
            <div>
              <h2 className="font-display text-2xl text-foreground">Key dates</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Applications open</span><span className="font-medium">Jan 15, 2026</span></li>
                <li className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Entrance assessment</span><span className="font-medium">Aug 8, 2026</span></li>
                <li className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">Offer letters</span><span className="font-medium">Oct 1, 2026</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Term begins</span><span className="font-medium">Jan 4, 2027</span></li>
              </ul>
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">What we look for</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {["Curiosity and a love for learning", "Strong character references", "Solid KCPE / Grade 6 results", "Commitment to community"].map((p) => (
                  <li key={p} className="flex gap-2"><Check size={16} className="text-gold mt-0.5 shrink-0" /> {p}</li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-border bg-card p-8 md:p-10">
              <h2 className="font-display text-3xl">Download the admission form</h2>
              <p className="mt-3 text-muted-foreground max-w-xl">
                Print, complete in block letters, and submit to the admissions office in person or via email to{" "}
                <a href={`mailto:${SCHOOL_EMAIL}`} className="text-foreground font-medium hover:text-primary">
                  {SCHOOL_EMAIL}
                </a>
                .
              </p>

              <a
                href="/downloads/waita-admission-form.pdf"
                download
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3 text-sm font-semibold hover:bg-primary/90 transition"
              >
                <Download size={18} /> Download admission form (PDF)
              </a>

              <div className="mt-10 grid sm:grid-cols-2 gap-6 text-sm">
                <div className="rounded-xl border border-border p-5">
                  <div className="text-xs uppercase tracking-widest text-gold">Submit in person</div>
                  <p className="mt-2 text-foreground">Admissions Office, Waita Progressive Academy</p>
                  <p className="text-muted-foreground">20KM off Mwingi–Tseikuru Road, Waita Town</p>
                </div>
                <div className="rounded-xl border border-border p-5">
                  <div className="text-xs uppercase tracking-widest text-gold">Submit by email</div>
                  <p className="mt-2 text-foreground">
                    <a href={`mailto:${SCHOOL_EMAIL}`} className="hover:text-primary">{SCHOOL_EMAIL}</a>
                  </p>
                  <p className="text-muted-foreground">Include scanned copies of school reports.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
