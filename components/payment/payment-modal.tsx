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
      <DialogContent className="sm:max-w-[380px] p-4 rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Pay School Fees</DialogTitle>
        </DialogHeader>
        <div className="mt-1 space-y-2">
          {/* Amount Selection */}
          <div className="space-y-0.5">
            <Label className="text-xs">Payment Amount</Label>
            <div className="flex gap-1">
              <Button
                variant={!showCustomAmount ? "default" : "outline"}
                onClick={() => setShowCustomAmount(false)}
                className="flex-1 h-8 px-2 text-xs"
              >
                Full: KES {amount.toLocaleString()}
              </Button>
              <Button
                variant={showCustomAmount ? "default" : "outline"}
                onClick={() => setShowCustomAmount(true)}
                className="flex-1 h-8 px-2 text-xs"
              >
                Custom
              </Button>
            </div>

            {showCustomAmount && (
              <div className="space-y-0.5">
                <Label htmlFor="customAmount" className="text-xs">
                  Enter Amount (KES)
                </Label>
                <Input
                  id="customAmount"
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  placeholder="Amount"
                  min="1"
                  max={amount}
                  className="h-8 px-2 text-xs"
                />
                <p className="text-xs text-gray-400">
                  Max: KES {amount.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <div className="pt-0.5">
            <PaymentForm
              studentId={studentId}
              schoolCode={schoolCode}
              amount={customAmount}
              feeType={feeType}
              term={term}
              academicYear={academicYear}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onStart={handlePaymentStart}
              onComplete={handlePaymentComplete}
              isProcessing={isProcessing}
            />
          </div>

          {/* Receipt Display & Download */}
          {generatedReceipt && (
            <div className="border-t pt-4 mt-2">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-800 text-sm">
                    Payment Completed!
                  </h4>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  Receipt #: {generatedReceipt.receiptNumber || "N/A"}
                </p>
                <Button
                  onClick={handleDownloadReceipt}
                  className="w-full h-8 text-xs"
                  variant="outline"
                >
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
