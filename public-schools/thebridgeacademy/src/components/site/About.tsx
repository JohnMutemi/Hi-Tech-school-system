import { motion } from "framer-motion";
import { Target, Eye, Award, BookOpen, Users, Sparkles } from "lucide-react";
import { SiteContainer, SiteSection, SectionHeader } from "@/components/site/layout";

const achievements = [
  { icon: Award, value: "17+", label: "Years of Excellence" },
  { icon: BookOpen, value: "A−", label: "Mean KCPE Grade" },
  { icon: Users, value: "1,200+", label: "Alumni Worldwide" },
  { icon: Sparkles, value: "30+", label: "National Awards" },
];

export function About() {
  return (
    <SiteSection id="about" className="bg-background">
      <SiteContainer>
        <SectionHeader
          eyebrow="About Us"
          title={
            <>
              A foundation built on <span className="text-gradient-primary">excellence</span>.
            </>
          }
          lead="The Bridge Academy is a high-performing private comprehensive school that has thrived since 2007. We are located near Malioni Centre, Kavingoni Junction, along the Mwingi–Kyuso Road, Kenya."
        />
        <p className="mt-4 max-w-3xl font-display text-lg italic text-primary sm:text-xl">
          A learning Experience with a Difference
        </p>

        <div className="mt-10 grid gap-6 sm:mt-14 sm:gap-8 lg:grid-cols-2">
          {[
            {
              icon: Target,
              title: "Our Mission",
              text: "To nurture confident, disciplined, and academically excellent learners through holistic, Christ-centered education that prepares them for life and leadership.",
            },
            {
              icon: Eye,
              title: "Our Vision",
              text: "To be the leading comprehensive school in the region, recognized for academic distinction, character formation, and innovative learning environments.",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="site-card group relative p-6 pt-10 sm:p-8 sm:pt-12 lg:p-10"
            >
              <div className="absolute -top-4 left-6 grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant sm:-top-5 sm:left-8 sm:h-14 sm:w-14">
                <card.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base">
                {card.text}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-4 lg:grid-cols-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {achievements.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="rounded-xl bg-secondary p-4 text-center transition-colors group-hover:bg-gradient-primary sm:p-6"
            >
              <a.icon className="mx-auto h-6 w-6 text-primary sm:h-7 sm:w-7" />
              <div className="mt-2 font-display text-2xl font-bold sm:mt-3 sm:text-3xl">
                {a.value}
              </div>
              <p className="mt-0.5 text-xs opacity-80 sm:text-sm">{a.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </SiteContainer>
    </SiteSection>
  );
}
