import logo from "@/assets/logo.png";
import g01 from "@/assets/gallery/01-community-outing.png";
import g02 from "@/assets/gallery/02-students-building.png";
import g03 from "@/assets/gallery/03-faculty-staff.png";
import g04 from "@/assets/gallery/04-students-staff-group.png";
import g05 from "@/assets/gallery/05-staff-hall.png";
import g06 from "@/assets/gallery/06-classroom-1.png";
import g07 from "@/assets/gallery/07-classroom-2.png";
import g08 from "@/assets/gallery/08-classroom-lesson.png";
import g09 from "@/assets/gallery/09-classroom-jss.png";
import g10 from "@/assets/gallery/10-classroom-wide.png";
import g11 from "@/assets/gallery/11-courtyard-walk.png";
import g12 from "@/assets/gallery/12-school-bus.png";
import g13 from "@/assets/gallery/13-students-yard.png";
import g14 from "@/assets/gallery/14-primary-students.png";
import g15 from "@/assets/gallery/15-grade-8.png";
import g16 from "@/assets/gallery/16-field-trip.png";
import g17 from "@/assets/gallery/17-community-group.png";
import g18 from "@/assets/gallery/18-classroom-3.png";
import g19 from "@/assets/gallery/19-classroom-4.png";
import g20 from "@/assets/gallery/20-students-outdoor.png";
import g21 from "@/assets/gallery/21-campus-life.png";
import g22 from "@/assets/gallery/22-learning.png";
import g23 from "@/assets/gallery/23-students-group.png";
import g24 from "@/assets/gallery/24-school-life.png";
import g25 from "@/assets/gallery/25-campus.png";

export { logo };

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
  g13,
  g14,
  g15,
  g16,
  g17,
  g18,
  g19,
  g20,
  g21,
  g22,
  g23,
  g24,
  g25,
] as const;

const featuredSpans: Record<number, string> = {
  0: "md:col-span-2 md:row-span-2",
  7: "md:col-span-2",
  11: "md:col-span-2",
  16: "md:col-span-2 md:row-span-2",
};

export const galleryPhotos: GalleryPhoto[] = gallerySources.map((src, i) => ({
  src,
  alt: `Waita Progressive Academy — photo ${i + 1}`,
  span: featuredSpans[i],
}));

/** Rotating hero backgrounds — wide, welcoming shots (not the logo). */
export const heroSlides = [g01, g12, g04, g06, g02, g11];

/** About page banner */
export const aboutBanner = g02;
