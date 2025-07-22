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
import {
  Download,
  Receipt,
  DollarSign,
  CreditCard,
  Phone,
  Smartphone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const [paymentAmount, setPaymentAmount] = useState(amount);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");
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
    setPaymentAmount(amount);
    setPaymentMethod("mpesa");
    setPhoneNumber("");
    onClose();
  };

  const handleAmountChange = (value: string) => {
    const numValue = Number(value) || 0;
    setPaymentAmount(Math.min(Math.max(numValue, 1), amount));
  };

  const handlePayInFull = () => {
    setPaymentAmount(amount);
  };

  const handlePayPartial = () => {
    setPaymentAmount(Math.floor(amount / 2)); // Default to half payment
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
                  <span className="text-sm font-medium text-blue-800">
                    Fee Type:
                  </span>
                  <span className="text-sm text-blue-900">{feeType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    Term:
                  </span>
                  <Badge
                    variant="outline"
                    className="text-blue-800 border-blue-300"
                  >
                    {term}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    Academic Year:
                  </span>
                  <span className="text-sm text-blue-900">{academicYear}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    Term Due:
                  </span>
                  <span className="text-lg font-bold text-blue-900">
                    KES {amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Amount */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Payment Amount</Label>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handlePayInFull}
                className="h-12 flex flex-col items-center justify-center"
              >
                <DollarSign className="h-5 w-5 mb-1" />
                <span className="text-sm">Pay in Full</span>
                <span className="text-xs opacity-80">
                  KES {amount.toLocaleString()}
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={handlePayPartial}
                className="h-12 flex flex-col items-center justify-center"
              >
                <CreditCard className="h-5 w-5 mb-1" />
                <span className="text-sm">Pay Half</span>
                <span className="text-xs opacity-80">
                  KES {Math.floor(amount / 2).toLocaleString()}
                </span>
              </Button>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="paymentAmount" className="text-sm font-medium">
                Custom Amount (KES)
              </Label>
              <Input
                id="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
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

            {/* Amount Summary */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Amount to pay:</span>
                <span className="font-semibold text-lg">
                  KES {paymentAmount.toLocaleString()}
                </span>
              </div>

              {paymentAmount < amount && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Remaining balance:</span>
                  <span className="font-semibold text-orange-600">
                    KES {(amount - paymentAmount).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Payment Method</Label>

            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="mpesa" id="mpesa" />
                  <Label
                    htmlFor="mpesa"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">M-Pesa</div>
                      <div className="text-xs text-gray-500">
                        Pay with M-Pesa
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label
                    htmlFor="manual"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Manual Payment</div>
                      <div className="text-xs text-gray-500">
                        Simulation mode
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {/* M-Pesa Phone Number */}
            {paymentMethod === "mpesa" && (
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  M-Pesa Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., 254700000000"
                  className="h-10"
                />
                <p className="text-xs text-gray-500">
                  Enter the phone number registered with M-Pesa
                </p>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <div className="pt-2">
            <PaymentForm
              studentId={studentId}
              schoolCode={schoolCode}
              amount={paymentAmount}
              feeType={feeType}
              term={term}
              academicYear={academicYear}
              paymentMethod={paymentMethod}
              phoneNumber={phoneNumber}
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
                    <span className="font-medium">Receipt #:</span>{" "}
                    {generatedReceipt.receiptNumber || "N/A"}
                  </p>
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Amount:</span> KES{" "}
                    {(generatedReceipt.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Method:</span>{" "}
                    {(generatedReceipt.paymentMethod || "").toUpperCase()}
                  </p>
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Status:</span>{" "}
                    {(generatedReceipt.status || "").toUpperCase()}
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
