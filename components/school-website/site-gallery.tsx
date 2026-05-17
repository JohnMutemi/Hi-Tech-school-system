"use client";

import type { PublicSchoolPayload } from "@/lib/school-website/types";

function sectionByKey(sections: PublicSchoolPayload["sections"], key: string) {
  return sections.find((s) => s.sectionKey === key && s.isVisible);
}

function MarqueeRow({ reverse, children }: { reverse?: boolean; children: React.ReactNode }) {
  return (
    <div className="relative w-full overflow-hidden py-2">
      <div
        className={`flex w-max gap-4 ${reverse ? "school-gallery-marquee-rtl" : "school-gallery-marquee-ltr"}`}
      >
        <div className="flex shrink-0 gap-4">{children}</div>
        <div className="flex shrink-0 gap-4" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

type Props = {
  data: PublicSchoolPayload;
  /** Break out of a narrow template column (e.g. minimal) */
  fullBleed?: boolean;
};

export function SiteGallery({ data, fullBleed }: Props) {
  const section = sectionByKey(data.sections, "gallery");
  if (!section) return null;
  const images = section.content.galleryImages?.filter((i) => i.url?.trim()) ?? [];
  if (images.length === 0) return null;

  const cards = images.map((img, i) => (
    <figure
      key={`g-${i}-${img.url.slice(0, 48)}`}
      className="relative h-44 w-64 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-200/60 shadow-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- data URLs + arbitrary school hosts */}
      <img
        src={img.url}
        alt={img.alt || "School photo"}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      {img.caption ? (
        <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5 text-left text-xs text-white">
          {img.caption}
        </figcaption>
      ) : null}
    </figure>
  ));

  const header = (
    <div className="mx-auto max-w-6xl px-4">
      {section.title ? (
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-900 md:text-3xl">{section.title}</h2>
      ) : null}
      {section.content.headline ? (
        <p className="mb-2 text-center text-lg font-semibold text-slate-800">{section.content.headline}</p>
      ) : null}
      {section.content.body ? (
        <p className="mx-auto mb-8 max-w-2xl text-center text-slate-600">{section.content.body}</p>
      ) : null}
    </div>
  );

  const body = (
    <div className="space-y-5">
      <MarqueeRow>{cards}</MarqueeRow>
      <MarqueeRow reverse>{cards}</MarqueeRow>
    </div>
  );

  const sectionClass =
    "border-y border-slate-200 bg-gradient-to-b from-slate-100/80 to-slate-50 py-12 md:py-16";

  if (fullBleed) {
    return (
      <section id="gallery" className={`relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 ${sectionClass}`}>
        {header}
        {body}
      </section>
    );
  }

  return (
    <section id="gallery" className={sectionClass}>
      {header}
      {body}
    </section>
  );
}
