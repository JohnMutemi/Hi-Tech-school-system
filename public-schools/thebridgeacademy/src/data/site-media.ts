import logo from "@/assets/logo-bridge.png";
import g01 from "@/assets/gallery/01-campus-grounds.png";
import g02 from "@/assets/gallery/02-campus-overview.png";
import g03 from "@/assets/gallery/03-tuition-block.png";
import g04 from "@/assets/gallery/04-campus-gate.png";
import g05 from "@/assets/gallery/05-courtyard.png";
import g06 from "@/assets/gallery/06-students-uniforms.png";
import g07 from "@/assets/gallery/07-campus-hillview.png";
import g08 from "@/assets/gallery/08-welcome-entrance.png";
import g09 from "@/assets/gallery/09-courtyard-students.png";
import g10 from "@/assets/gallery/10-classroom-block.png";
import g11 from "@/assets/gallery/11-classroom-yard.png";
import g12 from "@/assets/gallery/12-campus-life.png";

export { logo };

export type GalleryPhoto = {
  src: string;
  alt: string;
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

export const galleryPhotos: GalleryPhoto[] = gallerySources.map((src, i) => ({
  src,
  alt: `The Bridge Academy — photo ${i + 1}`,
}));

/** Rotating hero backgrounds — wide campus and entrance shots. */
export const heroSlides = [g08, g04, g07, g03, g05, g01, g09];
