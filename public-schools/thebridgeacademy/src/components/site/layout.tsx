import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SiteContainer({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("site-container", className)}>{children}</div>;
}

export function SiteSection({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("site-section", className)}>
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
  titleClassName,
  dark,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        dark && "section-header-dark",
        className,
      )}
    >
      <span className="site-eyebrow">{eyebrow}</span>
      <h2
        className={cn(
          "site-heading mt-2 sm:mt-3",
          dark && "site-heading-on-dark",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {lead ? (
        <p className={cn("site-lead mt-3 sm:mt-4", dark && "site-lead-on-dark")}>
          {lead}
        </p>
      ) : null}
    </div>
  );
}

type SiteButtonVariant = "primary" | "secondary" | "ghost" | "whatsapp";

export function SiteButton({
  href,
  onClick,
  variant = "primary",
  className,
  children,
  fullWidthMobile = true,
  download,
}: {
  href?: string;
  onClick?: () => void;
  variant?: SiteButtonVariant;
  className?: string;
  children: ReactNode;
  fullWidthMobile?: boolean;
  download?: boolean;
}) {
  const classes = cn(
    "site-btn",
    variant === "primary" && "site-btn-primary",
    variant === "secondary" && "site-btn-secondary",
    variant === "ghost" && "site-btn-ghost",
    variant === "whatsapp" && "site-btn-whatsapp",
    fullWidthMobile && "w-full sm:w-auto",
    className,
  );

  if (href) {
    return (
      <a href={href} download={download} className={classes} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
