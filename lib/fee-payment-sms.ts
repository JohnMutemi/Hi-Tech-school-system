/**
 * Fee payment SMS is sent only when the school allows it and the student record is opted in.
 */
export function shouldSendParentFeePaymentSms(
  school: { feePaymentParentSmsEnabled?: boolean | null },
  student: { feePaymentSmsOptIn?: boolean | null }
): boolean {
  return Boolean(
    school?.feePaymentParentSmsEnabled === true && student?.feePaymentSmsOptIn === true
  );
}
