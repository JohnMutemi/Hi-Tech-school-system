import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Trophy, Smile, Globe } from "lucide-react";
import { SiteContainer } from "@/components/site/layout";

const stats = [
  { icon: GraduationCap, value: 1200, suffix: "+", label: "Students Graduated" },
  { icon: Trophy, value: 30, suffix: "+", label: "National Awards" },
  { icon: Smile, value: 98, suffix: "%", label: "Parent Satisfaction" },
  { icon: Globe, value: 17, suffix: "yrs", label: "Of Excellence" },
];

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const dur = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setVal(Math.floor(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="relative overflow-hidden bg-gradient-primary py-12 sm:py-16 lg:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <SiteContainer className="relative">
        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center text-primary-foreground"
            >
              <s.icon className="mx-auto h-7 w-7 text-gold sm:h-8 sm:w-8" />
              <div className="mt-3 font-display text-3xl font-bold sm:mt-4 sm:text-5xl lg:text-6xl">
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-1.5 text-[0.65rem] uppercase tracking-wider text-white/80 sm:mt-2 sm:text-xs sm:tracking-widest">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </SiteContainer>
    </section>
  );
}
