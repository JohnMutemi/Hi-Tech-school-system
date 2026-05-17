"use client";

import type { PublicSchoolPayload, WebsiteSectionRecord } from "@/lib/school-website/types";
import { Mail, MapPin, Phone } from "lucide-react";

type Variant = "classic" | "modern" | "compact" | "minimal";

function sectionByKey(sections: WebsiteSectionRecord[], key: string) {
  return sections.find((s) => s.sectionKey === key && s.isVisible);
}

export function SiteHero({ data, variant = "classic" }: { data: PublicSchoolPayload; variant?: Variant }) {
  const section = sectionByKey(data.sections, "hero");
  if (!section) return null;
  const c = section.content;
  const isModern = variant === "modern";
  const isMinimal = variant === "minimal";

  return (
    <section
      id="hero"
      className={
        isModern
          ? "relative flex min-h-[70vh] items-center text-white"
          : isMinimal
            ? "border-b bg-[var(--school-primary-soft)] py-16 md:py-20"
            : "bg-gradient-to-br from-[var(--school-primary)] to-[var(--school-primary-dark)] py-20 text-white md:py-28"
      }
      style={
        isModern
          ? { background: "linear-gradient(135deg, var(--school-primary-dark), var(--school-primary))" }
          : undefined
      }
    >
      <div className="mx-auto max-w-6xl px-4">
        {data.motto && !isMinimal && (
          <p
            className={`mb-3 text-sm uppercase tracking-widest ${
              isModern || variant === "classic" ? "text-white/80" : "text-[var(--school-primary)]"
            }`}
          >
            {data.motto}
          </p>
        )}
        <h1
          className={`font-bold tracking-tight ${
            isMinimal ? "text-3xl text-slate-900 md:text-4xl" : "text-4xl md:text-5xl lg:text-6xl"
          }`}
        >
          {c.headline || data.name}
        </h1>
        {c.subheadline && (
          <p className={`mt-4 max-w-2xl text-lg md:text-xl ${isMinimal ? "text-slate-600" : "text-white/90"}`}>
            {c.subheadline}
          </p>
        )}
        {c.body && (
          <p className={`mt-4 max-w-2xl ${isMinimal ? "text-slate-600" : "text-white/85"}`}>{c.body}</p>
        )}
        {c.ctaLabel && (
          <a
            href={c.ctaHref || "#admissions"}
            className={`mt-8 inline-block rounded-lg px-6 py-3 font-semibold transition ${
              isMinimal
                ? "bg-[var(--school-primary)] text-white hover:opacity-90"
                : "bg-white text-[var(--school-primary-dark)] hover:bg-white/95"
            }`}
          >
            {c.ctaLabel}
          </a>
        )}
      </div>
    </section>
  );
}

function SectionShell({
  id,
  title,
  children,
  variant,
}: {
  id: string;
  title?: string | null;
  children: React.ReactNode;
  variant?: Variant;
}) {
  const alt = variant === "compact";
  return (
    <section id={id} className={alt ? "bg-slate-50 py-12" : "py-16 md:py-20"}>
      <div className="mx-auto max-w-6xl px-4">
        {title && (
          <h2
            className={`mb-8 font-bold text-slate-900 ${
              variant === "modern"
                ? "border-l-4 border-[var(--school-primary)] pl-4 text-3xl"
                : "text-2xl md:text-3xl"
            }`}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </section>
  );
}

export function SiteAbout({ data, variant }: { data: PublicSchoolPayload; variant?: Variant }) {
  const section = sectionByKey(data.sections, "about");
  if (!section) return null;
  const c = section.content;
  return (
    <SectionShell id="about" title={section.title} variant={variant}>
      {c.headline && <h3 className="mb-3 text-xl font-semibold text-slate-800">{c.headline}</h3>}
      {c.body && <p className="max-w-3xl leading-relaxed text-slate-600">{c.body}</p>}
      {data.principalName && (
        <p className="mt-4 text-sm text-slate-500">
          Principal: <span className="font-medium text-slate-700">{data.principalName}</span>
        </p>
      )}
      {data.establishedYear && (
        <p className="text-sm text-slate-500">Established {data.establishedYear}</p>
      )}
      {c.bullets && c.bullets.length > 0 && (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {c.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-slate-700">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--school-primary)]" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

export function SiteProgrammes({ data, variant }: { data: PublicSchoolPayload; variant?: Variant }) {
  const section = sectionByKey(data.sections, "programmes");
  if (!section) return null;
  const c = section.content;
  const gridClass =
    variant === "modern" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-4 sm:grid-cols-2";

  return (
    <SectionShell id="programmes" title={section.title} variant={variant}>
      {c.body && <p className="mb-8 max-w-2xl text-slate-600">{c.body}</p>}
      {c.items && (
        <div className={gridClass}>
          {c.items.map((item) => (
            <article
              key={item.title}
              className={`rounded-xl border p-5 ${
                variant === "modern"
                  ? "border-slate-100 bg-white shadow-md transition hover:shadow-lg"
                  : "border-slate-200 bg-white"
              }`}
            >
              <h3 className="font-semibold text-[var(--school-primary-dark)]">{item.title}</h3>
              {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
            </article>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

export function SiteAdmissions({ data, variant }: { data: PublicSchoolPayload; variant?: Variant }) {
  const section = sectionByKey(data.sections, "admissions");
  if (!section) return null;
  const c = section.content;
  return (
    <SectionShell
      id="admissions"
      title={section.title}
      variant={variant === "minimal" ? "compact" : variant}
    >
      <div className="rounded-2xl border-2 border-[var(--school-primary)]/20 bg-[var(--school-primary-soft)] p-6 md:p-8">
        {c.headline && <h3 className="text-xl font-semibold text-slate-900">{c.headline}</h3>}
        {c.body && <p className="mt-3 text-slate-600">{c.body}</p>}
        {c.bullets && (
          <ol className="mt-6 space-y-3">
            {c.bullets.map((b, i) => (
              <li key={b} className="flex gap-3 text-slate-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--school-primary)] text-sm font-bold text-white">
                  {i + 1}
                </span>
                {b}
              </li>
            ))}
          </ol>
        )}
        {c.ctaLabel && (
          <a
            href={c.ctaHref || "#contact"}
            className="mt-6 inline-block rounded-lg bg-[var(--school-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            {c.ctaLabel}
          </a>
        )}
      </div>
    </SectionShell>
  );
}

export function SiteNews({ data, variant }: { data: PublicSchoolPayload; variant?: Variant }) {
  const section = sectionByKey(data.sections, "news");
  if (!section) return null;
  const c = section.content;
  return (
    <SectionShell id="news" title={section.title} variant={variant}>
      {c.items && (
        <div className="grid gap-4 md:grid-cols-3">
          {c.items.map((item) => (
            <div key={item.title} className="border-l-4 border-[var(--school-primary)] py-2 pl-4">
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

export function SiteContact({ data }: { data: PublicSchoolPayload }) {
  const section = sectionByKey(data.sections, "contact");
  if (!section) return null;
  const c = section.content;
  return (
    <SectionShell id="contact" title={section.title}>
      {c.body && <p className="mb-8 max-w-2xl text-slate-600">{c.body}</p>}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[var(--school-primary)]" />
            <div>
              <p className="font-medium text-slate-900">Address</p>
              <p className="text-slate-600">{data.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[var(--school-primary)]" />
            <div>
              <p className="font-medium text-slate-900">Phone</p>
              <a href={`tel:${data.phone}`} className="text-slate-600 hover:text-[var(--school-primary)]">
                {data.phone}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[var(--school-primary)]" />
            <div>
              <p className="font-medium text-slate-900">Email</p>
              <a href={`mailto:${data.email}`} className="text-slate-600 hover:text-[var(--school-primary)]">
                {data.email}
              </a>
            </div>
          </div>
        </div>
        {c.bullets && (
          <ul className="space-y-2 text-slate-600">
            {c.bullets.map((b) => (
              <li key={b}>• {b}</li>
            ))}
          </ul>
        )}
      </div>
    </SectionShell>
  );
}

export { SiteGallery } from "./site-gallery";
