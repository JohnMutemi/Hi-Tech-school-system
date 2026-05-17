import { useEffect, useState } from "react";
import h1 from "@/assets/hero-1.jpg";
import h2 from "@/assets/hero-2.jpg";
import h3 from "@/assets/hero-3.jpg";
import h4 from "@/assets/hero-4.jpg";
import h5 from "@/assets/hero-5.jpg";
import h6 from "@/assets/hero-6.jpg";

const images = [h1, h2, h3, h4, h5, h6];

export function HeroMarquee() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % images.length), 4500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((src, idx) => (
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
