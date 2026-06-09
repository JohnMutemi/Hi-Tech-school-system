import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { news } from "@/data/news";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News — Waita Progressive Academy" },
      { name: "description", content: "Latest news, achievements and updates from Waita Progressive Academy." },
      { property: "og:title", content: "News from Waita Progressive Academy" },
      { property: "og:description", content: "Achievements, events and announcements." },
    ],
  }),
  component: NewsIndex,
});

function NewsIndex() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="News & updates"
          title="Stories from our corridors and grounds."
          description="Academic achievements, school events, and announcements from the Waita community."
        />

        <section className="site-section">
          <div className="site-container">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {news.map((n) => (
                <Link key={n.slug} to="/news/$slug" params={{ slug: n.slug }} className="group site-card site-card-interactive p-6 flex flex-col">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="uppercase tracking-widest text-gold-foreground bg-gold/30 px-2 py-1 rounded">{n.category}</span>
                    <span className="text-muted-foreground">{new Date(n.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <h2 className="mt-4 font-display text-2xl leading-snug group-hover:text-primary transition-colors">{n.title}</h2>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{n.excerpt}</p>
                  <span className="mt-6 text-sm font-medium text-primary">Read story →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
