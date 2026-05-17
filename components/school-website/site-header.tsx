"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { PublicSchoolPayload } from "@/lib/school-website/types";

const NAV = [
  { href: "#about", label: "About" },
  { href: "#programmes", label: "Programmes" },
  { href: "#gallery", label: "Gallery" },
  { href: "#admissions", label: "Admissions" },
  { href: "#news", label: "News" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader({ data }: { data: PublicSchoolPayload }) {
  const [open, setOpen] = useState(false);
  const homeHref = data.customDomain ? "/" : `/site/${data.schoolCode}`;

  const visibleNav = NAV.filter((item) => {
    if (item.href === "#news") {
      return data.sections.some((s) => s.sectionKey === "news" && s.isVisible);
    }
    return data.sections.some(
      (s) => s.sectionKey === item.href.replace("#", "") && s.isVisible
    );
  });

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={homeHref} className="flex items-center gap-3 min-w-0">
          {data.logo ? (
            <img src={data.logo} alt="" className="h-10 w-10 object-contain rounded" />
          ) : (
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: "var(--school-primary)" }}
            >
              {data.name.charAt(0)}
            </span>
          )}
          <span className="font-semibold text-slate-900 truncate">{data.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {visibleNav.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-[var(--school-primary)]">
              {item.label}
            </a>
          ))}
          <a
            href={data.staffLoginUrl}
            className="rounded-lg border border-[var(--school-primary)] px-3 py-1.5 text-[var(--school-primary)] hover:bg-[var(--school-primary-soft)]"
          >
            Staff login
          </a>
        </nav>

        <button
          type="button"
          className="md:hidden p-2 text-slate-600"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t px-4 py-3 flex flex-col gap-2 text-sm font-medium">
          {visibleNav.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="py-2">
              {item.label}
            </a>
          ))}
          <a href={data.staffLoginUrl} className="py-2 text-[var(--school-primary)] font-semibold">
            Staff login
          </a>
        </nav>
      )}
    </header>
  );
}
