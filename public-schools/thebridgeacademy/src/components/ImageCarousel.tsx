import { useEffect, useState } from "react";

type Slide = { src: string; alt: string; caption?: string };

export function ImageCarousel({
  slides,
  intervalMs = 5000,
  showCaption = false,
  className = "",
  eager = false,
}: {
  slides: Slide[];
  intervalMs?: number;
  showCaption?: boolean;
  className?: string;
  eager?: boolean;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), intervalMs);
    return () => clearInterval(t);
  }, [slides.length, intervalMs]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {slides.map((s, idx) => (
        <img
          key={s.src}
          src={s.src}
          alt={s.alt}
          loading={eager && idx === 0 ? "eager" : "lazy"}
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {showCaption && slides[i]?.caption ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 sm:p-6">
          <p className="font-serif text-base text-white sm:text-lg">{slides[i].caption}</p>
        </div>
      ) : null}
      {slides.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:bottom-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Show slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
