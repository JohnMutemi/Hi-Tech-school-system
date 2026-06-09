import { useEffect, useState } from "react";
import { heroSlides } from "@/data/site-media";

export function HeroMarquee() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % heroSlides.length), 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {heroSlides.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-linear ${idx === i ? "opacity-100" : "opacity-0"}`}
          loading={idx === 0 ? "eager" : "lazy"}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-grain opacity-40" />
    </div>
  );
}
