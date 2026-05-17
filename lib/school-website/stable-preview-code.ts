/**
 * Stable slug for superadmin "public URL" preview before the school exists.
 * (The real code on submit may still be randomly generated when the field is left blank.)
 */
export function stablePublicSitePreviewCode(name: string, explicitCode: string): string {
  const c = explicitCode.trim();
  if (c) return c.toLowerCase();
  const n = name.trim();
  if (!n) return "";
  const letters = n.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const prefix = letters.slice(0, 3) || "SCH";
  let h = 0;
  for (let i = 0; i < n.length; i++) {
    h = (h * 31 + n.charCodeAt(i)) >>> 0;
  }
  const suffix = 1000 + (h % 9000);
  return `${prefix}${suffix}`.toLowerCase();
}
