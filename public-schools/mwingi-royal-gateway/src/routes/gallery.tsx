import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/SiteLayout";
import { ImageCarousel } from "@/components/ImageCarousel";
import { galleryPhotos } from "@/data/site-media";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Photo Gallery — Mwingi Royal Junior Academy" },
      {
        name: "description",
        content:
          "Moments from learning, play, and community at Mwingi Royal Junior Academy.",
      },
      { property: "og:title", content: "Gallery — Mwingi Royal Junior Academy" },
      { property: "og:description", content: "Life at Mwingi Royal in pictures." },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const slides = galleryPhotos.map((p) => ({
    src: p.src,
    alt: p.alt,
  }));

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Photo Gallery"
        title={
          <>
            Life at <span className="text-teal">Mwingi Royal</span>
          </>
        }
        intro="Glimpses of play, celebration, and community from across the academy."
      />

      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-6 sm:pt-14">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-card shadow-lg sm:aspect-[16/8]">
          <ImageCarousel slides={slides} intervalMs={5000} eager />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-16">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 auto-rows-[150px] sm:auto-rows-[180px] md:auto-rows-[220px]">
          {galleryPhotos.map((p, i) => (
            <figure
              key={i}
              className={`relative overflow-hidden rounded-2xl group bg-card shadow-sm ${p.span ?? ""}`}
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </figure>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
