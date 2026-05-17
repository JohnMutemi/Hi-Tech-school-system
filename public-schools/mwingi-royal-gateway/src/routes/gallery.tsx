import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/SiteLayout";
import { ImageCarousel } from "@/components/ImageCarousel";
import classroomImg from "@/assets/gallery-classroom.jpg";
import sportsImg from "@/assets/gallery-sports.jpg";
import libraryImg from "@/assets/gallery-library.jpg";
import scienceImg from "@/assets/gallery-science.jpg";
import assemblyImg from "@/assets/gallery-assembly.jpg";
import campusImg from "@/assets/gallery-campus.jpg";
import cultureImg from "@/assets/gallery-culture.jpg";
import diningImg from "@/assets/gallery-dining.jpg";
import musicImg from "@/assets/gallery-music.jpg";
import computerImg from "@/assets/gallery-computer.jpg";
import environmentImg from "@/assets/gallery-environment.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Photo Gallery — Mwingi Royal Junior Academy" },
      { name: "description", content: "Moments from learning, sports, culture, and life at Mwingi Royal Junior Academy." },
      { property: "og:title", content: "Gallery — Mwingi Royal Junior Academy" },
      { property: "og:description", content: "A look inside our school." },
    ],
  }),
  component: Gallery,
});

const photos = [
  { src: classroomImg, caption: "In the classroom" },
  { src: sportsImg, caption: "On the field" },
  { src: libraryImg, caption: "Library time" },
  { src: scienceImg, caption: "Science lab" },
  { src: assemblyImg, caption: "Morning assembly" },
  { src: campusImg, caption: "Our campus" },
  { src: cultureImg, caption: "Cultural day" },
  { src: diningImg, caption: "Lunch time" },
  { src: musicImg, caption: "Music & cultural performance" },
  { src: computerImg, caption: "Computer studies" },
  { src: environmentImg, caption: "Environment club" },
];

function Gallery() {
  const slides = photos.map((p) => ({ src: p.src, alt: p.caption, caption: p.caption }));
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Photo Gallery"
        title="Life at Mwingi Royal."
        intro="Glimpses of learning, play, and community from across the academy."
      />

      {/* Auto-rotating marquee — one image every 5s */}
      <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-6 sm:pt-14">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-card shadow-lg sm:aspect-[16/8]">
          <ImageCarousel slides={slides} intervalMs={5000} showCaption />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-16">
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <figure key={p.caption} className="group overflow-hidden rounded-xl bg-card shadow-sm">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={p.src} alt={p.caption} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <figcaption className="px-3 py-2 text-xs font-medium text-foreground sm:px-4 sm:py-3 sm:text-sm">{p.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
