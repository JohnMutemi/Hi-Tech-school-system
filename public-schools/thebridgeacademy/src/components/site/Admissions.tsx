import { motion } from "framer-motion";
import { Download, FileText, CheckCircle2 } from "lucide-react";
import { SiteContainer, SiteButton, SiteSection } from "@/components/site/layout";

const points = [
  "Open intake for Grade 1 to Form 4",
  "Boarding & day-scholar options",
  "Generous scholarship programme",
  "Personalised learning plans",
];

export function Admissions() {
  return (
    <SiteSection id="admissions" className="relative overflow-hidden !py-0">
      <div className="absolute inset-0 bg-gradient-primary" aria-hidden />
      <div
        className="absolute inset-0 opacity-20"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 10%, oklch(0.82 0.14 85 / 0.5), transparent 50%), radial-gradient(circle at 0% 100%, oklch(0.55 0.16 254 / 0.6), transparent 50%)",
        }}
      />
      <SiteContainer className="relative site-section">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary-foreground"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/20 px-3 py-1 text-xs font-medium text-gold sm:px-4 sm:py-1.5 sm:text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              Admissions Ongoing
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:mt-5 sm:text-4xl lg:text-5xl">
              Your child&apos;s bright <span className="text-gold">future</span> starts here.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/85 sm:mt-5 sm:text-lg">
              Join a community where every learner is known, challenged, and championed. Download
              the admission form to begin your journey with The Bridge Academy.
            </p>

            <ul className="mt-6 space-y-2.5 sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-white/90 sm:text-base">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
              <SiteButton href="/admission-form.pdf" download variant="primary">
                <Download className="h-5 w-5" /> Download Admission Form
              </SiteButton>
              <SiteButton href="#contact" variant="secondary">
                Speak to Admissions
              </SiteButton>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="site-card border-white/20 bg-white/10 p-6 backdrop-blur sm:p-8">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-gold text-gold-foreground sm:h-14 sm:w-14">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white sm:text-xl">
                    Admission Form 2026
                  </h3>
                  <p className="mt-1 text-sm text-white/70">PDF · 1.2 MB · 2 pages</p>
                </div>
              </div>
              <ol className="mt-6 space-y-3 text-sm text-white/85">
                {[
                  "Complete the form digitally or by hand",
                  "Attach copies of birth certificate & report",
                  "Submit at the school office or via email",
                  "Sit a short placement assessment",
                ].map((step, i) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/20 text-xs font-semibold text-gold">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        </div>
      </SiteContainer>
    </SiteSection>
  );
}
