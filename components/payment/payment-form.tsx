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

// Enhanced logging utility for frontend
const logPaymentForm = (stage: string, data: any, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    stage,
    type,
    data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
  };
  
  console.log(`🟡 [PAYMENT-FORM-${stage.toUpperCase()}] ${timestamp}:`, logData);
};

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
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "manual">("manual");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [customAmount, setCustomAmount] = useState<number>(amount);
  const [useFullAmount, setUseFullAmount] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [progressStage, setProgressStage] = useState<string>('');

  logPaymentForm('COMPONENT_MOUNT', {
    schoolCode,
    studentId,
    amount,
    feeType,
    term,
    academicYear
  });

  // Fetch student and school info on component mount
  useEffect(() => {
    const fetchInfo = async () => {
      logPaymentForm('FETCH_INFO_START', { schoolCode, studentId });
      
      try {
        setProgressStage('Fetching student information...');
        
        // Fetch student info
        const studentRes = await fetch(`/api/schools/${schoolCode}/students/${studentId}`);
        if (studentRes.ok) {
          const student = await studentRes.json();
          setStudentInfo(student);
          logPaymentForm('STUDENT_INFO_FETCHED', {
            studentId: student.id,
            studentName: student.user?.name,
            className: student.class?.name
          });
        } else {
          logPaymentForm('STUDENT_INFO_ERROR', { status: studentRes.status }, 'error');
        }

        setProgressStage('Fetching school information...');
        
        // Fetch school info
        const schoolRes = await fetch(`/api/schools/${schoolCode}`);
        if (schoolRes.ok) {
          const school = await schoolRes.json();
          setSchoolInfo(school);
          logPaymentForm('SCHOOL_INFO_FETCHED', {
            schoolId: school.id,
            schoolName: school.name
          });
        } else {
          logPaymentForm('SCHOOL_INFO_ERROR', { status: schoolRes.status }, 'error');
        }

        setProgressStage('');
      } catch (error) {
        logPaymentForm('FETCH_INFO_ERROR', error, 'error');
        setProgressStage('');
      }
    };

    fetchInfo();
  }, [schoolCode, studentId]);

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomAmount(numValue);
    setUseFullAmount(false);
    
    logPaymentForm('AMOUNT_CHANGED', {
      oldAmount: amount,
      newAmount: numValue,
      useFullAmount: false
    });
  };

  const handleFullAmountClick = () => {
    setCustomAmount(amount);
    setUseFullAmount(true);
    
    logPaymentForm('FULL_AMOUNT_SELECTED', {
      amount,
      useFullAmount: true
    });
  };

  const handlePayment = async () => {
    if (isProcessing) {
      logPaymentForm('PAYMENT_BLOCKED', { reason: 'Already processing' }, 'warning');
      return;
    }

    logPaymentForm('PAYMENT_START', {
      amount: customAmount,
      paymentMethod,
      feeType,
      term,
      academicYear
    });

    // Validate required fields
    if (customAmount <= 0) {
      logPaymentForm('VALIDATION_ERROR', { error: 'Invalid amount', amount: customAmount }, 'error');
      toast({
        title: "Validation Error",
        description: "Payment amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgressStage('Initializing payment...');
    onStart?.();

    try {
      setProgressStage('Preparing payment request...');
      
      const paymentRequest = {
        paymentType: "manual",
        amount: customAmount,
        paymentMethod: "manual",
        feeType,
        academicYear,
        term,
        description: `${feeType} - ${term} ${academicYear}`,
        referenceNumber: transactionId || undefined,
        receivedBy: "Parent Portal",
      };

      logPaymentForm('PAYMENT_REQUEST_PREPARED', paymentRequest);

      setProgressStage('Sending payment to server...');
      
      // Send payment request with proper academic year and term
      const response = await fetch(`/api/schools/${schoolCode}/students/${studentId}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentRequest),
      });

      logPaymentForm('PAYMENT_RESPONSE_RECEIVED', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json();
        logPaymentForm('PAYMENT_API_ERROR', errorData, 'error');
        throw new Error(errorData.error || "Payment failed");
      }

      setProgressStage('Processing payment response...');
      
      const result = await response.json();
      
      logPaymentForm('PAYMENT_SUCCESS', {
        paymentId: result.payment?.id,
        receiptNumber: result.payment?.receiptNumber,
        amount: result.payment?.amount
      });
      
      // Create receipt data from the API response
      const receiptData: ReceiptData = {
        receiptNumber: result.payment.receiptNumber,
        paymentId: result.payment.id,
        studentId,
        schoolCode,
        amount: customAmount,
        paymentMethod: result.payment.paymentMethod,
        feeType,
        term,
        academicYear,
        reference: result.payment.referenceNumber,
        transactionId: transactionId || undefined,
        status: "completed",
        issuedAt: new Date(),
        issuedBy: "Parent Portal",
        schoolName: result.payment.schoolName || schoolInfo?.name || "School",
        studentName: result.payment.studentName || studentInfo?.user?.name || "Student",
        currency: "KES",
        academicYearOutstandingAfter: result.payment.academicYearOutstandingAfter,
        termOutstandingAfter: result.payment.termOutstandingAfter,
      };

      setReceiptData(receiptData);
      setShowReceipt(true);
      setProgressStage('Payment completed successfully!');
      
      logPaymentForm('RECEIPT_CREATED', {
        receiptNumber: receiptData.receiptNumber,
        paymentId: receiptData.paymentId
      });
      
      toast({
        title: "Payment Simulation Successful!",
        description: `Payment simulation of KES ${customAmount.toLocaleString()} completed successfully.`,
        variant: "default",
      });

      onPaymentSuccess?.(result.payment);
    } catch (error: any) {
      logPaymentForm('PAYMENT_ERROR', {
        error: error.message,
        stack: error.stack
      }, 'error');
      
      setProgressStage('Payment failed');
      
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      onPaymentError?.(error.message);
    } finally {
      setIsLoading(false);
      onComplete?.();
      
      // Clear progress stage after a delay
      setTimeout(() => setProgressStage(''), 3000);
    }
  };

  const handleCloseReceipt = () => {
    logPaymentForm('RECEIPT_CLOSED', { receiptNumber: receiptData?.receiptNumber });
    setShowReceipt(false);
    setReceiptData(null);
  };

  const downloadReceipt = () => {
    if (!receiptData) return;
    
    logPaymentForm('RECEIPT_DOWNLOAD', { receiptNumber: receiptData.receiptNumber });
    
    // Create receipt content
    const receiptContent = `
RECEIPT

Receipt Number: ${receiptData.receiptNumber}
Payment ID: ${receiptData.paymentId}
Date: ${receiptData.issuedAt.toLocaleDateString()}
Time: ${receiptData.issuedAt.toLocaleTimeString()}

SCHOOL: ${receiptData.schoolName}
STUDENT: ${receiptData.studentName}
ADMISSION: ${studentInfo?.admissionNumber || 'N/A'}

PAYMENT DETAILS:
Amount: KES ${receiptData.amount.toLocaleString()}
Payment Method: ${receiptData.paymentMethod}
Fee Type: ${receiptData.feeType}
Term: ${receiptData.term}
Academic Year: ${receiptData.academicYear}
Reference: ${receiptData.reference}

BALANCE AFTER PAYMENT:
Academic Year Outstanding: KES ${receiptData.academicYearOutstandingAfter?.toLocaleString() || '0'}
Term Outstanding: KES ${receiptData.termOutstandingAfter?.toLocaleString() || '0'}

Issued by: ${receiptData.issuedBy}
Status: ${receiptData.status}

---
This is a computer-generated receipt.
    `.trim();

    // Create and download file
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Payment Details</span>
          </CardTitle>
          <CardDescription>
            Complete your fee payment using the payment simulation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount Section */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (KES)</Label>
            <div className="flex space-x-2">
              <Input
                id="amount"
                type="number"
                value={customAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount"
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFullAmountClick}
                disabled={isLoading || useFullAmount}
                className="whitespace-nowrap"
              >
                Full Amount
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Outstanding: KES {amount.toLocaleString()} | 
              Custom: KES {customAmount.toLocaleString()}
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={paymentMethod === "manual" ? "default" : "outline"}
                onClick={() => setPaymentMethod("manual")}
                disabled={isLoading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Manual Payment
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "mpesa" ? "default" : "outline"}
                onClick={() => setPaymentMethod("mpesa")}
                disabled={isLoading}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-2" />
                M-Pesa (Disabled)
              </Button>
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

          {/* Payment Summary */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <h4 className="font-medium">Payment Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Amount:</div>
              <div className="font-medium">KES {customAmount.toLocaleString()}</div>
              <div>Method:</div>
              <div className="font-medium">{paymentMethod === "manual" ? "Manual Payment" : "M-Pesa"}</div>
              <div>Fee Type:</div>
              <div className="font-medium">{feeType}</div>
              <div>Term:</div>
              <div className="font-medium">{term}</div>
              <div>Academic Year:</div>
              <div className="font-medium">{academicYear}</div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handlePayment}
            disabled={isLoading || isProcessing || customAmount <= 0}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Process Payment Simulation
              </>
            )}
          </Button>

          {/* Simulation Notice */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                <strong>Payment Simulation:</strong> This is a test environment. No real money will be charged.
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseReceipt}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Receipt #:</div>
                  <div>{receiptData.receiptNumber}</div>
                  <div className="font-medium">Amount:</div>
                  <div>KES {receiptData.amount.toLocaleString()}</div>
                  <div className="font-medium">Date:</div>
                  <div>{receiptData.issuedAt.toLocaleDateString()}</div>
                  <div className="font-medium">Time:</div>
                  <div>{receiptData.issuedAt.toLocaleTimeString()}</div>
                  <div className="font-medium">Student:</div>
                  <div>{receiptData.studentName}</div>
                  <div className="font-medium">School:</div>
                  <div>{receiptData.schoolName}</div>
                  <div className="font-medium">Term Outstanding:</div>
                  <div>KES {receiptData.termOutstandingAfter?.toLocaleString() || '0'}</div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={downloadReceipt}
                  variant="outline"
                  className="flex-1"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={handleCloseReceipt}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
