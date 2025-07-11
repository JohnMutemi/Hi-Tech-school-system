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
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "manual">("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [customAmount, setCustomAmount] = useState<number>(amount);
  const [useFullAmount, setUseFullAmount] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  // Fetch student and school info on component mount
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        // Fetch student info
        const studentRes = await fetch(`/api/schools/${schoolCode}/students/${studentId}`);
        if (studentRes.ok) {
          const student = await studentRes.json();
          setStudentInfo(student);
        }

        // Fetch school info
        const schoolRes = await fetch(`/api/schools/${schoolCode}`);
        if (schoolRes.ok) {
          const school = await schoolRes.json();
          setSchoolInfo(school);
        }
      } catch (error) {
        console.error("Error fetching info:", error);
      }
    };

    fetchInfo();
  }, [schoolCode, studentId]);

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomAmount(numValue);
    setUseFullAmount(false);
  };

  const handleFullAmountClick = () => {
    setCustomAmount(amount);
    setUseFullAmount(true);
  };

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

    if (customAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Payment amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    onStart?.();

    try {
      // Simplified payment logic - send academic year and term names instead of IDs
      const response = await fetch(`/api/schools/${schoolCode}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          amount: customAmount,
          paymentMethod,
          feeType,
          academicYear, // Send name instead of ID
          term, // Send name instead of ID
          description: `${feeType} - ${term} ${academicYear}`,
          phoneNumber: paymentMethod === "mpesa" ? phoneNumber : undefined,
          referenceNumber: paymentMethod === "manual" ? transactionId : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment failed");
      }

      const result = await response.json();
      
      // Create receipt data
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
        phoneNumber: paymentMethod === "mpesa" ? phoneNumber : undefined,
        transactionId: paymentMethod === "manual" ? transactionId : undefined,
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
      
      toast({
        title: "Payment Successful!",
        description: `Payment of KES ${customAmount.toLocaleString()} processed successfully.`,
        variant: "default",
      });

      onPaymentSuccess?.(result.payment);
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      onPaymentError?.(error.message);
    } finally {
      setIsLoading(false);
      onComplete?.();
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setReceiptData(null);
  };

  const downloadReceipt = () => {
    if (!receiptData) return;

    const receiptContent = `
RECEIPT

School: ${receiptData.schoolName}
Student: ${receiptData.studentName}
Receipt No: ${receiptData.receiptNumber}
Date: ${receiptData.issuedAt.toLocaleDateString()}
Time: ${receiptData.issuedAt.toLocaleTimeString()}

Payment Details:
Amount: KES ${receiptData.amount.toLocaleString()}
Payment Method: ${receiptData.paymentMethod}
Reference: ${receiptData.reference}
Fee Type: ${receiptData.feeType}
Term: ${receiptData.term}
Academic Year: ${receiptData.academicYear}

Balance After Payment:
Academic Year Outstanding: KES ${receiptData.academicYearOutstandingAfter?.toLocaleString() || 'N/A'}
Term Outstanding: KES ${receiptData.termOutstandingAfter?.toLocaleString() || 'N/A'}

Issued by: ${receiptData.issuedBy}
    `.trim();

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
    <div className="max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Sparkles className="h-4 w-4" />
          Quick Payment Portal
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">School Fee Payment</h2>
        <p className="text-gray-600">Complete your payment securely and quickly</p>
      </div>

      {/* Student Info Banner */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{studentInfo?.user?.name || "Loading..."}</h3>
              <p className="text-sm text-gray-600">{schoolInfo?.name || "Loading..."}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Term {term}</p>
            <p className="text-sm font-medium text-gray-900">{academicYear}</p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-xl font-bold text-gray-900">Payment Details</CardTitle>
          <CardDescription className="text-gray-600">Select your payment amount and method</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Payment Amount</Label>
            
            {/* Full Amount Option */}
            <div 
              className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                useFullAmount 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={handleFullAmountClick}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    useFullAmount ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {useFullAmount && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pay Full Amount</p>
                    <p className="text-sm text-gray-600">Complete payment for {term} {academicYear}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">KES {amount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Custom Amount Option */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  !useFullAmount ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {!useFullAmount && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                </div>
                <Label className="text-sm font-medium text-gray-700">Custom Amount</Label>
              </div>
              <div className="relative ml-7">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-10 h-12 text-lg font-semibold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  disabled={useFullAmount}
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value: "mpesa" | "manual") => setPaymentMethod(value)}>
              <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mpesa">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    M-Pesa Mobile Money
                  </div>
                </SelectItem>
                <SelectItem value="manual">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Manual Payment
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Dynamic Fields */}
            {paymentMethod === "mpesa" && (
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 254700000000"
                  />
                </div>
              </div>
            )}

            {paymentMethod === "manual" && (
              <div className="space-y-2">
                <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700">
                  Transaction ID
                </Label>
                <div className="relative">
                  <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="transactionId"
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter transaction ID"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">KES {customAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-semibold text-gray-900 capitalize">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fee Type:</span>
                <span className="font-semibold text-gray-900">{feeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Term:</span>
                <span className="font-semibold text-gray-900">{term}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handlePayment}
            disabled={isLoading || isProcessing}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Pay KES {customAmount.toLocaleString()}
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Payment Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold text-green-600">
                  KES {receiptData.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Receipt: {receiptData.receiptNumber}
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Student:</span>
                  <span className="font-medium">{receiptData.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="font-medium capitalize">{receiptData.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="font-medium">{receiptData.reference}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={downloadReceipt}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Button
                  onClick={handleCloseReceipt}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
