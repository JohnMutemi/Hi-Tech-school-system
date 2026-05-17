/** Options passed when seeding CMS sections at school creation / reseed */
export type WebsiteSectionSeedOptions = {
  motto?: string;
  principalName?: string;
  /** Free-text from super admin — folded into hero / about when present */
  description?: string;
  address?: string;
  establishedYear?: number | null;
};
