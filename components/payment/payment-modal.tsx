"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentForm } from "./payment-form";
import { toast } from "sonner";
import { Download, Receipt } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  schoolCode: string;
  amount: number;
  feeType: string;
  term: string;
  academicYear: string;
  onReceiptGenerated?: (receipt: any) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  studentId,
  schoolCode,
  amount,
  feeType,
  term,
  academicYear,
  onReceiptGenerated,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [customAmount, setCustomAmount] = useState(amount);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);

  const handlePaymentSuccess = (paymentData: any) => {
    toast.success("Payment processed successfully!");
    // Use only backend-provided receipt data
    setGeneratedReceipt(paymentData);
    onReceiptGenerated?.(paymentData);
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
    setIsProcessing(false);
  };

  const handlePaymentStart = () => {
    setIsProcessing(true);
  };

  const handlePaymentComplete = () => {
    setIsProcessing(false);
  };

  const handleDownloadReceipt = () => {
    if (!generatedReceipt) return;

    const receiptContent = `
Payment Receipt

School: ${generatedReceipt.schoolName || "N/A"}
Receipt #: ${generatedReceipt.receiptNumber || "N/A"}

Student Information:
- Student ID: ${generatedReceipt.studentId || "N/A"}
- Student Name: ${generatedReceipt.studentName || "N/A"}

Payment Details:
- Fee Type: ${generatedReceipt.feeType || generatedReceipt.description || "N/A"}
- Term: ${generatedReceipt.term || "N/A"}
- Academic Year: ${generatedReceipt.academicYear || "N/A"}
- Payment Method: ${(generatedReceipt.paymentMethod || "").toUpperCase()}
${
  generatedReceipt.phoneNumber
    ? `- Phone Number: ${generatedReceipt.phoneNumber}`
    : ""
}
${
  generatedReceipt.transactionId
    ? `- Transaction ID: ${generatedReceipt.transactionId}`
    : ""
}
- Reference: ${
      generatedReceipt.reference || generatedReceipt.referenceNumber || "N/A"
    }
- Status: ${(generatedReceipt.status || "").toUpperCase()}

Total Amount: ${generatedReceipt.currency || "KES"} ${(
      generatedReceipt.amount || 0
    ).toLocaleString()}

Issued on: ${
      generatedReceipt.issuedAt
        ? new Date(generatedReceipt.issuedAt).toLocaleDateString()
        : "N/A"
    }
Issued by: ${generatedReceipt.issuedBy || "N/A"}

Thank you for your payment!
    `;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${generatedReceipt.receiptNumber || "N/A"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Receipt downloaded successfully!");
  };

  const handleClose = () => {
    setGeneratedReceipt(null);
    setCustomAmount(amount);
    setShowCustomAmount(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pay School Fees</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {/* Amount Selection */}
          <div className="space-y-2">
            <Label>Payment Amount</Label>
            <div className="flex gap-2">
              <Button
                variant={!showCustomAmount ? "default" : "outline"}
                onClick={() => setShowCustomAmount(false)}
                className="flex-1"
              >
                Full Amount: KES {amount.toLocaleString()}
              </Button>
              <Button
                variant={showCustomAmount ? "default" : "outline"}
                onClick={() => setShowCustomAmount(true)}
                className="flex-1"
              >
                Custom Amount
              </Button>
            </div>

            {showCustomAmount && (
              <div className="space-y-2">
                <Label htmlFor="customAmount">Enter Amount (KES)</Label>
                <Input
                  id="customAmount"
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  min="1"
                  max={amount}
                />
                <p className="text-sm text-gray-500">
                  Maximum amount: KES {amount.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <PaymentForm
            studentId={studentId}
            schoolCode={schoolCode}
            amount={customAmount}
            feeType={feeType}
            term={term}
            academicYear={academicYear}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onStart={handlePaymentStart}
            onComplete={handlePaymentComplete}
            isProcessing={isProcessing}
          />

          {/* Receipt Download */}
          {generatedReceipt && (
            <div className="border-t pt-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-800">
                    Payment Completed!
                  </h4>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  Receipt #: {generatedReceipt.receiptNumber || "N/A"}
                </p>
                <Button onClick={handleDownloadReceipt} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
