"use client";

import { WEBSITE_TEMPLATES } from "@/lib/school-website/templates";
import type { WebsiteTemplateSlug } from "@/lib/school-website/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Props = {
  value: WebsiteTemplateSlug;
  onChange: (slug: WebsiteTemplateSlug) => void;
  schoolName?: string;
  colorTheme?: string;
};

export function WebsiteTemplatePicker({ value, onChange, schoolName, colorTheme }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs md:text-sm font-medium text-stone-700">Website template</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {WEBSITE_TEMPLATES.map((template) => {
          const selected = value === template.slug;
          const accent = colorTheme && /^#[0-9A-Fa-f]{6}$/.test(colorTheme) ? colorTheme : template.previewAccent;
          return (
            <button
              key={template.slug}
              type="button"
              onClick={() => onChange(template.slug)}
              className={cn(
                "relative rounded-xl border-2 p-3 text-left transition hover:shadow-md",
                selected ? "border-amber-500 ring-2 ring-amber-200" : "border-stone-200"
              )}
            >
              {selected && (
                <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <TemplatePreview
                slug={template.slug}
                schoolName={schoolName || "Your School"}
                accent={accent}
              />
              <p className="mt-2 text-sm font-semibold text-stone-900">{template.name}</p>
              <p className="text-xs text-stone-500 line-clamp-2">{template.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TemplatePreview({
  slug,
  schoolName,
  accent,
}: {
  slug: WebsiteTemplateSlug;
  schoolName: string;
  accent: string;
}) {
  const bar = { backgroundColor: accent };
  if (slug === "modern") {
    return (
      <div className="h-24 rounded-lg overflow-hidden border bg-slate-100">
        <div className="h-3 flex gap-1 px-2 items-center bg-white border-b">
          <div className="h-1.5 w-8 rounded" style={bar} />
          <span className="h-1 w-6 rounded bg-slate-200" />
        </div>
        <div className="h-14 flex items-center px-2 text-[8px] text-white font-medium" style={bar}>
          {schoolName}
        </div>
      </div>
    );
  }
  if (slug === "minimal") {
    return (
      <div className="h-24 rounded-lg border bg-white p-2 space-y-2">
        <div className="flex justify-between items-center">
          <div className="h-2 w-12 rounded bg-slate-300" />
          <span className="h-2 w-8 rounded" style={bar} />
        </div>
        <div className="h-8 rounded bg-slate-50" />
        <div className="h-4 w-2/3 rounded" style={{ ...bar, opacity: 0.3 }} />
      </div>
    );
  }
  if (slug === "compact") {
    return (
      <div className="h-24 rounded-lg border overflow-hidden">
        <div className="h-4" style={bar} />
        <div className="grid grid-cols-2 gap-1 p-1.5 bg-slate-50 h-20">
          <div className="rounded bg-white border" />
          <div className="rounded bg-white border" />
        </div>
      </div>
    );
  }
  return (
    <span className="h-24 rounded-lg border overflow-hidden">
      <div className="h-10 flex items-end p-2 text-[8px] text-white font-medium" style={bar}>
        {schoolName}
      </div>
      <div className="flex gap-1 p-1.5 bg-white">
        <div className="h-8 flex-1 rounded bg-slate-100" />
        <div className="h-8 flex-1 rounded bg-slate-100" />
        <div className="h-8 flex-1 rounded bg-slate-100" />
      </div>
    </span>
  );
}
