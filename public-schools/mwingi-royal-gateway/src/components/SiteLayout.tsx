import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <section className="bg-gradient-ocean text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20 md:py-28">
        {eyebrow && (
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-mist sm:mb-4 sm:text-xs">{eyebrow}</div>
        )}
        <h1 className="font-serif text-3xl font-bold sm:text-4xl md:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-sm text-primary-foreground/80 sm:mt-5 sm:text-base md:text-lg">{intro}</p>}
      </div>
    </section>
  );
}
