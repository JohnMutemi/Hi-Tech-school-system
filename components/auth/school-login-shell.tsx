"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getSchoolThemeTokens, hexToRgba } from "@/lib/utils/school-theme";

interface SchoolLoginShellProps {
  schoolCode: string;
  heading: string;
  subheading: string;
  children: ReactNode;
  adminLoginHref?: string;
  logoUrl?: string | null;
  colorTheme?: string | null;
}

const HERO_SLIDES = [
  {
    image:
      "https://images.pexels.com/photos/8613089/pexels-photo-8613089.jpeg?auto=compress&cs=tinysrgb&w=1600",
    liner: "Bright minds learning together every day.",
    quote: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    author: "Malcolm X",
  },
  {
    image:
      "https://images.pexels.com/photos/8471838/pexels-photo-8471838.jpeg?auto=compress&cs=tinysrgb&w=1600",
    liner: "Curiosity, confidence, and character in one place.",
    quote: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
  },
  {
    image:
      "https://images.pexels.com/photos/8423093/pexels-photo-8423093.jpeg?auto=compress&cs=tinysrgb&w=1600",
    liner: "Play, discover, and grow in a safe school community.",
    quote: "Develop a passion for learning. If you do, you will never cease to grow.",
    author: "Anthony J. D'Angelo",
  },
  {
    image:
      "https://images.pexels.com/photos/8471777/pexels-photo-8471777.jpeg?auto=compress&cs=tinysrgb&w=1600",
    liner: "Building leaders through learning and teamwork.",
    quote: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
];

export function SchoolLoginShell({
  schoolCode,
  heading,
  subheading,
  children,
  adminLoginHref,
  logoUrl,
  colorTheme,
}: SchoolLoginShellProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const theme = getSchoolThemeTokens(colorTheme);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => {
        const next = prev + direction;
        if (next >= HERO_SLIDES.length) {
          setDirection(-1);
          return prev - 1;
        }
        if (next < 0) {
          setDirection(1);
          return prev + 1;
        }
        return next;
      });
    }, 8000);
    return () => window.clearInterval(timer);
  }, [direction]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto flex min-h-[85vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <aside className="relative hidden w-1/2 lg:block">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="flex h-full w-full transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {HERO_SLIDES.map((slide) => (
                <div key={slide.image} className="relative h-full min-w-full">
                  <img
                    src={slide.image}
                    alt="African children learning in school"
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to top right, ${hexToRgba(theme.primaryDeeper, 0.88)}, ${hexToRgba(
                        theme.primaryDark,
                        0.72
                      )}, ${hexToRgba(theme.primary, 0.34)})`,
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col justify-between p-10 text-white">
                    <div className="space-y-5">
                      <div className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur-sm">
                        <GraduationCap className="h-5 w-5" />
                        <span className="text-sm font-semibold tracking-wide">
                          Hi-Tech School Management
                        </span>
                      </div>
                      <div>
                        <h2 className="max-w-md text-4xl font-bold leading-tight">
                          {slide.liner}
                        </h2>
                        <p className="mt-4 max-w-md text-sm text-blue-100">
                          A secure digital gateway for students, teachers, parents, and school administrators.
                        </p>
                      </div>
                    </div>
                    <div className="max-w-sm rounded-2xl border border-white/20 bg-black/20 p-5 backdrop-blur-sm">
                      <p className="text-sm text-blue-100">
                        &quot;{slide.quote}&quot;
                      </p>
                      <p className="mt-3 text-xs font-medium text-blue-200">- {slide.author}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-8 left-10 z-20 flex items-center gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setActiveSlide(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === activeSlide ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </aside>

        <main
          className="flex w-full items-center justify-center p-4 sm:p-8 lg:w-1/2"
          style={{
            background: `linear-gradient(to bottom right, ${theme.primarySoft}, #f8fafc, ${hexToRgba(theme.primary, 0.12)})`,
          }}
        >
          <div className="relative w-full max-w-[460px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-7">
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark}, ${theme.primary})` }}
            />
            <div className="mb-6">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${heading} logo`}
                    className="h-10 w-10 rounded-lg border border-slate-200 object-cover bg-white"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white" style={{ color: theme.primary }}>
                    <GraduationCap className="h-5 w-5" />
                  </div>
                )}
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{heading}</h1>
              </div>
              <p
                className="mt-2 inline-flex rounded-md px-3 py-1.5 text-base font-semibold"
                style={{ backgroundColor: theme.primaryLight, color: theme.primaryDark }}
              >
                {subheading}
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                School Code: <span className="font-semibold text-slate-700">{schoolCode.toUpperCase()}</span>
              </p>
            </div>

            {adminLoginHref ? (
              <div className="mb-4">
                <Link
                  href={adminLoginHref}
                  className="text-xs font-semibold uppercase tracking-wide hover:underline"
                  style={{ color: theme.primaryDark }}
                >
                  Back to School Admin Login
                </Link>
              </div>
            ) : null}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
