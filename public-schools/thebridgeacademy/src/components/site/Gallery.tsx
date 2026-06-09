import { galleryPhotos } from "@/data/site-media";
import { ImageCarousel } from "@/components/ImageCarousel";
import { SiteContainer, SiteSection, SectionHeader } from "@/components/site/layout";

export function Gallery() {
  const slides = galleryPhotos.map((p) => ({
    src: p.src,
    alt: p.alt,
  }));

  return (
    <SiteSection id="gallery" className="site-section-gallery !pb-10 sm:!pb-14">
      <SiteContainer>
        <div className="gallery-header-panel max-w-2xl">
          <SectionHeader
            dark
            eyebrow="Photo Gallery"
            title={
              <>
                Life at <span className="text-gold">The Bridge</span>
              </>
            }
            lead="A glimpse into The Bridge Academy — our campus, classrooms, and learners."
          />
        </div>

        <div className="relative mt-8 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/25 shadow-lg sm:mt-10 sm:aspect-[16/8]">
          <ImageCarousel slides={slides} intervalMs={5000} eager />
        </div>
      </SiteContainer>
    </SiteSection>
  );
}
