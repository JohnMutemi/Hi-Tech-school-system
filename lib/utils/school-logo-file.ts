/** File input `accept` — PNG listed first; extensions help Windows file dialogs. */
export const SCHOOL_LOGO_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp"

const LOGO_EXT = /\.(png|jpe?g|gif|webp)$/i

/**
 * True if the file is OK to use as a school logo (PNG, JPEG, GIF, WebP).
 * Accepts extension match when MIME is missing or wrong (common on Windows).
 */
export function isAcceptableSchoolLogoFile(file: File): boolean {
  const type = (file.type || "").toLowerCase()
  if (type.startsWith("image/")) return true
  if (!type || type === "application/octet-stream") return LOGO_EXT.test(file.name)
  return false
}
