import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/SiteLayout";
import { aboutBanner } from "@/data/site-media";
import { Compass, Heart, Target } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Mwingi Royal Junior Academy" },
      { name: "description", content: "Founded in 2016, Mwingi Royal Junior Academy is a centre of excellence located 8KM off Mwingi–Tseikuru road, before Kyulungwa Centre." },
      { property: "og:title", content: "About Mwingi Royal Junior Academy" },
      { property: "og:description", content: "A centre of excellence since 2016." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="About Us"
        title="A centre of excellence since 2016."
        intro="Mwingi Royal Junior Academy was founded with a single purpose — to provide a nurturing, world-class learning environment for children in our community."
      />

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2">
        <img
          src={aboutBanner}
          alt="Students at Mwingi Royal Junior Academy"
          width={1200}
          height={900}
          loading="lazy"
          className="rounded-xl object-cover shadow-lg"
        />
        <div>
          <h2 className="font-serif text-3xl font-bold">Our Story</h2>
          <p className="mt-5 text-muted-foreground">
            Established in 2016, Mwingi Royal Junior Academy began as a small school with a big dream — to raise confident, knowledgeable, and morally upright young people. Year after year, we have grown in numbers, reputation, and results, becoming one of the trusted academies in the region.
          </p>
          <p className="mt-4 text-muted-foreground">
            Our campus is situated 8KM off the Mwingi–Tseikuru road, just before Kyulungwa centre market — a serene location ideal for learning, play, and growth.
          </p>
        </div>
      </section>

      <section className="bg-secondary/50">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-20 md:grid-cols-3">
          {[
            { icon: Compass, title: "Our Vision", body: "To be a leading institution that shapes responsible global citizens through quality education." },
            { icon: Target, title: "Our Mission", body: "To deliver holistic, learner-centred education that nurtures character, competence, and creativity." },
            { icon: Heart, title: "Our Values", body: "Integrity, Excellence, Respect, Discipline, and Community." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl bg-card p-7 shadow-sm">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
                <Icon size={22} />
              </div>
              <h3 className="font-serif text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="font-serif text-3xl font-bold">A Message from the Head Teacher</h2>
        <p className="mt-6 text-muted-foreground">
          "At Mwingi Royal, every child is known, loved, and challenged to reach their full potential. We are proud of what our pupils, teachers, and parents have built together — and we look forward to walking with your family on this journey."
        </p>
      </section>
    </SiteLayout>
  );
}
