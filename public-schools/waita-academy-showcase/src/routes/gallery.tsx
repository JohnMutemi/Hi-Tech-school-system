import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import h1 from "@/assets/hero-1.jpg";
import h2 from "@/assets/hero-2.jpg";
import h3 from "@/assets/hero-3.jpg";
import h4 from "@/assets/hero-4.jpg";
import h5 from "@/assets/hero-5.jpg";
import h6 from "@/assets/hero-6.jpg";

const photos = [
  { src: h1, caption: "Form 2 chemistry, morning session", span: "md:col-span-2 md:row-span-2" },
  { src: h3, caption: "Class of 2024 graduation" },
  { src: h4, caption: "Senior science practical" },
  { src: h2, caption: "Aerial view of the campus", span: "md:col-span-2" },
  { src: h5, caption: "Inter-house football final" },
  { src: h6, caption: "Library, quiet hours" },
];

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Photo Gallery — Waita Progressive Academy" },
      { name: "description", content: "Scenes from classrooms, labs, sports and ceremonies at Waita Progressive Academy." },
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
        <h1 className="mt-3 font-display text-5xl md:text-6xl text-balance max-w-3xl">Life at Waita, frame by frame.</h1>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[220px]">
          {photos.map((p, i) => (
            <figure key={i} className={`relative overflow-hidden rounded-2xl group ${p.span ?? ""}`}>
              <img src={p.src} alt={p.caption} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <figcaption className="absolute inset-x-0 bottom-0 p-4 text-xs text-primary-foreground bg-gradient-to-t from-primary/90 to-transparent opacity-0 group-hover:opacity-100 transition">{p.caption}</figcaption>
            </figure>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
