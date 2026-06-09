import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { SiteContainer, SiteSection, SectionHeader } from "@/components/site/layout";

const items = [
  {
    name: "Mrs. Wanjiru Kamau",
    role: "Parent · Class of 2024",
    text: "The Bridge Academy didn't just teach my daughter — they shaped her into a confident, articulate young woman. The teachers truly know each child.",
  },
  {
    name: "Daniel Mutua",
    role: "Alumnus · Now at University of Nairobi",
    text: "The discipline, the values, the mentorship — everything I learned at The Bridge Academy still guides me today.",
  },
  {
    name: "Mr. Patrick Ouma",
    role: "Parent · Two children enrolled",
    text: "What stands out is the genuine care. From the bus driver to the head teacher, everyone treats our children like family.",
  },
];

export function Testimonials() {
  return (
    <SiteSection className="bg-background">
      <SiteContainer>
        <SectionHeader
          eyebrow="Testimonials"
          title={
            <>
              Voices from our <span className="text-gradient-primary">community</span>
            </>
          }
          lead="Parents and alumni share what The Bridge means to them."
        />

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="site-card p-5 sm:p-6 lg:p-8"
            >
              <Quote className="h-7 w-7 text-gold/60 sm:h-8 sm:w-8" />
              <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:mt-4 sm:text-base">
                {t.text}
              </p>
              <footer className="mt-5 border-t border-border pt-4 sm:mt-6 sm:pt-6">
                <div className="font-semibold text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground sm:text-sm">{t.role}</div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </SiteContainer>
    </SiteSection>
  );
}
