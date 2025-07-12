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
import { Download, Receipt, DollarSign, CreditCard, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    
    // Call the callback to refresh parent data
    if (onReceiptGenerated) {
      onReceiptGenerated(paymentData);
    }
    
    // Auto-close modal after a short delay
    setTimeout(() => {
      handleClose();
    }, 3000);
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

  const handleAmountChange = (newAmount: number) => {
    setCustomAmount(Math.min(newAmount, amount));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-6 rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay School Fees
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* Payment Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Fee Type:</span>
                  <span className="text-sm text-blue-900">{feeType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Term:</span>
                  <Badge variant="outline" className="text-blue-800 border-blue-300">
                    {term}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Academic Year:</span>
                  <span className="text-sm text-blue-900">{academicYear}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Current Term Due:</span>
                  <span className="text-lg font-bold text-blue-900">
                    KES {amount.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-700">
                    <strong>Payment Policy:</strong> You can pay any amount for the current term. 
                    If you pay more than the current term amount, the excess will be automatically 
                    applied to the next term's balance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Payment Amount</Label>
            
                          <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={!showCustomAmount ? "default" : "outline"}
                  onClick={() => {
                    setShowCustomAmount(false);
                    setCustomAmount(amount);
                  }}
                  className="h-12 flex flex-col items-center justify-center"
                >
                  <DollarSign className="h-5 w-5 mb-1" />
                  <span className="text-sm">Pay in Full</span>
                  <span className="text-xs opacity-80">
                    KES {amount.toLocaleString()}
                  </span>
                </Button>
                
                <Button
                  variant={showCustomAmount ? "default" : "outline"}
                  onClick={() => setShowCustomAmount(true)}
                  className="h-12 flex flex-col items-center justify-center"
                >
                  <CreditCard className="h-5 w-5 mb-1" />
                  <span className="text-sm">Partial Payment</span>
                  <span className="text-xs opacity-80">Custom Amount</span>
                </Button>
              </div>
              
              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Method</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manual Payment (Simulation)
                  </Button>
                  {/* M-Pesa integration commented out for simulation
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled
                    title="M-Pesa integration requires valid credentials"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    M-Pesa (Disabled)
                  </Button>
                  */}
                </div>
                <p className="text-xs text-gray-500">
                  This is a payment simulation for testing purposes. No real money will be charged.
                </p>
              </div>

            {showCustomAmount && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="customAmount" className="text-sm font-medium">
                    Enter Amount (KES)
                  </Label>
                  <Input
                    id="customAmount"
                    type="number"
                    value={customAmount}
                    onChange={(e) => handleAmountChange(Number(e.target.value) || 0)}
                    placeholder="Enter amount"
                    min="1"
                    max={amount}
                    className="h-10"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Minimum: KES 1</span>
                    <span>Maximum: KES {amount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Amount to pay:</span>
                  <span className="font-semibold text-lg">
                    KES {customAmount.toLocaleString()}
                  </span>
                </div>
                
                {customAmount < amount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Remaining balance:</span>
                    <span className="font-semibold text-orange-600">
                      KES {(amount - customAmount).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Form */}
          <div className="pt-2">
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
            <div className="border-t pt-4 mt-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-800 text-base">
                    Payment Completed Successfully!
                  </h4>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Receipt #:</span> {generatedReceipt.receiptNumber || "N/A"}
                  </p>
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Amount:</span> KES {(generatedReceipt.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Status:</span> {(generatedReceipt.status || "").toUpperCase()}
                  </p>
                </div>
                <Button
                  onClick={handleDownloadReceipt}
                  className="w-full h-10"
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
