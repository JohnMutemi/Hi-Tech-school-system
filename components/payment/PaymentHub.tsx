"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Phone,
  Receipt,
  Download,
  History,
  Calculator,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Calendar,
  User,
  School,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface PaymentHubProps {
  studentId: string;
  schoolCode: string;
  onPaymentComplete?: (receipt: ReceiptData) => void;
  initialSelectedTerm?: string;
  initialAmount?: number;
  initialAcademicYear?: string;
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

interface BalanceData {
  currentTerm: string;
  currentTermBalance: number;
  academicYearBalance: number;
  nextTermBalance: number;
  carryForwardAmount: number;
  overpaymentAmount: number;
  termBalances: {
    term: string;
    balance: number;
    totalAmount: number;
    paidAmount: number;
    outstanding: number;
  }[];
}

interface PaymentHistoryItem {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  term: string;
  academicYear: string;
  status: string;
  reference: string;
}

export default function PaymentHub({ studentId, schoolCode, onPaymentComplete, initialSelectedTerm, initialAmount, initialAcademicYear }: PaymentHubProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("payment");
  const [isLoading, setIsLoading] = useState(false);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [paymentState, setPaymentState] = useState({
    step: 1,
    selectedTerm: "",
    paymentAmount: 0,
    phoneNumber: "",
    paymentMethod: "mpesa" as "mpesa" | "manual",
    isProcessing: false,
  });

  // Fetch initial data
  useEffect(() => {
    fetchBalanceData();
    fetchPaymentHistory();
  }, [studentId, schoolCode]);

  // Apply initial selections from parent
  useEffect(() => {
    if (initialSelectedTerm) {
      setPaymentState(prev => ({ ...prev, selectedTerm: initialSelectedTerm }));
    }
  }, [initialSelectedTerm]);

  useEffect(() => {
    if (typeof initialAmount === 'number' && initialAmount > 0) {
      setPaymentState(prev => ({ ...prev, paymentAmount: initialAmount }));
    }
  }, [initialAmount]);

  const fetchBalanceData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/schools/${schoolCode}/students/${studentId}/fees`);
      if (response.ok) {
        const data = await response.json();

        // Normalize API response into BalanceData shape
        const termOrder: Record<string, number> = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
        const termBalances = Array.isArray(data) ? data : (data?.termBalances || []);
        const sorted = [...termBalances].sort((a, b) => (termOrder[a.term]||0) - (termOrder[b.term]||0));
        const pickCurrent = paymentState.selectedTerm || (sorted.find((t:any)=> (t.balance ?? 0) > 0)?.term) || sorted[0]?.term || 'Term 1';
        const currentIdx = sorted.findIndex((t:any)=> t.term === pickCurrent);
        const current = currentIdx >= 0 ? sorted[currentIdx] : null;
        const next = currentIdx >= 0 ? sorted[currentIdx+1] : null;

        const normalized: BalanceData = {
          currentTerm: pickCurrent,
          currentTermBalance: Number(current?.balance || 0),
          academicYearBalance: Number(data?.outstanding ?? data?.academicYearOutstanding ?? 0),
          nextTermBalance: Number(next?.balance || 0),
          carryForwardAmount: Number(current?.carryForward || 0),
          overpaymentAmount: 0,
          termBalances: sorted.map((t:any)=>({
            term: t.term,
            balance: Number(t.balance || 0),
            totalAmount: Number(t.totalAmount || t.amount || 0),
            paidAmount: Math.max(0, Number(t.totalAmount || t.amount || 0) - Number(t.balance || 0)),
            outstanding: Number(t.balance || 0),
          })),
        };
        setBalanceData(normalized);
      }
    } catch (error) {
      console.error("Error fetching balance data:", error);
      toast({
        title: "Error",
        description: "Failed to load balance information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/students/${studentId}/payment-history`);
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data?.payments || []);
        setPaymentHistory(items);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
  };

  const handlePaymentMethodChange = (method: "mpesa" | "manual") => {
    setPaymentState(prev => ({ ...prev, paymentMethod: method }));
  };

  const handleAmountChange = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setPaymentState(prev => ({ ...prev, paymentAmount: numAmount }));
  };

  const handlePhoneNumberChange = (phone: string) => {
    setPaymentState(prev => ({ ...prev, phoneNumber: phone }));
  };

  const validatePayment = (): boolean => {
    if (paymentState.paymentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return false;
    }

    if (paymentState.paymentMethod === "mpesa" && !paymentState.phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your MPESA phone number",
        variant: "destructive",
      });
      return false;
    }

    if (paymentState.paymentMethod === "mpesa" && !/^(\+254|254|0)?[17]\d{8}$/.test(paymentState.phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const simulateMPESAPayment = async (): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const transactionId = `MPESA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        resolve(transactionId);
      }, 3000); // Simulate 3-second processing time
    });
  };

  const processPayment = async () => {
    if (!validatePayment()) return;

    try {
      setPaymentState(prev => ({ ...prev, isProcessing: true }));

      let transactionId = "";
      if (paymentState.paymentMethod === "mpesa") {
        transactionId = await simulateMPESAPayment();
      }

      // Process payment through API
      const paymentData = {
        studentId,
        schoolCode,
        amount: paymentState.paymentAmount,
        paymentMethod: paymentState.paymentMethod,
        phoneNumber: paymentState.phoneNumber,
        transactionId,
        term: paymentState.selectedTerm || balanceData?.currentTerm || "Term 1",
        academicYear: initialAcademicYear || new Date().getFullYear().toString(),
        receivedBy: 'Parent Portal',
      };

      const response = await fetch(`/api/schools/${schoolCode}/payments/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        const receipt = await response.json();
        
        toast({
          title: "Payment Successful",
          description: `Payment of ${paymentState.paymentAmount.toLocaleString()} processed successfully`,
        });

        // Reset form
        setPaymentState({
          step: 1,
          selectedTerm: "",
          paymentAmount: 0,
          phoneNumber: "",
          paymentMethod: "mpesa",
          isProcessing: false,
        });

        // Refresh data
        await fetchBalanceData();
        await fetchPaymentHistory();

        // Call completion callback
        if (onPaymentComplete) {
          onPaymentComplete(receipt);
        }

        // Switch to history tab
        setActiveTab("history");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setPaymentState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const downloadReceipt = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/payments/${paymentId}/receipt`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${paymentId}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download receipt",
        variant: "destructive",
      });
    }
  };

  const renderPaymentForm = () => (
    <div className="space-y-6">
      {/* Balance Summary */}
      {balanceData && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calculator className="w-5 h-5" />
              Current Balance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-red-600">
                  {balanceData?.currentTermBalance?.toLocaleString() || "0"}
                </div>
                <div className="text-sm text-gray-600">Current Term Balance</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">
                  {balanceData?.academicYearBalance?.toLocaleString() || "0"}
                </div>
                <div className="text-sm text-gray-600">Academic Year Balance</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {balanceData?.nextTermBalance?.toLocaleString() || "0"}
                </div>
                <div className="text-sm text-gray-600">Next Term Balance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={paymentState.paymentMethod === "mpesa" ? "default" : "outline"}
              className="h-20 flex flex-col gap-2"
              onClick={() => handlePaymentMethodChange("mpesa")}
            >
              <Phone className="w-6 h-6" />
              <span>MPESA Payment</span>
            </Button>
            <Button
              variant={paymentState.paymentMethod === "manual" ? "default" : "outline"}
              className="h-20 flex flex-col gap-2"
              onClick={() => handlePaymentMethodChange("manual")}
            >
              <CreditCard className="w-6 h-6" />
              <span>Manual Payment</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount">Payment Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={paymentState.paymentAmount || ""}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="mt-1"
            />
          </div>

          {paymentState.paymentMethod === "mpesa" && (
            <div>
              <Label htmlFor="phone">MPESA Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 0712345678"
                value={paymentState.phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the phone number registered with MPESA
              </p>
            </div>
          )}

          <Button
            onClick={processPayment}
            disabled={paymentState.isProcessing || !paymentState.paymentAmount}
            className="w-full"
          >
            {paymentState.isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Process Payment
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderPaymentHistory = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <History className="w-5 h-5" />
          Payment History
        </h3>
        <Badge variant="secondary">
          {paymentHistory.length} payments
        </Badge>
      </div>

      {paymentHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Receipt className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No payment history found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paymentHistory.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">
                        KES {payment.amount.toLocaleString()}
                      </span>
                      <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Receipt: {payment.receiptNumber}</div>
                      <div>Term: {payment.term} • Year: {payment.academicYear}</div>
                      <div>Method: {payment.paymentMethod}</div>
                      <div>Date: {new Date(payment.paymentDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReceipt(payment.id)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Loading payment information...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Make Payment
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-6">
          {renderPaymentForm()}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {renderPaymentHistory()}
        </TabsContent>
      </Tabs>
    </div>
  );
} 