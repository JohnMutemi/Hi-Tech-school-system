import hero from "@/assets/hero.jpg";
import classroom from "@/assets/g-classroom.jpg";
import bus from "@/assets/g-bus.jpg";
import lab from "@/assets/g-lab.jpg";
import pupils from "@/assets/g-pupils.jpg";
import computer from "@/assets/g-computer.jpg";
import sports from "@/assets/g-sports.jpg";
import { ImageCarousel } from "@/components/ImageCarousel";
import { SiteContainer, SiteSection, SectionHeader } from "@/components/site/layout";

const galleryPhotos = [
  { src: hero, alt: "Campus welcome", caption: "Campus welcome" },
  { src: classroom, alt: "Students in class", caption: "Students in class" },
  { src: lab, alt: "Science laboratory", caption: "Science laboratory" },
  { src: pupils, alt: "Pupils in uniform", caption: "Pupils in uniform" },
  { src: computer, alt: "Computer lab", caption: "Computer lab" },
  { src: sports, alt: "Sports activities", caption: "Sports activities" },
  { src: bus, alt: "School bus", caption: "School bus" },
];

export function Gallery() {
  const slides = galleryPhotos.map((p) => ({
    src: p.src,
    alt: p.alt,
    caption: p.caption,
  }));

  return (
    <SiteSection
      id="gallery"
      className="!pb-10 sm:!pb-14"
      style={{ backgroundColor: "var(--gallery-surface)" }}
    >
      <SiteContainer>
        <div className="gallery-header-panel max-w-2xl">
          <SectionHeader
            dark
            eyebrow="Photo Gallery"
            title="Life at The Bridge"
            lead="A glimpse into the Bridge Academy"
          />
        </div>

        <div className="relative mt-8 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-black/25 shadow-lg sm:mt-10 sm:aspect-[16/8]">
          <ImageCarousel slides={slides} intervalMs={5000} showCaption />
        </div>
      </SiteContainer>
    </SiteSection>
  );
}
