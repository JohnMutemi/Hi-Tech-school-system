"use client";

import type { PublicSchoolPayload, WebsiteTemplateSlug } from "@/lib/school-website/types";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import {
  SiteHero,
  SiteAbout,
  SiteProgrammes,
  SiteGallery,
  SiteAdmissions,
  SiteNews,
  SiteContact,
} from "./sections";

export function SchoolPublicSite({ data }: { data: PublicSchoolPayload }) {
  const variant = data.websiteTemplateSlug as WebsiteTemplateSlug;

  if (variant === "modern") {
    return (
      <ModernLayout data={data} variant={variant} />
    );
  }
  if (variant === "compact") {
    return (
      <CompactLayout data={data} variant={variant} />
    );
  }
  if (variant === "minimal") {
    return (
      <MinimalLayout data={data} variant={variant} />
    );
  }
  return <ClassicLayout data={data} variant={variant} />;
}

function ClassicLayout({
  data,
  variant,
}: {
  data: PublicSchoolPayload;
  variant: WebsiteTemplateSlug;
}) {
  return (
    <>
      <SiteHeader data={data} />
      <main>
        <SiteHero data={data} variant={variant} />
        <div className="bg-white">
          <SiteAbout data={data} variant={variant} />
          <SiteProgrammes data={data} variant={variant} />
          <SiteGallery data={data} />
        </div>
        <SiteAdmissions data={data} variant={variant} />
        <SiteNews data={data} variant={variant} />
        <SiteContact data={data} />
      </main>
      <SiteFooter data={data} />
    </>
  );
}

function ModernLayout({
  data,
  variant,
}: {
  data: PublicSchoolPayload;
  variant: WebsiteTemplateSlug;
}) {
  return (
    <>
      <SiteHeader data={data} />
      <main className="bg-slate-50">
        <SiteHero data={data} variant={variant} />
        <SiteProgrammes data={data} variant={variant} />
        <SiteGallery data={data} />
        <SiteAbout data={data} variant={variant} />
        <SiteAdmissions data={data} variant={variant} />
        <SiteNews data={data} variant={variant} />
        <SiteContact data={data} />
      </main>
      <SiteFooter data={data} />
    </>
  );
}

function CompactLayout({
  data,
  variant,
}: {
  data: PublicSchoolPayload;
  variant: WebsiteTemplateSlug;
}) {
  return (
    <>
      <SiteHeader data={data} />
      <main>
        <SiteHero data={data} variant={variant} />
        <SiteAbout data={data} variant={variant} />
        <SiteAdmissions data={data} variant={variant} />
        <SiteProgrammes data={data} variant={variant} />
        <SiteGallery data={data} />
        <SiteContact data={data} />
        <SiteNews data={data} variant={variant} />
      </main>
      <SiteFooter data={data} />
    </>
  );
}

function MinimalLayout({
  data,
  variant,
}: {
  data: PublicSchoolPayload;
  variant: WebsiteTemplateSlug;
}) {
  return (
    <>
      <SiteHeader data={data} />
      <main>
        <div className="mx-auto max-w-4xl">
          <SiteHero data={data} variant={variant} />
          <SiteAbout data={data} variant={variant} />
        </div>
        <SiteGallery data={data} fullBleed />
        <div className="mx-auto max-w-4xl">
          <SiteAdmissions data={data} variant={variant} />
          <SiteNews data={data} variant={variant} />
          <SiteContact data={data} />
        </div>
      </main>
      <SiteFooter data={data} />
    </>
  );
}
