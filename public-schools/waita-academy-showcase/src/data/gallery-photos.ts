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
  caption: string;
  alt: string;
  span?: string;
};

export const galleryPhotos: GalleryPhoto[] = [
  {
    src: g01,
    caption: "Students and staff on a community outing, October 2023",
    alt: "Large group of Waita Progressive students and teachers outdoors on rocky terrain",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    src: g02,
    caption: "Learners gathered in front of the school building",
    alt: "Students and staff posing in front of Waita Progressive school building with security",
  },
  {
    src: g03,
    caption: "Our dedicated teaching and administrative staff",
    alt: "Faculty and staff group portrait at Waita Progressive Academy",
  },
  {
    src: g04,
    caption: "The Waita Progressive school community together",
    alt: "Students and staff group photo in the school courtyard",
    span: "md:col-span-2",
  },
  {
    src: g05,
    caption: "Staff inside the school's main hall",
    alt: "Two staff members in the school hall with wildlife display",
  },
  {
    src: g06,
    caption: "Focused learning in the classroom",
    alt: "Students in light blue uniforms working at desks in a classroom",
  },
  {
    src: g07,
    caption: "A typical lesson in session",
    alt: "Classroom full of students engaged in schoolwork",
  },
  {
    src: g08,
    caption: "Students engaged in their daily lessons",
    alt: "Classroom with chalkboard and students writing in notebooks",
  },
  {
    src: g09,
    caption: "Inside Waita Progressive J.S.S Academy",
    alt: "Classroom at Waita Progressive J.S.S Academy during a lesson",
  },
  {
    src: g10,
    caption: "Collaborative study across the classroom",
    alt: "Wide view of students at wooden desks in a bright classroom",
  },
  {
    src: g11,
    caption: "Moving between classes in the courtyard",
    alt: "Students in uniform walking through the school courtyard",
  },
  {
    src: g12,
    caption: "Proud moments with our school bus",
    alt: "Students posing in front of the Waita Progressive Academy school bus",
    span: "md:col-span-2",
  },
  {
    src: g13,
    caption: "Bright faces of Waita Progressive students",
    alt: "Group of students in uniform standing in the school yard",
  },
  {
    src: g14,
    caption: "Our primary learners together",
    alt: "Primary students in green checkered uniforms posing outdoors",
  },
  {
    src: g15,
    caption: "Grade 8 learners at their classroom block",
    alt: "Students in light blue shirts standing in front of the G8 building",
  },
  {
    src: g16,
    caption: "Educational field trip — exploring beyond the classroom",
    alt: "Primary girls in uniform on a school field trip",
  },
  {
    src: g17,
    caption: "Strength in unity — our wider school family",
    alt: "Large community group photo of students and staff outdoors",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    src: g18,
    caption: "Dedicated learners at work",
    alt: "Students studying at desks in a classroom",
  },
  {
    src: g19,
    caption: "Academic life at Waita Progressive",
    alt: "Classroom scene with students in blue uniforms",
  },
  {
    src: g20,
    caption: "Life on the school grounds",
    alt: "Students outdoors at Waita Progressive Academy",
  },
  {
    src: g21,
    caption: "Campus moments with our learners",
    alt: "Students gathered on the school campus",
  },
  {
    src: g22,
    caption: "Every day is a learning day",
    alt: "Students focused on lessons in the classroom",
  },
  {
    src: g23,
    caption: "Our student body standing together",
    alt: "Group of Waita Progressive students in school uniforms",
  },
  {
    src: g24,
    caption: "School life at Waita Progressive",
    alt: "Students and activities around the academy",
  },
  {
    src: g25,
    caption: "The heart of Waita Town — our academy",
    alt: "Campus view of Waita Progressive Academy",
  },
];

/** Rotating hero backgrounds — wide, representative campus shots */
export const heroSlides = [g04, g12, g01, g06, g11, g13];
