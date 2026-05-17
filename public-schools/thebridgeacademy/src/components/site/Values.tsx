import { motion } from "framer-motion";
import { Heart, Lightbulb, ShieldCheck, Handshake, Leaf, Star } from "lucide-react";
import { SiteContainer, SiteSection, SectionHeader } from "@/components/site/layout";

const values = [
  { icon: Heart, title: "Compassion", text: "Empathy and kindness in every interaction." },
  { icon: Lightbulb, title: "Curiosity", text: "A lifelong love of learning and discovery." },
  { icon: ShieldCheck, title: "Integrity", text: "Honesty and accountability in all we do." },
  { icon: Handshake, title: "Respect", text: "Honouring every voice in our community." },
  { icon: Leaf, title: "Growth", text: "Continuous improvement of mind and character." },
  { icon: Star, title: "Excellence", text: "Pursuit of the highest standards in everything." },
];

export function Values() {
  return (
    <SiteSection className="bg-secondary/50">
      <SiteContainer>
        <SectionHeader
          align="center"
          eyebrow="Our Values"
          title="What we stand for"
          lead="Six guiding principles that shape every classroom, corridor, and conversation."
        />

        <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-24px" }}
              transition={{ delay: i * 0.05 }}
              className="site-card p-5 transition-colors hover:border-primary/40 sm:p-6 lg:p-7"
            >
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-foreground sm:mt-5 sm:text-xl">
                {v.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
            </motion.div>
          ))}
        </div>
      </SiteContainer>
    </SiteSection>
  );
}
