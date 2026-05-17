import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroMarquee } from "@/components/HeroMarquee";
import { news } from "@/data/news";
import { ArrowRight, GraduationCap, BookOpen, Trophy, Users } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative isolate min-h-[88vh] flex items-center text-primary-foreground overflow-hidden">
          <HeroMarquee />
          <div className="relative mx-auto max-w-7xl px-6 py-24 grid md:grid-cols-12 gap-10 items-end">
            <div className="md:col-span-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-gold/90 text-gold-foreground px-3 py-1 text-xs font-medium uppercase tracking-widest">Est. 2013 · Waita Town</span>
              <h1 className="mt-6 font-display text-5xl md:text-7xl lg:text-8xl font-semibold leading-[0.95] text-balance">
                A school where <em className="not-italic text-gold">excellence</em> meets character.
              </h1>
              <p className="mt-4 inline-flex items-center gap-2 text-sm text-gold/90 font-display tracking-wide">
                <span className="inline-block h-px w-6 bg-gold/60" /> Humility and Hardwork Brings Success <span className="inline-block h-px w-6 bg-gold/60" />
              </p>
              <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
                Waita Progressive Academy has been the top-performing school in our region for over a decade. We offer a conducive, disciplined environment for young minds to flourish.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/admissions" className="inline-flex items-center gap-2 rounded-full bg-gold text-gold-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition">
                  Begin Admission <ArrowRight size={16} />
                </Link>
                <Link to="/about" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-semibold hover:bg-primary-foreground/10 transition">
                  Our Story
                </Link>
              </div>
            </div>
            <div className="md:col-span-4 grid grid-cols-2 gap-4 text-primary-foreground">
              {[
                { k: "12+", l: "Years of excellence" },
                { k: "1,200", l: "Learners enrolled" },
                { k: "98%", l: "Transition rate" },
                { k: "#1", l: "In the county" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-primary-foreground/10 backdrop-blur p-5 border border-primary-foreground/15">
                  <div className="font-display text-3xl text-gold">{s.k}</div>
                  <div className="text-xs uppercase tracking-wider mt-1 text-primary-foreground/80">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PILLARS */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-4">
              <div className="text-xs uppercase tracking-widest text-primary font-medium">What we stand for</div>
              <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground text-balance">Four pillars carry every Waita scholar.</h2>
            </div>
            <div className="md:col-span-8 grid sm:grid-cols-2 gap-5">
              {[
                { Icon: GraduationCap, t: "Academic rigor", d: "A curriculum tuned for mastery, with personal mentorship and weekly progress reviews." },
                { Icon: BookOpen, t: "Character first", d: "Discipline, empathy and service shape who our learners become, not just what they know." },
                { Icon: Trophy, t: "Co-curricular life", d: "Music, drama, debate and 14 sports — every learner finds a stage of their own." },
                { Icon: Users, t: "Family & community", d: "Open communication with parents, and roots planted firmly in Waita Town." },
              ].map(({ Icon, t, d }) => (
                <div key={t} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition">
                  <Icon className="text-primary" size={28} />
                  <h3 className="mt-4 font-display text-xl">{t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NEWS PREVIEW */}
        <section className="bg-secondary/40 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-end justify-between gap-6 mb-10">
              <div>
                <div className="text-xs uppercase tracking-widest text-primary font-medium">Latest news</div>
                <h2 className="mt-3 font-display text-4xl md:text-5xl text-foreground">From the corridors of Waita.</h2>
              </div>
              <Link to="/news" className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all">
                All stories <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {news.slice(0, 3).map((n) => (
                <Link to="/news/$slug" params={{ slug: n.slug }} key={n.slug} className="group rounded-2xl bg-card border border-border p-6 flex flex-col hover:shadow-lg hover:-translate-y-1 transition">
                  <div className="text-xs uppercase tracking-widest text-gold-foreground bg-gold/30 self-start px-2 py-1 rounded">{n.category}</div>
                  <h3 className="mt-4 font-display text-xl leading-snug group-hover:text-primary transition-colors">{n.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{n.excerpt}</p>
                  <div className="mt-6 text-xs text-muted-foreground">{new Date(n.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 grid md:grid-cols-2 gap-8 items-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-4xl md:text-5xl text-balance">Applications open for the 2027 intake.</h2>
              <p className="mt-4 text-primary-foreground/80 max-w-md">Limited places in Form 1 and select transfer slots across other forms. Apply early.</p>
            </div>
            <div className="relative flex md:justify-end">
              <Link to="/admissions" className="inline-flex items-center gap-2 rounded-full bg-gold text-gold-foreground px-7 py-4 text-base font-semibold hover:opacity-90 transition">
                Start your application <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
