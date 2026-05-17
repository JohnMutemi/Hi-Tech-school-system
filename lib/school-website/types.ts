export type WebsiteTemplateSlug = "classic" | "modern" | "compact" | "minimal";

export type WebsiteSectionKey =
  | "hero"
  | "about"
  | "programmes"
  | "gallery"
  | "admissions"
  | "news"
  | "contact";

export type GalleryImageItem = {
  url: string;
  alt?: string;
  caption?: string;
};

export type SectionContent = {
  headline?: string;
  subheadline?: string;
  body?: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  imageAlt?: string;
  items?: { title: string; description?: string }[];
  /** Public site marquee gallery (buildings, staff, activities) */
  galleryImages?: GalleryImageItem[];
};

export type WebsiteSectionRecord = {
  sectionKey: WebsiteSectionKey;
  title: string | null;
  content: SectionContent;
  isVisible: boolean;
  sortOrder: number;
};

export type PublicSchoolPayload = {
  schoolCode: string;
  name: string;
  logo: string | null;
  colorTheme: string;
  packageType: string;
  websiteTemplateSlug: WebsiteTemplateSlug;
  publicWebsiteEnabled: boolean;
  motto: string | null;
  principalName: string | null;
  establishedYear: number | null;
  description: string | null;
  address: string;
  phone: string;
  email: string;
  websiteUrl: string | null;
  customDomain: string | null;
  publicSiteUrl: string;
  staffLoginUrl: string;
  sections: WebsiteSectionRecord[];
};
