"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  DollarSign,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Plus,
  Receipt,
  TrendingUp,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { ReceiptGenerator } from "./receipt-generator";
import { useToast } from "@/hooks/use-toast";
import type {
  StudentFee,
  Payment,
  Receipt as ReceiptType,
  StudentFeesSummary,
} from "@/lib/types/fees";

interface PaymentPortalProps {
  schoolCode: string;
  studentId?: string;
}

export function PaymentPortal({
  schoolCode,
  studentId,
}: PaymentPortalProps) {
  const { toast } = useToast();
  const [schoolData, setSchoolData] = useState<any>(null);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [feesSummary, setFeesSummary] = useState<StudentFeesSummary | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(
    null
  );
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "mobile_money",
    referenceNumber: "",
    description: "",
    receivedBy: "",
  });

  useEffect(() => {
    loadData();
  }, [schoolCode, studentId]);

  const loadData = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}`);
      if (!response.ok) {
        toast({
          title: "Error",
          description: "School not found",
          variant: "destructive",
        });
        return;
      }
      const school = await response.json();
      setSchoolData(school);

      if (studentId) {
        const fees = await fetch(`/api/fees/${schoolCode}/${studentId}`);
        const paymentsData = await fetch(`/api/payments/${schoolCode}/${studentId}`);
        const receiptsData = await fetch(`/api/receipts/${schoolCode}/${studentId}`);
        const summary = await fetch(`/api/fees-summary/${schoolCode}/${studentId}`);

        const feesResponse = await fees.json();
        const paymentsResponse = await paymentsData.json();
        const receiptsResponse = await receiptsData.json();
        const summaryResponse = await summary.json();

        setStudentFees(feesResponse);
        setPayments(paymentsResponse);
        setReceipts(receiptsResponse);
        setFeesSummary(summaryResponse);
      }
    } catch (error) {
      console.error("Error loading payment data:", error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId) {
      toast({
        title: "Error",
        description: "Student information not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const amount = parseFloat(paymentForm.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      // Create payment record
      const payment: Payment = {
        id: `payment_${Date.now()}`,
        studentId,
        amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: paymentForm.paymentMethod as any,
        referenceNumber: paymentForm.referenceNumber,
        receiptNumber: `payment_${Date.now()}`,
        description: paymentForm.description || `Payment for student ${studentId}`,
        receivedBy: paymentForm.receivedBy || "System",
        createdAt: new Date().toISOString(),
      };

      // Create receipt
      const receipt: ReceiptType = {
        id: `receipt_${Date.now()}`,
        paymentId: payment.id,
        studentId,
        receiptNumber: `receipt_${Date.now()}`,
        amount,
        balance: feesSummary ? feesSummary.totalBalance - amount : 0,
        balanceCarriedForward: feesSummary ? feesSummary.totalBalance : 0,
        paymentDate: new Date().toISOString(),
        format: "A4",
        createdAt: new Date().toISOString(),
      };

      // Save payment and receipt
      await fetch(`/api/payments/${schoolCode}/${studentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payment),
      });
      await fetch(`/api/receipts/${schoolCode}/${studentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receipt),
      });

      // Reload data
      loadData();
      setShowPaymentDialog(false);
      setPaymentForm({
        amount: "",
        paymentMethod: "mobile_money",
        referenceNumber: "",
        description: "",
        receivedBy: "",
      });

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "partial":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Paid
          </Badge>
        );
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      case "partial":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Partial
          </Badge>
        );
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {schoolData?.logoUrl ? (
                <img
                  src={schoolData.logoUrl}
                  alt={`${schoolData.name} logo`}
                  className="w-12 h-12 object-cover rounded-lg border-2"
                  style={{ borderColor: schoolData.colorTheme }}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center border-2"
                  style={{
                    backgroundColor: schoolData?.colorTheme + "20",
                    borderColor: schoolData?.colorTheme,
                  }}
                >
                  <DollarSign
                    className="w-6 h-6"
                    style={{ color: schoolData?.colorTheme }}
                  />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Payment Portal
                </h1>
                <p className="text-gray-600">{schoolData?.name}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowPaymentDialog(true)}
              style={{ backgroundColor: schoolData?.colorTheme }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Make Payment
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  Student Name
                </Label>
                <p className="text-lg font-semibold">{studentId}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  Admission Number
                </Label>
                <p className="text-lg font-semibold">
                  {studentId}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  Class
                </Label>
                <p className="text-lg font-semibold">Class</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  Parent Name
                </Label>
                <p className="text-lg font-semibold">Parent Name</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  Parent Phone
                </Label>
                <p className="text-lg font-semibold">Parent Phone</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  Parent Email
                </Label>
                <p className="text-lg font-semibold">
                  Parent Email
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {feesSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Fees
                    </p>
                    <p className="text-lg font-semibold">
                      KES {feesSummary.totalFees.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CreditCard className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Paid
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      KES {feesSummary.totalPaid.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Balance</p>
                    <p className="text-lg font-semibold text-red-600">
                      KES {feesSummary.totalBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-lg font-semibold text-yellow-600">
                      KES {feesSummary.overdueAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="fees" className="space-y-6">
          <TabsList>
            <TabsTrigger value="fees">Fee Statement</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
          </TabsList>

          {/* Fee Statement Tab */}
          <TabsContent value="fees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Statement</CardTitle>
                <CardDescription>
                  Current fee status and outstanding balances
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studentFees.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No fees assigned to this student yet.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentFees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(fee.status)}
                              {fee.id}
                            </div>
                          </TableCell>
                          <TableCell>
                            KES {fee.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {new Date(fee.dueDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(fee.status)}</TableCell>
                          <TableCell className="font-semibold">
                            KES {fee.balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  All payment transactions for this student
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No payments recorded yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Receipt No</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.receiptNumber}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            KES {payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="capitalize">
                            {payment.paymentMethod.replace("_", " ")}
                          </TableCell>
                          <TableCell>
                            {payment.referenceNumber || "-"}
                          </TableCell>
                          <TableCell>{payment.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Receipts</CardTitle>
                <CardDescription>
                  All generated payment receipts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {receipts.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No receipts generated yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt No</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipts.map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell className="font-medium">
                            {receipt.receiptNumber}
                          </TableCell>
                          <TableCell>
                            {new Date(receipt.paymentDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-semibold">
                            KES {receipt.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            KES {receipt.balance.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReceipt(receipt);
                                setShowReceiptDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, amount: e.target.value })
                }
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentForm.paymentMethod}
                onValueChange={(value) =>
                  setPaymentForm({ ...paymentForm, paymentMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={paymentForm.referenceNumber}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    referenceNumber: e.target.value,
                  })
                }
                placeholder="Transaction reference"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={paymentForm.description}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    description: e.target.value,
                  })
                }
                placeholder="Payment description"
              />
            </div>
            <div>
              <Label htmlFor="receivedBy">Received By</Label>
              <Input
                id="receivedBy"
                value={paymentForm.receivedBy}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, receivedBy: e.target.value })
                }
                placeholder="Staff member name"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: schoolData?.colorTheme }}
              >
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      {selectedReceipt && (
        <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Payment Receipt</DialogTitle>
            </DialogHeader>
            <ReceiptGenerator
              receipt={{
                id: selectedReceipt.id,
                receiptNumber: selectedReceipt.receiptNumber,
                amount: selectedReceipt.amount,
                paymentDate: selectedReceipt.paymentDate,
                paymentMethod:
                  payments.find((p) => p.id === selectedReceipt.paymentId)
                    ?.paymentMethod || "unknown",
                referenceNumber:
                  payments.find((p) => p.id === selectedReceipt.paymentId)
                    ?.referenceNumber || "",
                studentName: studentId || "Unknown",
                studentId: studentId || "Unknown",
                schoolName: schoolData?.name || "Unknown",
                schoolCode: schoolData?.code || "Unknown",
                generatedAt:
                  selectedReceipt.generatedAt || new Date().toISOString(),
              }}
              onClose={() => setShowReceiptDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
