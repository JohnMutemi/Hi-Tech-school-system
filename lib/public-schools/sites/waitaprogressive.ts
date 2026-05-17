import { buildFolderSiteDefinition } from "@/lib/public-schools/build-sections";
import type { TemplateFolderSchoolSiteModule } from "@/lib/public-schools/types";

const campusPlaceholder = "/public-schools/waitaprogressive/placeholder-campus.svg";

export const waitaProgressiveSite: TemplateFolderSchoolSiteModule = {
  layout: "template",
  definition: buildFolderSiteDefinition(
    {
      routeSlug: "waitaprogressive",
      schoolCode: "waitaprogressive",
      name: "Waita Progressive Academy",
      websiteTemplateSlug: "modern",
      colorTheme: "#1e3a5f",
      motto: "Humility and Hardwork Brings Success",
      principalName: null,
      establishedYear: 2013,
      description:
        "Waita Progressive Academy has been the top-performing school in our region for over a decade — a conducive, disciplined environment for young minds to flourish.",
      address: "20KM off Mwingi–Tseikuru Road, Waita Town, Kitui County, Kenya",
      phone: "+254 700 000 000",
      email: "info@waita.ac.ke",
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
        images: [{ url: campusPlaceholder, alt: "Waita Progressive Academy campus" }],
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
          "+254 700 000 000 / +254 711 000 000",
          "info@waita.ac.ke · admissions@waita.ac.ke",
        ],
      },
    },
  ),
};
