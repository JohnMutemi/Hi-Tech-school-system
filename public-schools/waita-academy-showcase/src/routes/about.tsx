import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import hero from "@/assets/hero-2.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Waita Progressive Academy" },
      { name: "description", content: "Founded in 2013 in Waita Town, our academy has been the top-performing school in the region for over a decade." },
      { property: "og:title", content: "About Waita Progressive Academy" },
      { property: "og:description", content: "Our story, mission and values — since 2013." },
      { property: "og:image", content: hero },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative h-[60vh] flex items-end text-primary-foreground">
          <img src={hero} alt="Waita campus" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-primary/20" />
          <div className="relative mx-auto max-w-7xl px-6 pb-12">
            <div className="text-xs uppercase tracking-widest text-gold">About us</div>
            <h1 className="mt-3 font-display text-5xl md:text-7xl text-balance max-w-3xl">A small idea in 2013. A regional institution today.</h1>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-20 prose-lg">
          <p className="text-xl text-foreground leading-relaxed">
            Waita Progressive Academy was founded in <strong>2013</strong> with twenty-three pioneer learners and a borrowed classroom. Today, we are a thriving co-educational school of over <strong>1,200 students</strong>, strategically located at the heart of <strong>Waita Town</strong>, and consistently ranked among the top performers in our region.
          </p>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Our location offers learners a quiet, conducive environment — far enough from urban distractions to focus, yet close enough to the town centre to be plugged into community life. Spacious grounds, modern classrooms, well-stocked libraries and dedicated science laboratories form the backbone of an unhurried learning experience.
          </p>
        </section>

        <section className="bg-secondary/40 py-20">
          <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-3 gap-8">
            {[
              { t: "Our mission", d: "To raise principled, curious and resilient young people equipped to thrive in any environment." },
              { t: "Our vision", d: "To be East Africa's most trusted progressive academy — a school families speak of with pride." },
              { t: "Our values", d: "Excellence. Integrity. Curiosity. Service. Community. Joy." },
            ].map((b) => (
              <div key={b.t} className="rounded-2xl bg-card p-8 border border-border">
                <h3 className="font-display text-2xl text-primary">{b.t}</h3>
                <p className="mt-3 text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="font-display text-4xl text-foreground mb-10">A timeline</h2>
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
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
