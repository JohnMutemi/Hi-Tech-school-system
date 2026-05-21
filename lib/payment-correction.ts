import { canUndoPayment } from "@/lib/payment-undo";

export const PAYMENT_CORRECTION_MIN_REASON_LENGTH = 10;

/** Staff may correct only the latest payment, after the short undo window has passed. */
export function canCorrectPayment(
  paymentDate: Date | string,
  isLatestPayment: boolean
): boolean {
  return isLatestPayment && !canUndoPayment(paymentDate);
}

export function normalizeCorrectionReason(raw: unknown): string | null {
  const reason = typeof raw === "string" ? raw.trim() : "";
  if (reason.length < PAYMENT_CORRECTION_MIN_REASON_LENGTH) return null;
  return reason;
}
