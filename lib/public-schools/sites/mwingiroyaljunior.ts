import { buildFolderSiteDefinition } from "@/lib/public-schools/build-sections";
import type { TemplateFolderSchoolSiteModule } from "@/lib/public-schools/types";

const campusPlaceholder = "/public-schools/mwingiroyaljunior/placeholder-campus.svg";

export const mwingiRoyalJuniorSite: TemplateFolderSchoolSiteModule = {
  layout: "template",
  definition: buildFolderSiteDefinition(
    {
      routeSlug: "mwingiroyaljunior",
      schoolCode: "mwingiroyaljunior",
      name: "Mwingi Royal Junior Academy",
      websiteTemplateSlug: "classic",
      colorTheme: "#0c4a6e",
      motto: "A centre of excellence for every child",
      principalName: null,
      establishedYear: 2016,
      description:
        "Mwingi Royal Junior Academy nurtures curious minds, confident leaders, and kind hearts through holistic, learner-centred education.",
      address: "8KM off Mwingi–Tseikuru Road, before Kyulungwa Centre Market, Kenya",
      phone: "+254 700 000 000",
      email: "info@mwingiroyal.ac.ke",
    },
    {
      hero: {
        headline: "A centre of excellence for every child.",
        subheadline: "Est. 2016",
        body: "Holistic CBC-aligned learning with caring teachers, engaged parents, and strong co-curricular programmes.",
      },
      about: {
        title: "About Mwingi Royal Junior",
        body: "We combine academic excellence, a caring community, and co-curricular strength to build well-rounded children.",
      },
      programmes: {
        items: [
          { title: "Academic excellence", description: "Rigorous CBC-aligned learning with personal attention." },
          { title: "Caring community", description: "Supportive teachers and engaged parents." },
          { title: "Co-curricular", description: "Sports, arts, music, and clubs for every child." },
        ],
      },
      gallery: {
        images: [{ url: campusPlaceholder, alt: "Mwingi Royal Junior Academy campus" }],
      },
      admissions: {
        body: "Apply for admission or book a campus visit through our admissions team.",
        bullets: ["Complete the admission form", "Provide birth certificate and passport photos", "Schedule a school tour"],
      },
      news: {
        items: [{ title: "Welcome to Mwingi Royal Junior", description: "Visit our dedicated site for campus news and events." }],
      },
      contact: {
        bullets: [
          "8KM off Mwingi–Tseikuru Road, before Kyulungwa Centre Market",
          "+254 700 000 000",
          "info@mwingiroyal.ac.ke · Mon–Fri 8:00am–5:00pm",
        ],
      },
    },
  ),
};
