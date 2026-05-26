import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { galleryPhotos } from "@/data/site-media";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Photo Gallery — Waita Progressive Academy" },
      {
        name: "description",
        content:
          "Real moments from classrooms, campus life, outings and community at Waita Progressive Academy.",
      },
      { property: "og:title", content: "Photo Gallery — Waita Progressive Academy" },
      { property: "og:description", content: "Life at Waita in pictures." },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-xs uppercase tracking-widest text-primary font-medium">Gallery</div>
        <h1 className="mt-3 font-display text-5xl md:text-6xl text-balance max-w-3xl">
          Life at Waita, frame by frame.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Authentic glimpses of our learners, staff and campus — not stock imagery, but the people and
          places that make Waita Progressive home.
        </p>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[220px]">
          {galleryPhotos.map((p, i) => (
            <figure key={i} className={`relative overflow-hidden rounded-2xl group ${p.span ?? ""}`}>
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </figure>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
