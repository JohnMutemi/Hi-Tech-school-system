import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
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
      <main>
        <PageHero
          eyebrow="Gallery"
          title="Life at Waita, frame by frame."
          description="Authentic glimpses of our learners, staff, and campus — the people and places that make Waita Progressive home."
        />

        <section className="site-section">
          <div className="site-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[150px] sm:auto-rows-[180px] md:auto-rows-[220px]">
          {galleryPhotos.map((p, i) => (
            <figure key={i} className={`relative overflow-hidden rounded-2xl group site-card ${p.span ?? ""}`}>
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </figure>
          ))}
          </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
