import type { SectionContent, WebsiteSectionKey, WebsiteTemplateSlug } from "./types";
import type { WebsiteSectionSeedOptions } from "./website-section-seed-options";

export type DefaultSectionSeed = {
  sectionKey: WebsiteSectionKey;
  title: string;
  sortOrder: number;
  content: SectionContent;
};

function trimDesc(text: string, max = 480): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function baseSections(
  schoolName: string,
  motto: string,
  principal: string,
  opts?: WebsiteSectionSeedOptions
): DefaultSectionSeed[] {
  const desc = opts?.description?.trim();
  const addr = opts?.address?.trim();
  const year = opts?.establishedYear;
  const yearBit =
    year && !Number.isNaN(year) ? ` Established ${year}.` : "";
  const locBit = addr ? ` We are located at ${trimDesc(addr, 160)}.` : "";

  const heroBody = desc
    ? trimDesc(desc, 320)
    : `Discover a learning community dedicated to academic achievement, character, and opportunity for every learner.${yearBit}${locBit}`;

  const aboutBody = desc
    ? `${trimDesc(desc, 520)} Our leadership works closely with ${principal}, staff, and families to support every learner.${locBit}`
    : `${schoolName} provides quality education through dedicated teaching, strong values, and a supportive environment. Our leadership team, led by ${principal}, works with staff and families to help every student succeed.${locBit}${yearBit}`;

  return [
    {
      sectionKey: "hero",
      title: "Welcome",
      sortOrder: 0,
      content: {
        headline: `Welcome to ${schoolName}`,
        subheadline: motto || "Committed to excellence in education",
        body: heroBody,
        ctaLabel: "Apply for Admission",
        ctaHref: "#admissions",
      },
    },
    {
      sectionKey: "about",
      title: "About Us",
      sortOrder: 1,
      content: {
        headline: `About ${schoolName}`,
        body: aboutBody,
        bullets: [
          "Holistic learner development",
          "Qualified and caring educators",
          "Safe, inclusive campus culture",
          "Partnership with parents and community",
        ],
      },
    },
    {
      sectionKey: "programmes",
      title: "Programmes",
      sortOrder: 2,
      content: {
        headline: "Academic Programmes",
        body: "We offer programmes designed to prepare learners for higher education, careers, and responsible citizenship.",
        items: [
          { title: "Early Years", description: "Foundational literacy, numeracy, and social skills." },
          { title: "Primary", description: "Core subjects with enrichment in arts and sciences." },
          { title: "Secondary", description: "Exam preparation and career guidance pathways." },
          { title: "Co-curricular", description: "Sports, clubs, and leadership development." },
        ],
      },
    },
    {
      sectionKey: "gallery",
      title: "Campus & life",
      sortOrder: 3,
      content: {
        headline: "Our school in pictures",
        body: "Spaces, buildings, our team, and learning beyond the classroom.",
        galleryImages: [],
      },
    },
    {
      sectionKey: "admissions",
      title: "Admissions",
      sortOrder: 4,
      content: {
        headline: "Join Our School",
        body: "We welcome new learners throughout the academic year, subject to availability. Follow the steps below to begin your application.",
        bullets: [
          "Complete the application form (online or at the school office)",
          "Submit previous school records and birth certificate",
          "Attend an interview or assessment where required",
          "Receive admission letter and fee structure",
        ],
        ctaLabel: "Contact Admissions",
        ctaHref: "#contact",
      },
    },
    {
      sectionKey: "news",
      title: "News & Events",
      sortOrder: 5,
      content: {
        headline: "Latest Updates",
        items: [
          { title: "New Academic Year", description: "Term dates and reporting information for all grades." },
          { title: "Open Day", description: "Prospective families invited to tour the campus." },
          { title: "Sports & Culture", description: "Inter-house competitions and annual prize giving." },
        ],
      },
    },
    {
      sectionKey: "contact",
      title: "Contact Us",
      sortOrder: 6,
      content: {
        headline: "Get in Touch",
        body: "Visit us, call the office, or send an email — we are happy to answer your questions about enrolment, fees, and school life.",
        bullets: [
          "Office hours: Monday – Friday, 8:00 AM – 4:00 PM",
          "Admissions enquiries welcome year-round",
        ],
      },
    },
  ];
}

/** Visual layout slugs map to four Kenyan public-university / college aesthetics (see picker UI). */
const TEMPLATE_OVERRIDES: Partial<
  Record<WebsiteTemplateSlug, Partial<Record<WebsiteSectionKey, Partial<SectionContent>>>>
> = {
  /** Classic — wide bands, news-forward (University of Nairobi–style) */
  classic: {
    hero: {
      subheadline: "Transforming lives through knowledge and service",
      body: "A flagship-style layout with a strong academic presence, research partnerships, and community outreach.",
    },
    about: {
      body: "We combine rigorous scholarship with practical skills, preparing graduates who strengthen society and the economy.",
      bullets: [
        "Research-informed teaching",
        "Diverse academic pathways",
        "National and regional partnerships",
        "Student support and career readiness",
      ],
    },
    programmes: {
      headline: "Schools & programmes",
      body: "Structured pathways from foundational learning to advanced study, with co-curricular depth.",
    },
  },
  /** Modern — full-bleed hero, cards (Kenyatta University–style energy) */
  modern: {
    hero: {
      subheadline: "Innovation. Excellence. Community.",
      body: "A forward-looking campus experience where learners thrive in academics, technology, leadership, and co-curricular life.",
    },
    programmes: {
      body: "Programme clusters designed for discovery, industry relevance, and holistic growth.",
    },
  },
  /** Compact — dense header + bands (Embu University College / regional college–style) */
  compact: {
    hero: {
      subheadline: "Excellence anchored in the region",
      body: "A focused institution serving students and communities with clear programmes, strong mentorship, and accessible admissions.",
    },
    programmes: {
      body: "Practical programmes with measurable outcomes from intake to graduation.",
    },
    news: {
      headline: "Announcements",
      items: [
        { title: "Reporting dates", description: "Key dates for continuing and new students." },
        { title: "Campus notices", description: "Faculty and student information bulletins." },
        { title: "Community outreach", description: "Partnerships and extension activities." },
      ],
    },
  },
  /** Minimal — clean nav, admissions-first (Kabianga-style clarity) */
  minimal: {
    hero: {
      subheadline: "Learning, integrity, and opportunity",
      body: "Straightforward pathways to enrolment: explore who we are, what we offer, and how to join our learning community.",
    },
    admissions: {
      body: "We keep admissions transparent—reach the office for eligibility, intake periods, and required documents.",
    },
  },
};

export function buildDefaultSections(
  templateSlug: WebsiteTemplateSlug,
  schoolName: string,
  options?: WebsiteSectionSeedOptions
): DefaultSectionSeed[] {
  const motto = options?.motto?.trim() || "";
  const principal = options?.principalName?.trim() || "the Principal";
  const sections = baseSections(schoolName, motto, principal, options);
  const overrides = TEMPLATE_OVERRIDES[templateSlug];
  if (!overrides) return sections;

  const hasAdminDescription = Boolean(options?.description?.trim());

  return sections.map((section) => {
    const patch = overrides[section.sectionKey];
    if (!patch) return section;
    const patchUse = { ...patch };
    if (hasAdminDescription && (section.sectionKey === "hero" || section.sectionKey === "about")) {
      delete patchUse.body;
    }
    if (Object.keys(patchUse).length === 0) return section;
    return { ...section, content: { ...section.content, ...patchUse } };
  });
}

export const WEBSITE_SECTION_KEYS: WebsiteSectionKey[] = [
  "hero",
  "about",
  "programmes",
  "gallery",
  "admissions",
  "news",
  "contact",
];
