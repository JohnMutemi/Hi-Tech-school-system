import { buildFolderSiteDefinition } from "@/lib/public-schools/build-sections";
import type { TemplateFolderSchoolSiteModule } from "@/lib/public-schools/types";

const ASSET_BASE = "/public-schools/waitaprogressive";
const logo = `${ASSET_BASE}/logo.png`;

const galleryFiles = [
  "01-community-outing.png",
  "02-students-building.png",
  "03-faculty-staff.png",
  "04-students-staff-group.png",
  "05-staff-hall.png",
  "06-classroom-1.png",
  "07-classroom-2.png",
  "08-classroom-lesson.png",
  "09-classroom-jss.png",
  "10-classroom-wide.png",
  "11-courtyard-walk.png",
  "12-school-bus.png",
  "13-students-yard.png",
  "14-primary-students.png",
  "15-grade-8.png",
  "16-field-trip.png",
  "17-community-group.png",
  "18-classroom-3.png",
  "19-classroom-4.png",
  "20-students-outdoor.png",
  "21-campus-life.png",
  "22-learning.png",
  "23-students-group.png",
  "24-school-life.png",
  "25-campus.png",
] as const;

const SCHOOL_PHONE = "0724447748";
const SCHOOL_EMAIL = "waitaprogressive@gmail.com";

export const waitaProgressiveSite: TemplateFolderSchoolSiteModule = {
  layout: "template",
  definition: buildFolderSiteDefinition(
    {
      routeSlug: "waitaprogressive",
      schoolCode: "waitaprogressive",
      name: "Waita Progressive Academy",
      websiteTemplateSlug: "modern",
      colorTheme: "#1e3a5f",
      logo,
      motto: "Humility and Hardwork Brings Success",
      principalName: null,
      establishedYear: 2013,
      description:
        "Waita Progressive Academy has been the top-performing school in our region for over a decade — a conducive, disciplined environment for young minds to flourish.",
      address: "20KM off Mwingi–Tseikuru Road, Waita Town, Kitui County, Kenya",
      phone: SCHOOL_PHONE,
      email: SCHOOL_EMAIL,
    },
    {
      hero: {
        headline: "A school where excellence meets character.",
        subheadline: "Est. 2013 · Waita Town",
        body: "We offer rigorous academics, character formation, and co-curricular life rooted in our community.",
      },
      about: {
        title: "About Waita Progressive",
        body: "Four pillars carry every Waita scholar: academic rigor, character first, co-curricular life, and family & community partnership.",
      },
      programmes: {
        items: [
          { title: "CBC Primary", description: "Competency-based curriculum with personal mentorship." },
          { title: "Character & discipline", description: "Empathy, service, and integrity in daily school life." },
          { title: "Co-curricular", description: "Music, drama, debate, and sports for every learner." },
        ],
      },
      gallery: {
        images: galleryFiles.map((file, i) => ({
          url: `${ASSET_BASE}/gallery/${file}`,
          alt: `Waita Progressive Academy — photo ${i + 1}`,
        })),
      },
      admissions: {
        body: "Admissions are open for new learners. Contact our office for forms, fees, and visit dates.",
        bullets: ["Download or collect admission forms", "Submit required documents", "Attend an orientation visit"],
      },
      news: {
        items: [{ title: "Welcome to Waita Progressive", description: "Visit our dedicated site for news and events." }],
      },
      contact: {
        bullets: [
          "20KM off Mwingi–Tseikuru Road, Waita Town, Kitui County",
          SCHOOL_PHONE,
          SCHOOL_EMAIL,
        ],
      },
    },
  ),
};
