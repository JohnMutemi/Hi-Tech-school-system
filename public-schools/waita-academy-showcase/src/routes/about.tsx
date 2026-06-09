import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { aboutBanner } from "@/data/site-media";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Waita Progressive Academy" },
      { name: "description", content: "Founded in 2013 in Waita Town, our academy has been the top-performing school in the region for over a decade." },
      { property: "og:title", content: "About Waita Progressive Academy" },
      { property: "og:description", content: "Our story, mission and values — since 2013." },
      { property: "og:image", content: aboutBanner },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="About us"
          title="A small idea in 2013. A regional institution today."
          description="From humble beginnings to one of the region's top-performing schools, our story is rooted in discipline, care, and excellence."
          variant="image"
          imageSrc={aboutBanner}
          imageAlt="Students and staff at Waita Progressive Academy"
        />

        <section className="site-section">
          <div className="site-container max-w-4xl">
          <p className="text-lg sm:text-xl text-foreground leading-relaxed">
            Waita Progressive Academy was founded in <strong>2013</strong> with twenty-three pioneer learners and a borrowed classroom. Today, we are a thriving co-educational school of over <strong>1,200 students</strong>, strategically located at the heart of <strong>Waita Town</strong>, and consistently ranked among the top performers in our region.
          </p>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Our location offers learners a quiet, conducive environment — far enough from urban distractions to focus, yet close enough to the town centre to be plugged into community life. Spacious grounds, modern classrooms, well-stocked libraries and dedicated science laboratories form the backbone of an unhurried learning experience.
          </p>
          </div>
        </section>

        <section className="bg-secondary/45 py-16 sm:py-20">
          <div className="site-container grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { t: "Our mission", d: "To raise principled, curious and resilient young people equipped to thrive in any environment." },
              { t: "Our vision", d: "To be East Africa's most trusted progressive academy — a school families speak of with pride." },
              { t: "Our values", d: "Excellence. Integrity. Curiosity. Service. Community. Joy." },
            ].map((b) => (
              <div key={b.t} className="site-card site-card-interactive p-7 sm:p-8">
                <h3 className="font-display text-2xl text-primary">{b.t}</h3>
                <p className="mt-3 text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="site-section">
          <div className="site-container max-w-5xl">
          <h2 className="site-heading mb-8 sm:mb-10">A timeline</h2>
          <ol className="relative border-l border-border pl-8 space-y-10">
            {[
              { y: "2013", t: "Doors open", d: "Founded by a group of local educators with 23 pioneer students." },
              { y: "2016", t: "First KCSE class", d: "Pioneer candidates post the best mean grade in the sub-county." },
              { y: "2019", t: "Boarding wing", d: "New girls' and boys' dormitories double our boarding capacity." },
              { y: "2023", t: "10-year mark", d: "We celebrate a decade and break ground on the science complex." },
              { y: "2026", t: "Today", d: "Over 1,200 learners across day and boarding programmes." },
            ].map((e) => (
              <li key={e.y} className="relative">
                <span className="absolute -left-[42px] top-1 h-4 w-4 rounded-full bg-gold ring-4 ring-background" />
                <div className="font-display text-2xl text-primary">{e.y} — {e.t}</div>
                <p className="text-muted-foreground mt-1">{e.d}</p>
              </li>
            ))}
          </ol>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
