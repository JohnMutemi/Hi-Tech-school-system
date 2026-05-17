import type { CSSProperties } from "react";
import { getSchoolThemeTokens } from "@/lib/utils/school-theme";

export function schoolWebsiteCssVars(colorTheme: string): CSSProperties {
  const tokens = getSchoolThemeTokens(colorTheme);
  return {
    "--school-primary": tokens.primary,
    "--school-primary-dark": tokens.primaryDark,
    "--school-primary-light": tokens.primaryLight,
    "--school-primary-soft": tokens.primarySoft,
    "--school-border": tokens.border,
  } as CSSProperties;
}
