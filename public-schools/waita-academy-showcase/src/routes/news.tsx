import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
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
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-xs uppercase tracking-widest text-primary font-medium">News & updates</div>
        <h1 className="mt-3 font-display text-5xl md:text-6xl text-balance max-w-3xl">Stories from our corridors and grounds.</h1>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((n) => (
            <Link key={n.slug} to="/news/$slug" params={{ slug: n.slug }} className="group rounded-2xl border border-border bg-card p-6 flex flex-col hover:shadow-lg hover:-translate-y-1 transition">
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
      </main>
      <SiteFooter />
    </>
  );
}
