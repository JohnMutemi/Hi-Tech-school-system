/** Staff may reverse a mistaken payment within this window after recording. */
export const PAYMENT_UNDO_WINDOW_SECONDS = 300;
export const PAYMENT_UNDO_WINDOW_MS = PAYMENT_UNDO_WINDOW_SECONDS * 1000;

export function paymentUndoSecondsRemaining(paymentDate: Date | string): number {
  const recordedAt =
    paymentDate instanceof Date ? paymentDate.getTime() : new Date(paymentDate).getTime();
  const elapsed = Date.now() - recordedAt;
  return Math.max(0, Math.ceil((PAYMENT_UNDO_WINDOW_MS - elapsed) / 1000));
}

export function canUndoPayment(paymentDate: Date | string): boolean {
  return paymentUndoSecondsRemaining(paymentDate) > 0;
}
