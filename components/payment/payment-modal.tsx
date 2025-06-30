"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    
    // Generate receipt data
    const receipt = {
      receiptNumber: `RCP-${Date.now()}`,
      paymentId: paymentData.paymentId || `pay_${Date.now()}`,
      studentId,
      schoolCode,
      amount: customAmount,
      paymentMethod: paymentData.paymentMethod || 'mpesa',
      feeType,
      term,
      academicYear,
      reference: paymentData.reference || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      phoneNumber: paymentData.phoneNumber,
      transactionId: paymentData.transactionId,
      status: 'completed',
      issuedAt: new Date(),
      issuedBy: 'School System',
      schoolName: 'Demo School',
      studentName: 'Demo Student',
      currency: 'KES'
    };

    setGeneratedReceipt(receipt);
    onReceiptGenerated?.(receipt);
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

School: ${generatedReceipt.schoolName}
Receipt #: ${generatedReceipt.receiptNumber}

Student Information:
- Student ID: ${generatedReceipt.studentId}
- Student Name: ${generatedReceipt.studentName}

Payment Details:
- Fee Type: ${generatedReceipt.feeType}
- Term: ${generatedReceipt.term}
- Academic Year: ${generatedReceipt.academicYear}
- Payment Method: ${generatedReceipt.paymentMethod.toUpperCase()}
${generatedReceipt.phoneNumber ? `- Phone Number: ${generatedReceipt.phoneNumber}` : ''}
${generatedReceipt.transactionId ? `- Transaction ID: ${generatedReceipt.transactionId}` : ''}
- Reference: ${generatedReceipt.reference}
- Status: ${generatedReceipt.status.toUpperCase()}

Total Amount: ${generatedReceipt.currency} ${generatedReceipt.amount.toLocaleString()}

Issued on: ${generatedReceipt.issuedAt.toLocaleDateString()}
Issued by: ${generatedReceipt.issuedBy}

Thank you for your payment!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${generatedReceipt.receiptNumber}.txt`;
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
                <Label htmlFor="customAmount" className="text-xs">Enter Amount (KES)</Label>
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

          {/* Receipt Download */}
          {generatedReceipt && (
            <div className="border-t pt-2 mt-2">
              <div className="bg-green-50 p-2 rounded-md">
                <div className="flex items-center gap-1 mb-1">
                  <Receipt className="w-4 h-4 text-green-600" />
                  <h4 className="font-medium text-green-800 text-sm">Payment Completed!</h4>
                </div>
                <p className="text-xs text-green-700 mb-2">
                  Receipt #: {generatedReceipt.receiptNumber}
                </p>
                <Button onClick={handleDownloadReceipt} className="w-full h-8 text-xs">
                  <Download className="w-3 h-3 mr-1" />
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