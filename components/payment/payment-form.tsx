"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  CreditCard,
  Upload,
  CheckCircle,
  AlertCircle,
  Receipt,
} from "lucide-react";

interface PaymentFormProps {
  schoolCode: string;
  studentId: string;
  amount: number;
  feeType: string;
  term: string;
  academicYear: string;
  onPaymentSuccess?: (payment: any) => void;
  onPaymentError?: (error: string) => void;
  onStart?: () => void;
  onComplete?: () => void;
  isProcessing?: boolean;
}

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
  currency: string;
  paymentBreakdown?: {
    term: string;
    year: string;
    applied: number;
    total: number;
    paid: number;
    outstanding: number;
    status: string;
  }[];
  currentTermBalance?: number;
  carryForward?: number;
  balance?: number;
  academicYearOutstandingAfter?: number;
  termOutstandingAfter?: number;
}

export function PaymentForm({
  schoolCode,
  studentId,
  amount,
  feeType,
  term,
  academicYear,
  onPaymentSuccess,
  onPaymentError,
  onStart,
  onComplete,
  isProcessing = false,
}: PaymentFormProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "manual">(
    "mpesa"
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [feeSummary, setFeeSummary] = useState<any>(null);
  const [currentTermDue, setCurrentTermDue] = useState<number>(0);
  const [totalOutstanding, setTotalOutstanding] = useState<number>(0);
  const [academicYearOutstandingBefore, setAcademicYearOutstandingBefore] =
    useState<number | null>(null);
  const [termOutstandingBefore, setTermOutstandingBefore] = useState<
    number | null
  >(null);

  const handlePayment = async () => {
    if (isProcessing) return;

    // Validate required fields
    if (paymentMethod === "mpesa" && !phoneNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Phone number is required for M-Pesa payments",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "manual" && !transactionId.trim()) {
      toast({
        title: "Validation Error",
        description: "Transaction ID is required for manual payments",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    onStart?.();

    try {
      // Fetch running balance from fee-statement just before payment
      const statementRes = await fetch(
        `/api/schools/${schoolCode}/students/${studentId}/fee-statement`
      );
      const statement = await statementRes.json();
      const lastBalance =
        statement.length > 0 ? statement[statement.length - 1].balance || 0 : 0;
      const academicYearOutstandingBefore = lastBalance;

      // Optionally, still fetch /fees for term breakdown
      const res = await fetch(
        `/api/schools/${schoolCode}/students/${studentId}/fees`
      );
      const data = await res.json();
      const currentTermSummary = data.termBalances.find(
        (f: any) => f.term === term && String(f.year) === String(academicYear)
      );
      const termOutstandingBefore = currentTermSummary?.balance || 0;
      // Call the real payment API
      const response = await fetch(`/api/schools/${schoolCode}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          amount,
          paymentMethod,
          feeType,
          term,
          academicYear,
          phoneNumber: paymentMethod === "mpesa" ? phoneNumber : undefined,
          transactionId: paymentMethod === "manual" ? transactionId : undefined,
          description: `${feeType} - ${term} ${academicYear}`,
          academicYearOutstandingBefore,
          termOutstandingBefore,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment failed");
      }

      const result = await response.json();
      const paymentData = result.payment;

      // Use only backend-provided data for the receipt
      setReceiptData(paymentData);
      setShowReceipt(true);

      toast({
        title: "Payment Successful!",
        description: `Payment of KES ${amount.toLocaleString()} processed successfully. Receipt #${
          paymentData.receiptNumber || "N/A"
        }`,
      });

      onPaymentSuccess?.(paymentData);
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Payment processing failed";

      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });

      onPaymentError?.(errorMessage);
    } finally {
      setIsLoading(false);
      onComplete?.();
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setReceiptData(null);
  };

  // Fetch latest fee summary after payment
  useEffect(() => {
    if (showReceipt && receiptData) {
      fetch(`/api/schools/${schoolCode}/students/${studentId}/fees`)
        .then((res) => res.json())
        .then((data) => {
          setFeeSummary(data);
          // Find current term due
          const currentTermSummary = data.termBalances.find(
            (f: any) =>
              f.term === receiptData.term &&
              String(f.year) === String(receiptData.academicYear)
          );
          setCurrentTermDue(currentTermSummary?.balance || 0);
          setTotalOutstanding(data.academicYearOutstanding || 0);
        });
    }
  }, [showReceipt, receiptData, schoolCode, studentId]);

  if (showReceipt && receiptData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-xl font-bold">
            {receiptData.schoolName}
          </CardTitle>
          <p className="text-sm text-gray-600">Payment Receipt</p>
          <p className="text-xs text-gray-500">
            Receipt #: {receiptData.receiptNumber}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Student Name:</span>
              <p>{receiptData.studentName}</p>
            </div>
            <div>
              <span className="font-medium">Admission No.:</span>
              <p>{receiptData.studentId}</p>
            </div>
            <div>
              <span className="font-medium">Academic Year:</span>
              <p>{receiptData.academicYear}</p>
            </div>
            <div>
              <span className="font-medium">Term:</span>
              <p>{receiptData.term}</p>
            </div>
            <div>
              <span className="font-medium">Payment Method:</span>
              <p className="uppercase">{receiptData.paymentMethod}</p>
            </div>
            <div>
              <span className="font-medium">Reference:</span>
              <p className="text-xs">{receiptData.reference}</p>
            </div>
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount Paid:</span>
              <span>KES {receiptData.amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-md">
              <span>Total Outstanding (Academic Year):</span>
              <span
                className={
                  (receiptData.academicYearOutstandingAfter ?? 0) > 0
                    ? "text-red-600"
                    : "text-green-600"
                }
              >
                KES{" "}
                {receiptData.academicYearOutstandingAfter?.toLocaleString() ??
                  "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center text-md">
              <span>Current Term Due:</span>
              <span
                className={
                  (receiptData.termOutstandingAfter ?? 0) > 0
                    ? "text-red-600"
                    : "text-green-600"
                }
              >
                KES{" "}
                {receiptData.termOutstandingAfter?.toLocaleString() ?? "N/A"}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>
              Issued on:{" "}
              {receiptData.issuedAt
                ? new Date(receiptData.issuedAt).toLocaleDateString()
                : "N/A"}
            </p>
            <p>Issued by: {receiptData.issuedBy}</p>
            <p className="font-medium">Thank you for your payment!</p>
          </div>
          <Button onClick={handleCloseReceipt} className="w-full">
            Close Receipt
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Make Payment
        </CardTitle>
        <CardDescription>Amount: KES {amount.toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Method Selection */}
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select
            value={paymentMethod}
            onValueChange={(value: "mpesa" | "manual") =>
              setPaymentMethod(value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mpesa">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  M-Pesa
                </div>
              </SelectItem>
              <SelectItem value="manual">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Manual Payment
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment Method Specific Fields */}
        {paymentMethod === "mpesa" ? (
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number (M-Pesa)</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="254700000000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            <p className="text-sm text-gray-500">
              Enter the phone number registered with M-Pesa
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID</Label>
            <Input
              id="transactionId"
              type="text"
              placeholder="Enter transaction ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              required
            />
            <p className="text-sm text-gray-500">
              Enter the transaction ID from your payment
            </p>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Payment Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Fee Type:</span>
              <span>{feeType}</span>
            </div>
            <div className="flex justify-between">
              <span>Term:</span>
              <span>{term}</span>
            </div>
            <div className="flex justify-between">
              <span>Academic Year:</span>
              <span>{academicYear}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-1">
              <span>Total Amount:</span>
              <span>KES {amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handlePayment}
          disabled={isLoading || isProcessing}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </>
          ) : (
            <>
              <Receipt className="w-4 h-4 mr-2" />
              Pay Now
            </>
          )}
        </Button>

        {isProcessing && (
          <div className="text-center text-sm text-gray-500">
            Payment is being processed...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
