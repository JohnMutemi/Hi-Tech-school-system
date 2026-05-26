import { useEffect, useState } from "react";
import { heroSlides } from "@/data/site-media";

export function HeroMarquee() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % heroSlides.length), 4500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {heroSlides.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out ${idx === i ? "opacity-100" : "opacity-0"}`}
          loading={idx === 0 ? "eager" : "lazy"}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/60 to-primary/90" />
      <div className="absolute inset-0 bg-grain opacity-40" />
    </div>
  );
}
