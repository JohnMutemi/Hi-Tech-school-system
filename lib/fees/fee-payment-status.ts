/** How a student lines up against billable fees for the current bursar view. */
export type FeePaymentStatus =
  | 'no_fee'
  | 'fully_paid'
  | 'partial'
  | 'outstanding'
  | 'payment_on_file'
  | 'error';

export function deriveFeePaymentStatus(
  totalFeeRequired: number,
  totalPaid: number,
  balance: number,
  options?: { calculationFailed?: boolean }
): FeePaymentStatus {
  if (options?.calculationFailed) return 'error';

  const required = Number(totalFeeRequired) || 0;
  const paid = Number(totalPaid) || 0;
  const owed = Number(balance) || 0;

  if (required <= 0) {
    if (paid > 0) return 'payment_on_file';
    return 'no_fee';
  }
  if (owed <= 0) return 'fully_paid';
  if (paid > 0) return 'partial';
  return 'outstanding';
}

export function feePaymentStatusLabel(status: FeePaymentStatus): string {
  switch (status) {
    case 'no_fee':
      return 'No fee set';
    case 'fully_paid':
      return 'Fully paid';
    case 'partial':
      return 'Partially paid';
    case 'outstanding':
      return 'Outstanding';
    case 'payment_on_file':
      return 'Payment on file';
    case 'error':
      return 'Fee unavailable';
    default:
      return 'Unknown';
  }
}

export function feePaymentStatusBadgeClass(status: FeePaymentStatus): string {
  switch (status) {
    case 'no_fee':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'fully_paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'partial':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    case 'outstanding':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'payment_on_file':
      return 'bg-blue-100 text-blue-900 border-blue-200';
    case 'error':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}
