import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import { heroSlides } from "@/data/site-media";
import { SiteButton } from "@/components/site/layout";

const SLIDE_INTERVAL_MS = 4000;

function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroSlides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0">
      {heroSlides.map((src, i) => (
        <motion.img
          key={src}
          src={src}
          alt=""
          aria-hidden={i !== index}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-slate-900"
    >
      <HeroSlideshow />
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/55 via-primary/20 to-primary/35" />

      <motion.div
        className="site-container relative z-10 flex flex-col items-center py-10 pt-20 text-center sm:py-16 sm:pt-24 lg:py-24"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <span className="inline-flex max-w-[95vw] items-center gap-2 rounded-full border border-gold/40 bg-white/10 px-3 py-1.5 text-xs font-medium text-gold backdrop-blur sm:px-4 sm:text-sm">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold animate-pulse" />
          Thriving since 2007
        </span>

        <h1 className="mt-4 max-w-[16ch] font-display text-[2rem] font-bold leading-[1.08] text-white sm:mt-6 sm:max-w-4xl sm:text-5xl lg:text-6xl">
          Welcome to <span className="text-gold">The Bridge Academy</span>
        </h1>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:mt-6 sm:text-lg lg:text-xl">
          A high-performing private comprehensive school thriving since 2007 — shaping confident,
          curious learners ready for tomorrow&apos;s world.
        </p>

        <p className="mt-4 font-display text-lg italic tracking-wide text-gold/95 sm:mt-5 sm:text-xl">
          A learning Experience with a Difference
        </p>

        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
          <SiteButton href="#admissions" variant="primary">
            Apply Now <ArrowRight className="h-4 w-4" />
          </SiteButton>
          <SiteButton href="#about" variant="secondary">
            Learn More
          </SiteButton>
          <SiteButton href="/admission-form.pdf" variant="ghost" className="sm:px-4">
            <Download className="h-4 w-4" /> Admission Form
          </SiteButton>
        </div>
      </motion.div>

      <p className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 text-[0.65rem] uppercase tracking-widest text-white/60 sm:block sm:text-xs">
        Scroll to explore
      </p>
    </section>
  );
}
