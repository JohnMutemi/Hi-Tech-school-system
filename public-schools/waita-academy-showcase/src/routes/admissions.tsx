import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
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
        <PageHero
          eyebrow="Admissions 2027"
          title="Begin your child's Waita journey."
          description="Form 1 applications and a limited number of transfer placements are open. Download the official admission form below, complete it, and return it to our admissions office."
        />

        <section className="site-section">
          <div className="site-container grid lg:grid-cols-12 gap-8 sm:gap-12">
          <aside className="lg:col-span-4 space-y-8">
            <div>
              <h2 className="font-display text-2xl text-foreground">Key dates</h2>
              <ul className="mt-4 space-y-3 text-sm site-card p-5 sm:p-6">
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
            <div className="site-card p-6 sm:p-8 md:p-10">
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
                className="mt-8 site-btn site-btn-solid"
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
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
