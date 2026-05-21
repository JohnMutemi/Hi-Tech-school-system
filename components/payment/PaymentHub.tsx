"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Loader2,
  Banknote,
  History,
  Undo2,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReceiptComponent from "./ReceiptComponent";
import PaymentHistory from "./PaymentHistory";
import { PAYMENT_UNDO_WINDOW_SECONDS } from "@/lib/payment-undo";

interface PaymentHubProps {
  studentId: string;
  schoolCode: string;
  onPaymentComplete?: (receipt: ReceiptData, options?: { undoWindowActive?: boolean }) => void;
  undoWindowSeconds?: number;
  /** @deprecated Use undoWindowSeconds */
  bursarUndoWindowSeconds?: number;
  onUndoPaymentSettled?: () => void;
  initialSelectedTerm?: string;
  initialAmount?: number;
  initialAcademicYear?: string;
  paymentRecordedBy?: string;
  /** Tighter layout for bursar payment dialog */
  compact?: boolean;
  /** School theme color — dialog portals omit parent CSS vars */
  brandColor?: string;
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
  admissionNumber: string;
  parentName: string;
  currency: string;
  termOutstandingBefore: number;
  termOutstandingAfter: number;
  academicYearOutstandingBefore: number;
  academicYearOutstandingAfter: number;
  carryForward?: number;
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
  balance?: number;
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

export default function PaymentHub({
  studentId,
  schoolCode,
  onPaymentComplete,
  undoWindowSeconds,
  bursarUndoWindowSeconds,
  onUndoPaymentSettled,
  initialSelectedTerm,
  initialAmount,
  initialAcademicYear,
  paymentRecordedBy = "Parent Portal",
  compact = false,
  brandColor = "#d97706",
}: PaymentHubProps) {
  const brandStyle = {
    "--brand": brandColor,
    "--brand-06": `${brandColor}0f`,
    "--brand-08": `${brandColor}14`,
    "--brand-12": `${brandColor}1f`,
    "--brand-18": `${brandColor}2e`,
  } as React.CSSProperties;
  const { toast } = useToast();
  const schoolPath = encodeURIComponent(schoolCode);
  const effectiveUndoWindowSeconds =
    undoWindowSeconds ?? bursarUndoWindowSeconds ?? undefined;
  const undoSettledRef = useRef(onUndoPaymentSettled);
  undoSettledRef.current = onUndoPaymentSettled;
  const [isLoading, setIsLoading] = useState(false);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [pendingUndo, setPendingUndo] = useState<{
    paymentId: string;
    secondsLeft: number;
  } | null>(null);
  const [undoLoading, setUndoLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [historyTabHint, setHistoryTabHint] = useState(false);
  const [activeTab, setActiveTab] = useState("payment");

  useEffect(() => {
    fetchBalanceData();
  }, [studentId, schoolCode, initialAcademicYear, initialSelectedTerm]);

  useEffect(() => {
    if (initialSelectedTerm) setSelectedTerm(initialSelectedTerm);
  }, [initialSelectedTerm]);

  useEffect(() => {
    if (typeof initialAmount === "number" && initialAmount > 0) {
      setPaymentAmount(initialAmount);
    }
  }, [initialAmount]);

  useEffect(() => {
    if (!pendingUndo) return;
    const id = window.setInterval(() => {
      setPendingUndo((prev) => {
        if (!prev) return null;
        if (prev.secondsLeft <= 1) {
          queueMicrotask(() => undoSettledRef.current?.());
          return null;
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [pendingUndo?.paymentId]);

  const fetchBalanceData = async () => {
    try {
      setIsLoading(true);
      const qs = new URLSearchParams();
      if (initialAcademicYear?.trim()) qs.set("academicYear", initialAcademicYear.trim());
      if (initialSelectedTerm?.trim()) qs.set("term", initialSelectedTerm.trim());
      const q = qs.toString() ? `?${qs.toString()}` : "";
      const response = await fetch(
        `/api/schools/${schoolPath}/students/${studentId}/fees${q}`
      );
      if (response.ok) {
        const data = await response.json();
        const termOrder: Record<string, number> = { "Term 1": 1, "Term 2": 2, "Term 3": 3 };
        const termBalances = Array.isArray(data) ? data : data?.termBalances || [];
        const sorted = [...termBalances].sort(
          (a, b) => (termOrder[a.term] || 0) - (termOrder[b.term] || 0)
        );
        const pickCurrent =
          selectedTerm ||
          initialSelectedTerm ||
          sorted.find((t: { balance?: number }) => (t.balance ?? 0) > 0)?.term ||
          sorted[0]?.term ||
          "Term 1";
        const currentIdx = sorted.findIndex((t: { term: string }) => t.term === pickCurrent);
        const current = currentIdx >= 0 ? sorted[currentIdx] : null;
        const next = currentIdx >= 0 ? sorted[currentIdx + 1] : null;

        setBalanceData({
          currentTerm: pickCurrent,
          currentTermBalance: Number(current?.balance || 0),
          academicYearBalance: Number(data?.outstanding ?? data?.academicYearOutstanding ?? 0),
          nextTermBalance: Number(next?.balance || 0),
          carryForwardAmount: Number(current?.carryForward || 0),
          overpaymentAmount: 0,
          termBalances: sorted.map((t: Record<string, unknown>) => {
            const totalAmount = Number(t.totalAmount || t.amount || 0);
            const outstanding = Number(t.balance || t.outstanding || 0);
            const paidAmount =
              t.paidAmount !== undefined && t.paidAmount !== null
                ? Number(t.paidAmount)
                : Math.max(0, totalAmount - outstanding);
            return {
              term: String(t.term),
              balance: outstanding,
              totalAmount,
              paidAmount,
              outstanding,
            };
          }),
        });
        if (!selectedTerm && pickCurrent) setSelectedTerm(pickCurrent);
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

  const validatePayment = (): boolean => {
    if (paymentAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a payment amount greater than zero.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleUndoPayment = async () => {
    if (!pendingUndo) return;
    try {
      setUndoLoading(true);
      const res = await fetch(`/api/schools/${schoolPath}/payments/${pendingUndo.paymentId}`, {
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
      setPendingUndo(null);
      setShowReceipt(false);
      setSelectedReceipt(null);
      await fetchBalanceData();
      onUndoPaymentSettled?.();
    } catch (e) {
      toast({
        title: "Undo failed",
        description: e instanceof Error ? e.message : "Try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setUndoLoading(false);
    }
  };

  const processPayment = async () => {
    if (!validatePayment()) return;

    try {
      setIsProcessing(true);
      const term = selectedTerm || balanceData?.currentTerm || "Term 1";
      const year = initialAcademicYear || new Date().getFullYear().toString();
      const ref =
        referenceNumber.trim() ||
        `MAN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const paymentData = {
        studentId,
        amount: paymentAmount,
        paymentMethod: "manual",
        feeType: "School Fees",
        term,
        academicYear: year,
        description: `School fees — ${term} ${year}`,
        referenceNumber: ref,
        receivedBy: paymentRecordedBy,
      };

      const response = await fetch(`/api/schools/${schoolPath}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        const responseData = await response.json();
        const receipt: ReceiptData = {
          receiptNumber:
            responseData.payment?.receiptNumber || responseData.receipt?.receiptNumber,
          paymentId: responseData.payment?.id,
          studentId: responseData.payment?.studentId || studentId,
          schoolCode,
          amount: responseData.payment?.amount || paymentAmount,
          paymentMethod: responseData.payment?.paymentMethod || "manual",
          feeType: "School Fees",
          term: responseData.payment?.term || term,
          academicYear: responseData.payment?.academicYear || year,
          reference: responseData.payment?.referenceNumber || ref,
          status: "completed",
          issuedAt: new Date(),
          issuedBy: paymentRecordedBy,
          schoolName: responseData.payment?.schoolName || "",
          studentName: responseData.payment?.studentName || "",
          admissionNumber: responseData.payment?.admissionNumber || "",
          parentName: responseData.payment?.parentName || "",
          currency: "KES",
          termOutstandingBefore: responseData.payment?.termOutstandingBefore || 0,
          termOutstandingAfter: responseData.payment?.termOutstandingAfter || 0,
          academicYearOutstandingBefore:
            responseData.payment?.academicYearOutstandingBefore || 0,
          academicYearOutstandingAfter:
            responseData.payment?.academicYearOutstandingAfter || 0,
          carryForward: responseData.payment?.carryForward || 0,
          balance: responseData.payment?.academicYearOutstandingAfter || 0,
        };

        toast({
          title: "Payment recorded",
          description: responseData.emailNotificationSent
            ? `KES ${paymentAmount.toLocaleString()} recorded. Receipt email sent.`
            : `KES ${paymentAmount.toLocaleString()} recorded. Receipt is ready to download.`,
        });

        setPaymentAmount(0);
        setReferenceNumber("");
        await fetchBalanceData();
        setSelectedReceipt(receipt);
        setShowReceipt(true);

        const canUndoWindow =
          typeof effectiveUndoWindowSeconds === "number" &&
          effectiveUndoWindowSeconds > 0 &&
          Boolean(receipt.paymentId);

        if (canUndoWindow) {
          setPendingUndo({
            paymentId: receipt.paymentId,
            secondsLeft: effectiveUndoWindowSeconds,
          });
        }

        onPaymentComplete?.(receipt, canUndoWindow ? { undoWindowActive: true } : undefined);
      } else {
        const error = await response.json();
        throw new Error(error.message || error.error || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Could not record payment",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatKes = (n: number) => `KES ${(n ?? 0).toLocaleString()}`;

  const activeTerm =
    selectedTerm || balanceData?.currentTerm || "Term 1";
  const activeTermBalance =
    balanceData?.termBalances.find((t) => t.term === activeTerm)?.outstanding ??
    balanceData?.currentTermBalance ??
    0;

  const fillTermBalance = () => {
    if (activeTermBalance > 0) setPaymentAmount(activeTermBalance);
  };

  const renderProcessButton = (sticky = false) => (
    <div
      className={
        sticky
          ? "sticky bottom-0 z-10 -mx-4 border-t border-slate-200/80 bg-white/95 px-4 pb-1 pt-3 backdrop-blur-sm sm:-mx-5 sm:px-5"
          : "pt-1"
      }
    >
      <Button
        type="button"
        onClick={processPayment}
        disabled={isProcessing || !paymentAmount || Boolean(pendingUndo)}
        className="h-12 w-full rounded-xl text-base font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-105 disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-100 disabled:shadow-none"
        style={
          !isProcessing && paymentAmount > 0 && !pendingUndo
            ? { backgroundColor: brandColor }
            : undefined
        }
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            Process payment
          </>
        )}
      </Button>
      {!paymentAmount ? (
        <p className="mt-2 text-center text-xs text-slate-500">
          Enter an amount to enable payment
        </p>
      ) : null}
    </div>
  );

  const renderPaymentForm = () => (
    <Card
      className="overflow-hidden rounded-2xl border-0 bg-white shadow-md ring-1 ring-slate-200/80"
      style={brandStyle}
    >
      {balanceData && (
        <div
          className="grid grid-cols-3 divide-x divide-white/20 text-center text-sm text-white"
          style={{
            background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 55%, ${brandColor}99 100%)`,
          }}
        >
          <div className="px-3 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
              Term
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              {formatKes(balanceData.currentTermBalance)}
            </p>
            <p className="text-xs text-white/75">{balanceData.currentTerm}</p>
          </div>
          <div className="px-3 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
              Year
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              {formatKes(balanceData.academicYearBalance)}
            </p>
            <p className="text-xs text-white/75">Outstanding</p>
          </div>
          <div className="px-3 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
              Next term
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              {formatKes(balanceData.nextTermBalance)}
            </p>
          </div>
        </div>
      )}

      <CardHeader className={`pb-2 ${compact ? "px-4 pt-4" : "px-5 pt-5"}`}>
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm"
            style={{ backgroundColor: brandColor }}
          >
            <Banknote className="h-4 w-4" />
          </span>
          Record manual payment
        </CardTitle>
        <p className="pl-11 text-sm font-normal leading-relaxed text-slate-600">
          Cash, bank deposit, or other in-office payment — saved immediately with a receipt.
        </p>
      </CardHeader>

      <CardContent
        className={`space-y-4 ${compact ? "px-4 pb-4" : "px-5 pb-6"}`}
      >
        <div
          className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="amount" className="text-slate-700">
                Amount (KES)
              </Label>
              {activeTermBalance > 0 ? (
                <button
                  type="button"
                  onClick={fillTermBalance}
                  className="inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ color: brandColor }}
                >
                  <Sparkles className="h-3 w-3" />
                  Pay full term ({formatKes(activeTermBalance)})
                </button>
              ) : null}
            </div>
            <Input
              id="amount"
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 5000"
              value={paymentAmount || ""}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="h-11 rounded-lg border-slate-200 bg-slate-50/80 text-base tabular-nums focus-visible:ring-2"
              style={
                { "--tw-ring-color": `${brandColor}40` } as React.CSSProperties
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reference" className="text-slate-700">
              Reference (optional)
            </Label>
            <Input
              id="reference"
              type="text"
              placeholder="Receipt / bank ref / slip no."
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="h-11 rounded-lg border-slate-200 bg-slate-50/80"
            />
          </div>
        </div>

        {balanceData && balanceData.termBalances.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-slate-700">Term</Label>
            <Select
              value={activeTerm}
              onValueChange={setSelectedTerm}
              disabled={balanceData.termBalances.length <= 1}
            >
              <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-slate-50/80">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {balanceData.termBalances.map((t) => (
                  <SelectItem key={t.term} value={t.term}>
                    {t.term} — outstanding {formatKes(t.outstanding)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {renderProcessButton(compact)}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Card
        className="rounded-2xl border-dashed border-slate-200 bg-slate-50/50"
        style={brandStyle}
      >
        <CardContent className="flex items-center justify-center gap-3 py-10 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: brandColor }} />
          <span>Loading balances…</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-5"} style={brandStyle}>
      {pendingUndo ? (
        <Card className="border-amber-200 bg-amber-50/90 shadow-none">
          <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p className="font-medium text-amber-950">Wrong amount?</p>
              <p className="text-amber-900">
                Undo within{" "}
                <span className="font-semibold tabular-nums">
                  {pendingUndo.secondsLeft >= 60
                    ? `${Math.ceil(pendingUndo.secondsLeft / 60)} min`
                    : `${pendingUndo.secondsLeft}s`}
                </span>
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-300 bg-white hover:bg-amber-100"
              onClick={handleUndoPayment}
              disabled={undoLoading}
            >
              {undoLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reverting…
                </>
              ) : (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Undo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className="grid h-11 w-full grid-cols-2 rounded-xl p-1 shadow-inner"
          style={{ background: "var(--brand-08, #f1f5f9)" }}
        >
          <TabsTrigger
            value="payment"
            className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <Banknote className="h-4 w-4" />
            Record
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="relative flex items-center justify-center gap-2 rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            <History className="h-4 w-4" />
            History
            {historyTabHint ? (
              <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                Fix
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="mt-3 focus-visible:outline-none">
          {renderPaymentForm()}
        </TabsContent>

        <TabsContent value="history" className="mt-3 focus-visible:outline-none">
          <PaymentHistory
            studentId={studentId}
            schoolCode={schoolCode}
            allowUndo={
              typeof effectiveUndoWindowSeconds === "number" && effectiveUndoWindowSeconds > 0
            }
            allowCorrect={
              typeof effectiveUndoWindowSeconds === "number" && effectiveUndoWindowSeconds > 0
            }
            undoWindowSeconds={effectiveUndoWindowSeconds ?? PAYMENT_UNDO_WINDOW_SECONDS}
            onUndoSettled={onUndoPaymentSettled}
            compact={compact}
            brandColor={brandColor}
            onCorrectableLatestChange={setHistoryTabHint}
          />
        </TabsContent>
      </Tabs>

      {showReceipt && selectedReceipt && (
        <ReceiptComponent
          receiptData={selectedReceipt}
          onClose={() => {
            setShowReceipt(false);
            setSelectedReceipt(null);
          }}
        />
      )}
    </div>
  );
}
