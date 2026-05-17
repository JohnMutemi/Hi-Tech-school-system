import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/SiteLayout";
import { Download, CheckCircle2, FileText, CalendarDays, Phone } from "lucide-react";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Mwingi Royal Junior Academy" },
      { name: "description", content: "Apply to Mwingi Royal Junior Academy. Download the admission form, complete it, and visit our office to enrol your child." },
      { property: "og:title", content: "Admissions — Mwingi Royal Junior Academy" },
      { property: "og:description", content: "Open admissions. Download our admission form today." },
    ],
  }),
  component: Admissions,
});

const steps = [
  { icon: Download, title: "Download the form", body: "Get our printable admission form below." },
  { icon: FileText, title: "Fill in details", body: "Complete all sections in block letters." },
  { icon: CalendarDays, title: "Book a visit", body: "Schedule a tour of our campus and meet our team." },
  { icon: CheckCircle2, title: "Submit & enrol", body: "Return the form to our office with required documents." },
];

function Admissions() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Admissions Open"
        title="Join the Mwingi Royal family."
        intro="We welcome applications all year round. Download the admission form below to begin your child's journey with us."
      />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl border border-border bg-gradient-ocean p-10 text-primary-foreground md:p-14">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-serif text-3xl font-bold md:text-4xl">Admission Form 2026</h2>
              <p className="mt-3 max-w-xl text-primary-foreground/80">
                Download, print, and complete this form. Submit the completed form together with a copy of the pupil's birth certificate and the most recent report card.
              </p>
            </div>
            <a
              href="/downloads/admission-form.pdf"
              download
              className="inline-flex items-center gap-3 rounded-lg bg-mist px-7 py-4 text-base font-semibold text-deep shadow-lg transition hover:opacity-90"
            >
              <Download size={20} /> Download Admission Form
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="font-serif text-3xl font-bold">How to apply</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-ocean">
                <Icon size={20} />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-teal">Step {i + 1}</div>
              <h3 className="mt-1 font-serif text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 rounded-2xl bg-secondary/60 p-10 md:grid-cols-2">
          <div>
            <h3 className="font-serif text-2xl font-bold">Required Documents</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 text-teal" /> Completed admission form</li>
              <li className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 text-teal" /> Copy of pupil's birth certificate</li>
              <li className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 text-teal" /> Most recent academic report</li>
              <li className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 text-teal" /> Two passport-size photos</li>
              <li className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 text-teal" /> Parent/Guardian ID copy</li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold">Need help?</h3>
            <p className="mt-4 text-sm text-muted-foreground">
              Our admissions office is happy to answer any questions and arrange a visit.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-foreground">
              <Phone size={16} className="text-teal" /> +254 700 000 000
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
