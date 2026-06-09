import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { news } from "@/data/news";

export const Route = createFileRoute("/news/$slug")({
  loader: ({ params }) => {
    const item = news.find((n) => n.slug === params.slug);
    if (!item) throw notFound();
    return item;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Waita News` },
          { name: "description", content: loaderData.excerpt },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.excerpt },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <>
      <SiteHeader />
      <main className="site-section">
        <div className="site-container max-w-3xl text-center">
          <h1 className="font-display text-4xl">Story not found</h1>
          <Link to="/news" className="mt-6 inline-block text-primary">← Back to news</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  ),
  errorComponent: ({ error }) => (
    <>
      <SiteHeader />
      <main className="site-section">
        <div className="site-container max-w-3xl text-center">
          <h1 className="font-display text-3xl">Something went wrong</h1>
          <p className="mt-3 text-muted-foreground">{error.message}</p>
        </div>
      </main>
      <SiteFooter />
    </>
  ),
  component: NewsPost,
});

function NewsPost() {
  const item = Route.useLoaderData();
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow={item.category}
          title={item.title}
          description={item.excerpt}
        />
        <section className="site-section pt-8 sm:pt-10">
          <div className="site-container max-w-3xl">
            <Link to="/news" className="text-sm text-primary">← All news</Link>
            <div className="mt-5 flex items-center gap-3 text-xs">
              <span className="uppercase tracking-widest text-gold-foreground bg-gold/30 px-2 py-1 rounded">{item.category}</span>
              <span className="text-muted-foreground">{new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <article className="site-card p-6 sm:p-8 mt-5">
              <p className="text-lg text-foreground/90 leading-relaxed">{item.excerpt}</p>
              <p className="mt-5 text-muted-foreground leading-relaxed">{item.body}</p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
