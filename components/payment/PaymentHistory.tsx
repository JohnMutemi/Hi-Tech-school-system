"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  History, 
  Download, 
  Search, 
  Calendar, 
  CreditCard, 
  RefreshCw, 
  AlertCircle,
  Receipt,
  ArrowUpDown,
  Filter,
  Eye,
  Undo2,
  PencilLine,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText
} from "lucide-react";
import ReceiptComponent from "./ReceiptComponent";
import { CorrectPaymentDialog, type CorrectPaymentTarget } from "./CorrectPaymentDialog";
import { FeesStatementDownload } from "@/components/fees-statement/FeesStatementDownload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { canUndoPayment, paymentUndoSecondsRemaining } from "@/lib/payment-undo";
import { canCorrectPayment } from "@/lib/payment-correction";

interface PaymentRecord {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  description: string;
  referenceNumber: string;
  receivedBy: string;
  term: string;
  academicYear: string;
  termOutstandingBefore: number;
  termOutstandingAfter: number;
  academicYearOutstandingBefore: number;
  academicYearOutstandingAfter: number;
  carryForward?: number;
  status: string;
  receipt?: {
    id: string;
    receiptNumber: string;
    termOutstandingBefore: number;
    termOutstandingAfter: number;
    academicYearOutstandingBefore: number;
    academicYearOutstandingAfter: number;
  };
  student?: {
    name: string;
    admissionNumber: string;
    parentName: string;
  };
  school?: {
    name: string;
  };
  isLatestPayment?: boolean;
  lastCorrection?: {
    id: string;
    reason: string;
    previousAmount: number;
    newAmount: number;
    correctedByName: string | null;
    createdAt: string;
  } | null;
}

interface PaymentHistoryProps {
  studentId: string;
  schoolCode: string;
  className?: string;
  /** When true, staff can undo recent payments from the history list. */
  allowUndo?: boolean;
  undoWindowSeconds?: number;
  onUndoSettled?: () => void;
  /** Dense list for bursar payment dialog */
  compact?: boolean;
  brandColor?: string;
  /** Bursar/finance may correct the latest payment after undo expires */
  allowCorrect?: boolean;
  /** Notifies parent when the latest payment can be corrected (for tab badge). */
  onCorrectableLatestChange?: (canCorrect: boolean) => void;
}

export default function PaymentHistory({
  studentId,
  schoolCode,
  className = "",
  allowUndo = false,
  onUndoSettled,
  compact = false,
  brandColor = "#d97706",
  allowCorrect = false,
  onCorrectableLatestChange,
}: PaymentHistoryProps) {
  const { toast } = useToast();
  const schoolPath = encodeURIComponent(schoolCode);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showFeesStatement, setShowFeesStatement] = useState(false);
  const [undoingPaymentId, setUndoingPaymentId] = useState<string | null>(null);
  const [, setUndoTick] = useState(0);
  const [correctTarget, setCorrectTarget] = useState<CorrectPaymentTarget | null>(null);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Summary states
  const [paymentSummary, setPaymentSummary] = useState({
    totalPaid: 0,
    totalPayments: 0,
    averagePayment: 0,
    lastPaymentDate: null as string | null,
    mostRecentBalance: 0
  });

  useEffect(() => {
    fetchPaymentHistory();
  }, [studentId, schoolCode]);

  useEffect(() => {
    filterAndSortPayments();
  }, [payments, searchTerm, selectedTerm, selectedYear, sortOrder]);

  useEffect(() => {
    if (!allowUndo && !allowCorrect) return;
    const id = window.setInterval(() => setUndoTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [allowUndo, allowCorrect]);

  const openCorrectDialog = (payment: PaymentRecord) => {
    setCorrectTarget({
      id: payment.id,
      amount: payment.amount,
      referenceNumber: payment.referenceNumber,
      term: payment.term,
      academicYear: payment.academicYear,
      receiptNumber: payment.receiptNumber,
    });
    setCorrectOpen(true);
  };

  const latestCorrectablePayment = (() => {
    if (!allowCorrect || filteredPayments.length === 0) return null;
    const payment = filteredPayments[0];
    const isLatest = payment.isLatestPayment ?? true;
    if (canCorrectPayment(payment.paymentDate, isLatest)) return payment;
    return null;
  })();

  useEffect(() => {
    onCorrectableLatestChange?.(Boolean(latestCorrectablePayment));
  }, [latestCorrectablePayment, onCorrectableLatestChange]);

  const renderCorrectLatestBanner = () => {
    if (!latestCorrectablePayment) return null;
    const p = latestCorrectablePayment;
    return (
      <Card className="border-2 border-violet-300 bg-gradient-to-r from-violet-50 to-white shadow-sm">
        <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-violet-950">
              Update last transaction
            </p>
            <p className="mt-0.5 text-xs text-violet-800">
              Undo time has passed. Fix {p.receiptNumber} ({formatCurrency(p.amount)}) — amount,
              reference, or term, with a reason on file.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-10 shrink-0 px-4 text-sm font-semibold text-white shadow-md"
            style={{ backgroundColor: brandColor }}
            onClick={() => openCorrectDialog(p)}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            Update transaction
          </Button>
        </CardContent>
      </Card>
    );
  };

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Get base URL for deployed environment
      const response = await fetch(
        `/api/schools/${encodeURIComponent(schoolCode)}/payments?studentId=${encodeURIComponent(studentId)}`,
        { credentials: 'include', cache: 'no-store' }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }
      
      const data = await response.json();
      const paymentsData = Array.isArray(data) ? data : data.payments || [];
      
      setPayments(paymentsData);
      calculateSummary(paymentsData);
      
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setError("Failed to load payment history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (paymentsData: PaymentRecord[]) => {
    if (paymentsData.length === 0) {
      setPaymentSummary({
        totalPaid: 0,
        totalPayments: 0,
        averagePayment: 0,
        lastPaymentDate: null,
        mostRecentBalance: 0
      });
      return;
    }

    const totalPaid = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalPayments = paymentsData.length;
    const averagePayment = totalPayments > 0 ? totalPaid / totalPayments : 0;
    
    // Sort by date to get the most recent payment
    const sortedByDate = [...paymentsData].sort((a, b) => 
      new Date(b.paymentDate || 0).getTime() - new Date(a.paymentDate || 0).getTime()
    );
    
    const lastPaymentDate = sortedByDate[0]?.paymentDate || null;
    const mostRecentBalance = sortedByDate[0]?.academicYearOutstandingAfter || 0;

    setPaymentSummary({
      totalPaid,
      totalPayments,
      averagePayment,
      lastPaymentDate,
      mostRecentBalance
    });
  };

  const filterAndSortPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Term filter
    if (selectedTerm !== "all") {
      filtered = filtered.filter(payment => payment.term === selectedTerm);
    }

    // Academic year filter
    if (selectedYear !== "all") {
      filtered = filtered.filter(payment => payment.academicYear === selectedYear);
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.paymentDate).getTime();
      const dateB = new Date(b.paymentDate).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredPayments(filtered);
  };

  const handleViewReceipt = (payment: PaymentRecord) => {
    // Create receipt data matching the ReceiptComponent interface
    const receiptData = {
      receiptNumber: payment.receiptNumber,
      paymentId: payment.id,
      studentId: studentId,
      schoolCode: schoolCode,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      feeType: "School Fees", // Default fee type
      term: payment.term,
      academicYear: payment.academicYear,
      reference: payment.referenceNumber,
      phoneNumber: undefined, // Would need to be added to payment record
      transactionId: payment.referenceNumber,
      status: payment.status,
      issuedAt: new Date(payment.paymentDate),
      issuedBy: payment.receivedBy || "Parent Portal",
      schoolName: payment.school?.name || "School",
      studentName: payment.student?.name || "Student",
      admissionNumber: payment.student?.admissionNumber || "",
      parentName: payment.student?.parentName || "Parent",
      currency: "KES",
      termOutstandingBefore: payment.termOutstandingBefore,
      termOutstandingAfter: payment.termOutstandingAfter,
      academicYearOutstandingBefore: payment.academicYearOutstandingBefore,
      academicYearOutstandingAfter: payment.academicYearOutstandingAfter,
      carryForward: payment.carryForward
    };

    setSelectedReceipt(receiptData);
    setShowReceiptModal(true);
  };

  const handleUndoPayment = async (payment: PaymentRecord) => {
    if (!allowUndo || !canUndoPayment(payment.paymentDate)) return;
    try {
      setUndoingPaymentId(payment.id);
      const res = await fetch(`/api/schools/${schoolPath}/payments/${payment.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not revert payment");
      }
      toast({
        title: "Payment reverted",
        description: "The payment was removed and balances were recalculated.",
      });
      await fetchPaymentHistory();
      onUndoSettled?.();
    } catch (e) {
      toast({
        title: "Undo failed",
        description: e instanceof Error ? e.message : "Try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setUndoingPaymentId(null);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'KES 0';
    }
    return `KES ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getUniqueTerms = () => {
    const terms = [...new Set(payments.map(p => p.term))];
    return terms.sort();
  };

  const getUniqueYears = () => {
    const years = [...new Set(payments.map(p => p.academicYear))];
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  };

  const exportPaymentHistory = () => {
    const csvContent = [
      ["Receipt Number", "Date", "Amount", "Payment Method", "Term", "Academic Year", "Description", "Balance After"],
      ...filteredPayments.map(payment => [
        payment.receiptNumber,
        formatDate(payment.paymentDate),
        payment.amount.toString(),
        payment.paymentMethod,
        payment.term,
        payment.academicYear,
        payment.description,
        payment.academicYearOutstandingAfter.toString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-history-${studentId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center ${compact ? "py-8" : "py-12"}`}>
        <div className="text-center">
          <div
            className={`animate-spin rounded-full border-b-2 mx-auto mb-3 ${compact ? "h-6 w-6" : "h-8 w-8"}`}
            style={{ borderColor: brandColor }}
          />
          <p className={compact ? "text-sm text-slate-600" : "text-gray-600"}>Loading history…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center ${compact ? "py-8" : "py-12"}`}>
        <div className="text-center">
          <AlertCircle className={`text-red-500 mx-auto mb-3 ${compact ? "w-8 h-8" : "w-12 h-12"}`} />
          <p className={`text-red-600 mb-3 ${compact ? "text-sm" : ""}`}>{error}</p>
          <Button onClick={fetchPaymentHistory} variant="outline" size={compact ? "sm" : "default"}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-3 ${className}`}>
        {renderCorrectLatestBanner()}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Total paid", value: formatCurrency(paymentSummary.totalPaid) },
            { label: "Payments", value: String(paymentSummary.totalPayments) },
            { label: "Average", value: formatCurrency(paymentSummary.averagePayment) },
            {
              label: "Balance",
              value: formatCurrency(paymentSummary.mostRecentBalance),
              highlight: paymentSummary.mostRecentBalance > 0,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-2 text-center"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {stat.label}
              </p>
              <p
                className={`mt-0.5 text-sm font-bold tabular-nums ${
                  stat.highlight ? "text-orange-600" : "text-slate-900"
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <Card className="overflow-hidden rounded-2xl border-0 shadow-md ring-1 ring-slate-200/80">
          <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <History className="h-4 w-4" style={{ color: brandColor }} />
                Payment history
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={exportPaymentHistory}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={fetchPaymentHistory}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="relative col-span-2 sm:col-span-2">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search receipt, ref…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All terms</SelectItem>
                  {getUniqueTerms().map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(v: "asc" | "desc") => setSortOrder(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest</SelectItem>
                  <SelectItem value="asc">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-[11px] text-slate-500">
              {filteredPayments.length} of {payments.length} payments
            </p>
          </CardHeader>

          <CardContent className="p-0">
            {filteredPayments.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Receipt className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No payments to show</p>
              </div>
            ) : (
              <div className="max-h-[min(42vh,320px)] overflow-y-auto">
                <ul className="divide-y divide-slate-100">
                  {filteredPayments.map((payment, index) => {
                    const isLatest = payment.isLatestPayment ?? index === 0;
                    const showCorrect =
                      allowCorrect &&
                      canCorrectPayment(payment.paymentDate, isLatest);
                    return (
                    <li
                      key={payment.id}
                      className={`flex items-center gap-2 px-3 py-2 transition-colors sm:gap-3 sm:px-4 ${
                        showCorrect
                          ? "bg-violet-50/80 ring-1 ring-inset ring-violet-200 hover:bg-violet-50"
                          : "hover:bg-slate-50/90"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="truncate text-xs font-semibold text-slate-800">
                            {payment.receiptNumber}
                          </span>
                          {payment.lastCorrection ? (
                            <Badge
                              variant="outline"
                              className="h-4 px-1 text-[9px] border-violet-200 bg-violet-50 text-violet-800"
                            >
                              Corrected
                            </Badge>
                          ) : null}
                          <span className="text-[11px] text-slate-500">
                            {formatDate(payment.paymentDate)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-[11px] text-slate-500">
                          <span>
                            {payment.term} {payment.academicYear}
                          </span>
                          <span className="hidden sm:inline">·</span>
                          <span className="capitalize">
                            {(payment.paymentMethod || "").replace("_", " ")}
                          </span>
                          <span className="hidden md:inline">·</span>
                          <span
                            className={
                              payment.academicYearOutstandingAfter <= 0
                                ? "text-emerald-600"
                                : "text-orange-600"
                            }
                          >
                            Bal {formatCurrency(payment.academicYearOutstandingAfter)}
                          </span>
                        </div>
                      </div>
                      <p
                        className="shrink-0 text-sm font-bold tabular-nums text-emerald-700"
                        style={{ minWidth: "4.5rem", textAlign: "right" }}
                      >
                        {formatCurrency(payment.amount)}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        {allowUndo && canUndoPayment(payment.paymentDate) ? (
                          <Button
                            onClick={() => handleUndoPayment(payment)}
                            variant="outline"
                            size="sm"
                            disabled={undoingPaymentId === payment.id}
                            className="h-7 px-2 text-[10px] border-amber-200 bg-amber-50 text-amber-900"
                          >
                            {undoingPaymentId === payment.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Undo2 className="h-3 w-3 sm:mr-0.5" />
                                <span className="hidden sm:inline">
                                  {paymentUndoSecondsRemaining(payment.paymentDate)}s
                                </span>
                              </>
                            )}
                          </Button>
                        ) : showCorrect ? (
                          <Button
                            onClick={() => openCorrectDialog(payment)}
                            size="sm"
                            className="h-8 px-3 text-xs font-semibold text-white shadow-sm"
                            style={{ backgroundColor: brandColor }}
                            title="Update last transaction"
                          >
                            <PencilLine className="h-3.5 w-3.5 sm:mr-1" />
                            Update
                          </Button>
                        ) : null}
                        <Button
                          onClick={() => handleViewReceipt(payment)}
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="View receipt"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {showReceiptModal && selectedReceipt && (
          <ReceiptComponent
            receiptData={selectedReceipt}
            onClose={() => {
              setShowReceiptModal(false);
              setSelectedReceipt(null);
            }}
          />
        )}

        <CorrectPaymentDialog
          open={correctOpen}
          onOpenChange={setCorrectOpen}
          payment={correctTarget}
          studentId={studentId}
          schoolCode={schoolCode}
          brandColor={brandColor}
          onCorrected={() => {
            fetchPaymentHistory();
            onUndoSettled?.();
          }}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {renderCorrectLatestBanner()}
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(paymentSummary.totalPaid)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Payments</p>
                <p className="text-2xl font-bold">{paymentSummary.totalPayments}</p>
              </div>
              <Receipt className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Average Payment</p>
                <p className="text-2xl font-bold">{formatCurrency(paymentSummary.averagePayment)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${paymentSummary.mostRecentBalance > 0 ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600'} text-white`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`${paymentSummary.mostRecentBalance > 0 ? 'text-orange-100' : 'text-green-100'} text-sm`}>Current Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(paymentSummary.mostRecentBalance)}</p>
              </div>
              {paymentSummary.mostRecentBalance > 0 ? 
                <TrendingDown className="w-8 h-8 text-orange-200" /> : 
                <TrendingUp className="w-8 h-8 text-green-200" />
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Payment History
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowFeesStatement(true)} 
                variant="outline" 
                size="sm"
                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800"
              >
                <FileText className="w-4 h-4 mr-2" />
                Fee Statement
              </Button>
              <Button onClick={exportPaymentHistory} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={fetchPaymentHistory} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {getUniqueTerms().map(term => (
                  <SelectItem key={term} value={term}>{term}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {getUniqueYears().map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              {filteredPayments.length} of {payments.length} payments
            </div>
          </div>

          {/* Payment Records */}
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {payments.length === 0 ? "No payments found" : "No payments match your filters"}
              </h3>
              <p className="text-gray-500">
                {payments.length === 0 
                  ? "This student hasn't made any payments yet." 
                  : "Try adjusting your search criteria to find more payments."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment, index) => {
                const isLatest = payment.isLatestPayment ?? index === 0;
                const showCorrect =
                  allowCorrect && canCorrectPayment(payment.paymentDate, isLatest);
                return (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Payment Details */}
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Receipt className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-sm">{payment.receiptNumber}</span>
                            {payment.lastCorrection ? (
                              <Badge variant="outline" className="text-violet-700 border-violet-200 bg-violet-50">
                                Corrected
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-gray-600">{formatDate(payment.paymentDate)}</p>
                        </div>

                        {/* Academic Info */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-sm">{payment.term} {payment.academicYear}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{payment.description}</p>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 capitalize">{(payment.paymentMethod || '').replace('_', ' ')}</span>
                          </div>
                        </div>

                        {/* Balance Info */}
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Balance After Payment:</p>
                          <p className={`font-semibold ${payment.academicYearOutstandingAfter <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {formatCurrency(payment.academicYearOutstandingAfter)}
                          </p>
                          {payment.carryForward && payment.carryForward > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              Overpaid: {formatCurrency(payment.carryForward)}
                            </p>
                          )}
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                            {payment.status}
                          </Badge>
                          {payment.lastCorrection ? (
                            <p className="text-xs text-violet-700 mt-2 line-clamp-2" title={payment.lastCorrection.reason}>
                              {payment.lastCorrection.correctedByName ? `${payment.lastCorrection.correctedByName}: ` : ""}
                              {payment.lastCorrection.reason}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {allowUndo && canUndoPayment(payment.paymentDate) ? (
                          <Button
                            onClick={() => handleUndoPayment(payment)}
                            variant="outline"
                            size="sm"
                            disabled={undoingPaymentId === payment.id}
                            className="flex items-center gap-1 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                          >
                            {undoingPaymentId === payment.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Undo2 className="w-4 h-4" />
                            )}
                            Undo ({paymentUndoSecondsRemaining(payment.paymentDate)}s)
                          </Button>
                        ) : showCorrect ? (
                          <Button
                            onClick={() => openCorrectDialog(payment)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100"
                          >
                            <PencilLine className="w-4 h-4" />
                            Update transaction
                          </Button>
                        ) : null}
                        <Button
                          onClick={() => handleViewReceipt(payment)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800"
                        >
                          <Eye className="w-4 h-4" />
                          Receipt
                        </Button>
                        <Button
                          onClick={() => setShowFeesStatement(true)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800"
                        >
                          <FileText className="w-4 h-4" />
                          Statement
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CorrectPaymentDialog
        open={correctOpen}
        onOpenChange={setCorrectOpen}
        payment={correctTarget}
        studentId={studentId}
        schoolCode={schoolCode}
        brandColor={brandColor}
        onCorrected={() => {
          fetchPaymentHistory();
          onUndoSettled?.();
        }}
      />

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <ReceiptComponent
          receiptData={selectedReceipt}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceipt(null);
          }}
        />
      )}

      {/* Fees Statement Modal */}
      <Dialog open={showFeesStatement} onOpenChange={setShowFeesStatement}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              Fee Statement
            </DialogTitle>
          </DialogHeader>
          <FeesStatementDownload
            schoolCode={schoolCode}
            studentId={studentId}
            studentName={payments[0]?.student?.name || "Student"}
            admissionNumber={payments[0]?.student?.admissionNumber || "N/A"}
            gradeName="N/A"
            className="N/A"
            parentName={payments[0]?.student?.parentName}
            isBursar={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}


