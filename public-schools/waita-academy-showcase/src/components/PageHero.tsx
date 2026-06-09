import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
  variant?: "solid" | "image";
  imageSrc?: string;
  imageAlt?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  variant = "solid",
  imageSrc,
  imageAlt = "",
}: PageHeroProps) {
  if (variant === "image" && imageSrc) {
    return (
      <section className="relative min-h-[50vh] sm:min-h-[55vh] flex items-end text-primary-foreground overflow-hidden">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grain opacity-30" />
        <div className="relative site-container pb-10 sm:pb-14 pt-28 sm:pt-32 w-full">
          <span className="site-eyebrow site-eyebrow-on-dark">{eyebrow}</span>
          <h1 className="mt-3 site-heading-lg text-primary-foreground text-balance max-w-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-primary-foreground/85 leading-relaxed">
              {description}
            </p>
          )}
          {children}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-primary text-primary-foreground">
      <div className="site-container py-14 sm:py-20">
        <span className="site-eyebrow site-eyebrow-on-dark">{eyebrow}</span>
        <h1 className="mt-3 site-heading-lg text-primary-foreground text-balance max-w-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-primary-foreground/85 leading-relaxed">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
