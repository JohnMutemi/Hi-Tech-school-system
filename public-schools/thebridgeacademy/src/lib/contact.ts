/** Shared contact details for The Bridge Academy public site */
export const SCHOOL_PHONE_DISPLAY = "0716 941 940";
export const SCHOOL_PHONE_TEL = "+254716941940";
export const SCHOOL_PHONE_WHATSAPP = "254716941940";
export const SCHOOL_EMAIL = "thebridgeacademy@gmail.com";

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hello, I'd like to leave a message for The Bridge Academy administration.";

export function whatsAppUrl(message = WHATSAPP_DEFAULT_MESSAGE): string {
  return `https://wa.me/${SCHOOL_PHONE_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function telUrl(): string {
  return `tel:${SCHOOL_PHONE_TEL}`;
}

export function mailtoUrl(subject?: string): string {
  const q = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${SCHOOL_EMAIL}${q}`;
}
