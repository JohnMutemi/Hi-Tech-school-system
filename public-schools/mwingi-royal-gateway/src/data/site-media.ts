import g01 from "@/assets/gallery/01-playground-seesaw.png";
import g02 from "@/assets/gallery/02-playground-swings.png";
import g03 from "@/assets/gallery/03-students-celebration.png";
import g04 from "@/assets/gallery/04-playground-spinner.png";
import g05 from "@/assets/gallery/05-seesaw-play.png";
import g06 from "@/assets/gallery/06-seesaw-smile.png";
import g07 from "@/assets/gallery/07-climbing-frame.png";
import g08 from "@/assets/gallery/08-playground-fun.png";
import g09 from "@/assets/gallery/09-swings-yard.png";
import g10 from "@/assets/gallery/10-graduation-day.png";
import g11 from "@/assets/gallery/11-climbing-play.png";
import g12 from "@/assets/gallery/12-community-fun.png";

export type GalleryPhoto = {
  src: string;
  alt: string;
  span?: string;
};

const gallerySources = [
  g01,
  g02,
  g03,
  g04,
  g05,
  g06,
  g07,
  g08,
  g09,
  g10,
  g11,
  g12,
] as const;

const featuredSpans: Record<number, string> = {
  0: "md:col-span-2 md:row-span-2",
  2: "md:col-span-2",
  6: "md:col-span-2 md:row-span-2",
  9: "md:col-span-2",
};

export const galleryPhotos: GalleryPhoto[] = gallerySources.map((src, i) => ({
  src,
  alt: `Mwingi Royal Junior Academy — photo ${i + 1}`,
  span: featuredSpans[i],
}));

/** Hero / home marquee — lively campus and community shots */
export const heroSlides = [g03, g12, g02, g07, g10, g04, g01];

/** About page and home strip */
export const aboutBanner = g03;
