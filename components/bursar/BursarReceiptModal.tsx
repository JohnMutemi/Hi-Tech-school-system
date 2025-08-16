import React from 'react';
import { EnhancedReceipt } from '@/components/ui/enhanced-receipt';

interface ReceiptData {
  receiptNumber: string;
  paymentId: string;
  studentId: string;
  schoolCode: string;
  amount: number;
  paymentMethod: string;
  feeType: string;
  term: string;
  academicYear: string;
  reference: string;
  phoneNumber?: string;
  transactionId?: string;
  status: string;
  issuedAt: Date;
  issuedBy: string;
  schoolName: string;
  studentName: string;
  admissionNumber: string;
  parentName?: string;
  currency: string;
  termOutstandingBefore?: number;
  termOutstandingAfter?: number;
  academicYearOutstandingBefore?: number;
  academicYearOutstandingAfter?: number;
  carryForward?: number;
}

interface BursarReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
}

export function BursarReceiptModal({ isOpen, onClose, receiptData }: BursarReceiptModalProps) {
  if (!receiptData) return null;

  return (
    <EnhancedReceipt
      receiptData={receiptData}
      onClose={onClose}
      showActions={isOpen}
    />
  );
}





