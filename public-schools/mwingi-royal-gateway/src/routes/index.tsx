import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Users, Trophy, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { ImageCarousel } from "@/components/ImageCarousel";
import { aboutBanner, heroSlides } from "@/data/site-media";

const heroCarouselSlides = heroSlides.map((src, i) => ({
  src,
  alt: `Mwingi Royal Junior Academy — campus life ${i + 1}`,
}));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mwingi Royal Junior Academy — A Centre of Excellence Since 2016" },
      {
        name: "description",
        content:
          "Mwingi Royal Junior Academy is a leading primary school 8KM off Mwingi–Tseikuru road, nurturing excellence since 2016.",
      },
      { property: "og:title", content: "Mwingi Royal Junior Academy" },
      {
        property: "og:description",
        content: "A centre of excellence nurturing curious minds since 2016.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      {/* Split-screen Hero — rotating campus photos */}
      <section className="grid grid-cols-1 lg:min-h-[88vh] lg:grid-cols-2">
        <div className="relative order-1 h-[56vh] min-h-[320px] overflow-hidden lg:order-2 lg:h-auto lg:min-h-[500px]">
          <ImageCarousel slides={heroCarouselSlides} intervalMs={5000} eager />
        </div>
        <div className="order-2 flex items-center bg-gradient-ocean px-5 py-12 text-primary-foreground sm:px-8 sm:py-16 lg:order-1 lg:px-14 lg:py-20">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-widest sm:text-xs">
              <Sparkles size={14} /> Est. 2016
            </div>
            <h1 className="font-serif text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
              A centre of <span className="text-mist">excellence</span> for every child.
            </h1>
            <p className="mt-4 text-base text-primary-foreground/80 sm:mt-5 sm:text-lg">
              Mwingi Royal Junior Academy nurtures curious minds, confident leaders, and kind
              hearts — through holistic, learner-centred education.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <Link
                to="/admissions"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-mist px-5 py-3 text-sm font-semibold text-deep transition hover:opacity-90"
              >
                Apply for Admission <ArrowRight size={16} />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/25 px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-white/10"
              >
                Discover Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "Academic Excellence",
              body: "Rigorous CBC-aligned learning with personal attention in every class.",
            },
            {
              icon: Users,
              title: "Caring Community",
              body: "Supportive teachers, engaged parents, and lifelong friendships.",
            },
            {
              icon: Trophy,
              title: "Co-curricular Strength",
              body: "Sports, arts, music, and clubs that build well-rounded children.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-7 transition hover:shadow-lg"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-ocean">
                <Icon size={22} />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About strip */}
      <section className="bg-secondary/50">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-2">
          <img
            src={aboutBanner}
            alt="Students at Mwingi Royal Junior Academy"
            width={1200}
            height={900}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-xl object-cover shadow-xl"
          />
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-teal">
              About the Academy
            </div>
            <h2 className="font-serif text-2xl font-bold sm:text-3xl md:text-4xl">
              Excellence rooted in our community.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-base">
              Founded in 2016, Mwingi Royal Junior Academy has grown into a trusted home of
              learning serving families across Mwingi and beyond. Located 8KM off the
              Mwingi–Tseikuru road before Kyulungwa centre market, our campus offers a calm,
              safe, and inspiring environment for every learner to thrive.
            </p>
            <Link
              to="/about"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ocean hover:text-teal sm:mt-7"
            >
              Read more about us <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-14 text-center sm:px-6 sm:py-20">
        <h2 className="font-serif text-2xl font-bold sm:text-3xl md:text-4xl">
          Begin your child&apos;s journey with us.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4 sm:text-base">
          Admissions are open. Download the form, complete it, and visit our school office to
          submit.
        </p>
        <Link
          to="/admissions"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:mt-8 sm:w-auto"
        >
          Visit Admissions <ArrowRight size={16} />
        </Link>
      </section>
    </SiteLayout>
  );
}
