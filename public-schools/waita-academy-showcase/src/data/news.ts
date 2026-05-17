export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  body: string;
};

export const news: NewsItem[] = [
  {
    slug: "kcse-2025-results",
    title: "Waita Tops County in 2025 KCSE Results",
    date: "2026-01-12",
    category: "Academics",
    excerpt: "For the 9th consecutive year, Waita Progressive Academy leads Kitui County with a mean score of 9.42.",
    body: "Our 2025 candidate class delivered an extraordinary mean grade of B+ (9.42), with 87% of candidates qualifying for direct university entry. We congratulate every learner, teacher, and parent who made this possible.",
  },
  {
    slug: "new-science-lab",
    title: "Modern Science Complex Opens Its Doors",
    date: "2025-11-04",
    category: "Campus",
    excerpt: "A new three-storey science block expands our chemistry, biology and physics laboratories.",
    body: "Built over 18 months, the new complex doubles our practical capacity and introduces a dedicated robotics workshop for the senior school.",
  },
  {
    slug: "music-festival-nationals",
    title: "Drama Club Qualifies for the Nationals",
    date: "2025-09-21",
    category: "Co-curricular",
    excerpt: "Our drama club represents Eastern Region at the Kenya Schools Drama Festival.",
    body: "An original choral verse titled “Voices of Waita” earned the team a standing ovation at regionals and a slot at the upcoming national festival.",
  },
  {
    slug: "alumni-mentorship",
    title: "Alumni Launch Mentorship Programme",
    date: "2025-07-15",
    category: "Community",
    excerpt: "Graduates from across the years return to mentor current Form 3 and 4 students.",
    body: "More than 40 alumni — now doctors, engineers, teachers and entrepreneurs — have signed up to guide our learners through career conversations and university applications.",
  },
];
