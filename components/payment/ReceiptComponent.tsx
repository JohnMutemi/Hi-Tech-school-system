"use client";

import React from "react";
import { EnhancedReceipt } from "@/components/ui/enhanced-receipt";

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
  parentName: string;
  currency: string;
  termOutstandingBefore: number;
  termOutstandingAfter: number;
  academicYearOutstandingBefore: number;
  academicYearOutstandingAfter: number;
  carryForward?: number;
}

interface ReceiptComponentProps {
  receiptData: ReceiptData;
  onClose?: () => void;
}

const paperSizes = {
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 }
};

function ReceiptComponent({ receiptData, onClose }: ReceiptComponentProps) {
  return (
    <EnhancedReceipt
      receiptData={receiptData}
      onClose={onClose}
      showActions={true}
    />
  );
}

export default ReceiptComponent;
