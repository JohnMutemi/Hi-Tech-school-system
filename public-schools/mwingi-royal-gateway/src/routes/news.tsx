import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/SiteLayout";
import cultureImg from "@/assets/gallery-culture.jpg";
import sportsImg from "@/assets/gallery-sports.jpg";
import scienceImg from "@/assets/gallery-science.jpg";
import assemblyImg from "@/assets/gallery-assembly.jpg";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News & Events — Mwingi Royal Junior Academy" },
      { name: "description", content: "Latest news, events, and announcements from Mwingi Royal Junior Academy." },
      { property: "og:title", content: "News — Mwingi Royal Junior Academy" },
      { property: "og:description", content: "Updates from our school community." },
    ],
  }),
  component: News,
});

const posts = [
  { img: cultureImg, tag: "Culture", date: "April 22, 2026", title: "Cultural Day celebrations light up the campus", excerpt: "Our pupils dazzled parents and guests with traditional dances, songs, and colourful costumes during this year's cultural day." },
  { img: sportsImg, tag: "Sports", date: "March 14, 2026", title: "Royal Lions clinch the inter-school football trophy", excerpt: "After a hard-fought tournament, our boys' team brought home the regional cup for the second year running." },
  { img: scienceImg, tag: "Academics", date: "February 9, 2026", title: "Young Scientists Fair showcases pupil innovation", excerpt: "From simple machines to water filters, our learners impressed judges with hands-on, problem-solving projects." },
  { img: assemblyImg, tag: "School Life", date: "January 13, 2026", title: "Welcoming the 2026 academic year", excerpt: "We opened the year with a heartfelt assembly, celebrating new pupils and setting our intentions for the term ahead." },
];

function News() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="News & Events"
        title="What's happening at the academy."
        intro="Stay up to date with the latest stories, achievements, and announcements from our community."
      />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {posts.map((p) => (
            <article key={p.title} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-xl">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={p.img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-full bg-secondary px-3 py-1 font-semibold uppercase tracking-wider text-ocean">{p.tag}</span>
                  <span className="text-muted-foreground">{p.date}</span>
                </div>
                <h3 className="mt-3 font-serif text-xl font-bold leading-snug">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
