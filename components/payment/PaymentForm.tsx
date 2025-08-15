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
  DollarSign,
  Calendar,
  User,
  School,
  Sparkles,
  Loader2,
  Download,
} from "lucide-react";

interface PaymentFormProps {
  schoolCode: string;
  studentId: string;
  amount: number;
  feeType: string;
  term: string;
  academicYear: string;
  paymentMethod?: "mpesa" | "manual";
  phoneNumber?: string;
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

// Enhanced logging utility for frontend
const logPaymentForm = (
  stage: string,
  data: any,
  type: "info" | "success" | "error" | "warning" = "info"
) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    stage,
    type,
    data: typeof data === "object" ? JSON.stringify(data, null, 2) : data,
  };

  console.log(
    `🟡 [PAYMENT-FORM-${stage.toUpperCase()}] ${timestamp}:`,
    logData
  );
};

export function PaymentForm({
  schoolCode,
  studentId,
  amount,
  feeType,
  term,
  academicYear,
  paymentMethod: propPaymentMethod = "manual",
  phoneNumber: propPhoneNumber = "",
  onPaymentSuccess,
  onPaymentError,
  onStart,
  onComplete,
  isProcessing = false,
}: PaymentFormProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "manual">(
    propPaymentMethod
  );
  const [phoneNumber, setPhoneNumber] = useState(propPhoneNumber);
  const [transactionId, setTransactionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [progressStage, setProgressStage] = useState<string>("");

  // Update local state when props change
  useEffect(() => {
    setPaymentMethod(propPaymentMethod);
    setPhoneNumber(propPhoneNumber);
  }, [propPaymentMethod, propPhoneNumber]);

  logPaymentForm("COMPONENT_MOUNT", {
    schoolCode,
    studentId,
    amount,
    feeType,
    term,
    academicYear,
  });

  // Fetch student and school info on component mount
  useEffect(() => {
    const fetchInfo = async () => {
      logPaymentForm("FETCH_INFO_START", { schoolCode, studentId });

      try {
        setProgressStage("Fetching student information...");

        // Fetch student info
        const studentRes = await fetch(
          `/api/schools/${schoolCode}/students/${studentId}`
        );
        if (studentRes.ok) {
          const student = await studentRes.json();
          setStudentInfo(student);
          logPaymentForm("STUDENT_INFO_FETCHED", {
            studentId: student.id,
            studentName: student.user?.name,
            className: student.class?.name,
          });
        } else {
          logPaymentForm(
            "STUDENT_INFO_ERROR",
            { status: studentRes.status },
            "error"
          );
        }

        setProgressStage("Fetching school information...");

        // Fetch school info
        const schoolRes = await fetch(`/api/schools/${schoolCode}`);
        if (schoolRes.ok) {
          const school = await schoolRes.json();
          setSchoolInfo(school);
          logPaymentForm("SCHOOL_INFO_FETCHED", {
            schoolId: school.id,
            schoolName: school.name,
          });
        } else {
          logPaymentForm(
            "SCHOOL_INFO_ERROR",
            { status: schoolRes.status },
            "error"
          );
        }

        setProgressStage("");
      } catch (error) {
        logPaymentForm("FETCH_INFO_ERROR", error, "error");
        setProgressStage("");
      }
    };

    fetchInfo();
  }, [schoolCode, studentId]);

  const handlePayment = async () => {
    if (isProcessing) {
      logPaymentForm(
        "PAYMENT_BLOCKED",
        { reason: "Already processing" },
        "warning"
      );
      return;
    }

    // Validate M-Pesa requirements
    if (paymentMethod === "mpesa") {
      if (!phoneNumber || phoneNumber.trim() === "") {
        logPaymentForm(
          "MPESA_VALIDATION_ERROR",
          { error: "Phone number required for M-Pesa" },
          "error"
        );
        toast({
          title: "M-Pesa Payment Error",
          description: "Please enter a valid M-Pesa phone number",
          variant: "destructive",
        });
        return;
      }

      // Basic phone number validation for Kenya
      const phoneRegex = /^254[17]\d{8}$/;
      if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
        logPaymentForm(
          "MPESA_PHONE_VALIDATION_ERROR",
          { phoneNumber, error: "Invalid phone number format" },
          "error"
        );
        toast({
          title: "Invalid Phone Number",
          description:
            "Please enter a valid Kenyan phone number (e.g., 254700000000)",
          variant: "destructive",
        });
        return;
      }
    }

    logPaymentForm("PAYMENT_START", {
      amount: amount, // Use the amount prop directly
      paymentMethod,
      phoneNumber: paymentMethod === "mpesa" ? phoneNumber : undefined,
      feeType,
      term,
      academicYear,
    });

    // Validate required fields
    if (amount <= 0) {
      // Use the amount prop directly
      logPaymentForm(
        "VALIDATION_ERROR",
        { error: "Invalid amount", amount: amount }, // Use the amount prop directly
        "error"
      );
      toast({
        title: "Validation Error",
        description: "Payment amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgressStage(
      paymentMethod === "mpesa"
        ? "Initiating M-Pesa payment..."
        : "Initializing payment..."
    );
    onStart?.();

    try {
      setProgressStage(
        paymentMethod === "mpesa"
          ? "Preparing M-Pesa request..."
          : "Preparing payment request..."
      );

      const paymentRequest = {
        paymentType: paymentMethod,
        amount: amount, // Use the amount prop directly
        paymentMethod: paymentMethod,
        feeType,
        academicYear,
        term,
        description: `${feeType} - ${term} ${academicYear}`,
        referenceNumber: transactionId || undefined,
        receivedBy: "Parent Portal",
        ...(paymentMethod === "mpesa" && {
          phoneNumber: phoneNumber.replace(/\s/g, ""),
          mpesaRequestId: `MPESA_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        }),
      };

      logPaymentForm("PAYMENT_REQUEST_PREPARED", paymentRequest);

      setProgressStage(
        paymentMethod === "mpesa"
          ? "Sending M-Pesa request..."
          : "Sending payment to server..."
      );

      // Send payment request with proper academic year and term
      const response = await fetch(
        `/api/schools/${schoolCode}/students/${studentId}/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentRequest),
        }
      );

      logPaymentForm("PAYMENT_RESPONSE_RECEIVED", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response.json();
        logPaymentForm("PAYMENT_API_ERROR", errorData, "error");
        throw new Error(errorData.error || "Payment failed");
      }

      setProgressStage(
        paymentMethod === "mpesa"
          ? "Processing M-Pesa response..."
          : "Processing payment response..."
      );

      const result = await response.json();

      logPaymentForm("PAYMENT_SUCCESS", {
        paymentId: result.payment?.id,
        receiptNumber: result.payment?.receiptNumber,
        amount: result.payment?.amount,
        paymentMethod: result.payment?.paymentMethod,
      });

      // Create receipt data from the API response
      const receiptData: ReceiptData = {
        receiptNumber: result.payment.receiptNumber,
        paymentId: result.payment.id,
        studentId,
        schoolCode,
        amount: amount, // Use the amount prop directly
        paymentMethod: result.payment.paymentMethod,
        feeType,
        term,
        academicYear,
        reference: result.payment.referenceNumber,
        phoneNumber: paymentMethod === "mpesa" ? phoneNumber : undefined,
        transactionId:
          paymentMethod === "mpesa"
            ? result.payment.mpesaTransactionId
            : transactionId,
        status: "completed",
        issuedAt: new Date(),
        issuedBy: "Parent Portal",
        schoolName: result.payment.schoolName || schoolInfo?.name || "School",
        studentName:
          result.payment.studentName || studentInfo?.user?.name || "Student",
        currency: "KES",
        academicYearOutstandingAfter:
          result.payment.academicYearOutstandingAfter,
        termOutstandingAfter: result.payment.termOutstandingAfter,
      };

      setReceiptData(receiptData);
      setShowReceipt(true);
      setProgressStage(
        paymentMethod === "mpesa"
          ? "M-Pesa payment completed successfully!"
          : "Payment completed successfully!"
      );

      logPaymentForm("RECEIPT_CREATED", {
        receiptNumber: receiptData.receiptNumber,
        paymentId: receiptData.paymentId,
        paymentMethod: receiptData.paymentMethod,
      });

      const successMessage =
        paymentMethod === "mpesa"
          ? `M-Pesa payment of KES ${amount.toLocaleString()} completed successfully. Email notification will be sent to parent automatically.`
          : `Payment of KES ${amount.toLocaleString()} completed successfully. Email notification will be sent to parent automatically.`;

      toast({
        title:
          paymentMethod === "mpesa"
            ? "M-Pesa Payment Successful!"
            : "Payment Simulation Successful!",
        description: successMessage,
        variant: "default",
      });

      onPaymentSuccess?.(result.payment);
    } catch (error: any) {
      logPaymentForm(
        "PAYMENT_ERROR",
        {
          error: error.message,
          stack: error.stack,
          paymentMethod,
        },
        "error"
      );

      setProgressStage(
        paymentMethod === "mpesa" ? "M-Pesa payment failed" : "Payment failed"
      );

      const errorMessage =
        paymentMethod === "mpesa"
          ? `M-Pesa payment failed: ${error.message}`
          : `Payment failed: ${error.message}`;

      toast({
        title:
          paymentMethod === "mpesa"
            ? "M-Pesa Payment Failed"
            : "Payment Failed",
        description:
          errorMessage || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      onPaymentError?.(error.message);
    } finally {
      setIsLoading(false);
      onComplete?.();

      // Clear progress stage after a delay
      setTimeout(() => setProgressStage(""), 3000);
    }
  };

  const handleCloseReceipt = () => {
    logPaymentForm("RECEIPT_CLOSED", {
      receiptNumber: receiptData?.receiptNumber,
    });
    setShowReceipt(false);
    setReceiptData(null);
  };

  const downloadReceipt = () => {
    if (!receiptData) return;

    logPaymentForm("RECEIPT_DOWNLOAD", {
      receiptNumber: receiptData.receiptNumber,
    });

    // Create receipt content
    const receiptContent = `
RECEIPT

Receipt Number: ${receiptData.receiptNumber}
Payment ID: ${receiptData.paymentId}
Date: ${receiptData.issuedAt.toLocaleDateString()}
Time: ${receiptData.issuedAt.toLocaleTimeString()}

SCHOOL: ${receiptData.schoolName}
STUDENT: ${receiptData.studentName}
ADMISSION: ${studentInfo?.admissionNumber || "N/A"}

PAYMENT DETAILS:
Amount: KES ${receiptData.amount.toLocaleString()}
Payment Method: ${receiptData.paymentMethod}
Fee Type: ${receiptData.feeType}
Term: ${receiptData.term}
Academic Year: ${receiptData.academicYear}
Reference: ${receiptData.reference}

BALANCE AFTER PAYMENT:
Academic Year Outstanding: KES ${
      receiptData.academicYearOutstandingAfter?.toLocaleString() || "0"
    }
Term Outstanding: KES ${
      receiptData.termOutstandingAfter?.toLocaleString() || "0"
    }

Issued by: ${receiptData.issuedBy}
Status: ${receiptData.status}

---
This is a computer-generated receipt.
    `.trim();

    // Create and download file
    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${receiptData.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      {progressStage && (
        <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-700">{progressStage}</span>
        </div>
      )}

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Payment Summary</span>
          </CardTitle>
          <CardDescription>
            Review your payment details before proceeding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Summary */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="font-medium text-gray-900">Payment Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-gray-600">Amount:</div>
              <div className="font-semibold text-lg">
                KES {amount.toLocaleString()}
              </div>
              <div className="text-gray-600">Method:</div>
              <div className="font-medium">
                {paymentMethod === "mpesa" ? "M-Pesa" : "Manual Payment"}
              </div>
              <div className="text-gray-600">Fee Type:</div>
              <div className="font-medium">{feeType}</div>
              <div className="text-gray-600">Term:</div>
              <div className="font-medium">{term}</div>
              <div className="text-gray-600">Academic Year:</div>
              <div className="font-medium">{academicYear}</div>
              {paymentMethod === "mpesa" && phoneNumber && (
                <>
                  <div className="text-gray-600">Phone Number:</div>
                  <div className="font-medium">{phoneNumber}</div>
                </>
              )}
            </div>
          </div>

          {/* Transaction ID (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
            <Input
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction ID if available"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handlePayment}
            disabled={isLoading || isProcessing || amount <= 0} // Use the amount prop directly
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {paymentMethod === "mpesa"
                  ? "Processing M-Pesa..."
                  : "Processing Payment..."}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {paymentMethod === "mpesa"
                  ? "Pay with M-Pesa"
                  : "Process Payment"}
              </>
            )}
          </Button>

          {/* Email Notification Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                <strong>Email Notification:</strong> A payment confirmation email with receipt download link will be sent to the parent's email address.
              </span>
            </div>
          </div>

          {/* Simulation Notice */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                <strong>Payment Simulation:</strong> This is a test environment.
                No real money will be charged.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Payment Receipt</h3>
                <Button variant="ghost" size="sm" onClick={handleCloseReceipt}>
                  ×
                </Button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Receipt #:</div>
                  <div>{receiptData.receiptNumber}</div>
                  <div className="font-medium">Amount:</div>
                  <div>KES {receiptData.amount.toLocaleString()}</div>
                  <div className="font-medium">Method:</div>
                  <div>{receiptData.paymentMethod}</div>
                  <div className="font-medium">Status:</div>
                  <div className="text-green-600 font-medium">
                    {receiptData.status}
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <Button
                    onClick={downloadReceipt}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

