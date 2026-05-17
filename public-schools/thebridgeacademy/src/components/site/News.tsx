import { motion } from "framer-motion";
import { ArrowUpRight, Calendar } from "lucide-react";
import classroom from "@/assets/g-classroom.jpg";
import sports from "@/assets/g-sports.jpg";
import digitalLearning from "@/assets/g-computer.jpg";
import { SiteContainer, SiteSection, SectionHeader } from "@/components/site/layout";

const articles = [
  {
    title: "School Reopens for Term Two",
    date: "May 5, 2026",
    category: "Announcement",
    excerpt:
      "Welcome back! Term Two officially begins with a packed calendar of academics, sports and clubs.",
    img: classroom,
  },
  {
    title: "Students Excel in Regional Competitions",
    date: "April 22, 2026",
    category: "Achievement",
    excerpt:
      "The Bridge Academy students claimed top honours in regional mathematics, debate and science fairs.",
    img: sports,
  },
  {
    title: "The Bridge Academy Launches Digital Learning Initiative",
    date: "April 10, 2026",
    category: "Innovation",
    excerpt:
      "A new tablet-based learning programme rolls out across upper primary, blending traditional pedagogy with rich interactive content.",
    img: digitalLearning,
  },
];

export function News() {
  return (
    <SiteSection id="news" className="bg-background">
      <SiteContainer>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="News & Updates"
            title="Latest from the school"
            className="max-w-xl"
          />
          <a
            href="#"
            className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-primary sm:text-base"
          >
            View all stories <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {articles.map((a, i) => (
            <motion.article
              key={a.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-24px" }}
              transition={{ delay: i * 0.08 }}
              className="site-card overflow-hidden transition-shadow hover:shadow-elegant"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={a.img}
                  alt={a.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-gradient-gold px-2.5 py-0.5 text-[0.65rem] font-semibold text-gold-foreground sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-xs">
                  {a.category}
                </span>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" /> {a.date}
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-foreground sm:mt-3 sm:text-xl">
                  {a.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</p>
                <a
                  href="#"
                  className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"
                >
                  Read more <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </SiteContainer>
    </SiteSection>
  );
}
