"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PencilLine } from "lucide-react";
import { PAYMENT_CORRECTION_MIN_REASON_LENGTH } from "@/lib/payment-correction";

export type CorrectPaymentTarget = {
  id: string;
  amount: number;
  referenceNumber?: string | null;
  term: string;
  academicYear: string;
  receiptNumber: string;
};

type CorrectPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: CorrectPaymentTarget | null;
  studentId: string;
  schoolCode: string;
  brandColor?: string;
  onCorrected?: () => void;
};

export function CorrectPaymentDialog({
  open,
  onOpenChange,
  payment,
  studentId,
  schoolCode,
  brandColor = "#d97706",
  onCorrected,
}: CorrectPaymentDialogProps) {
  const { toast } = useToast();
  const schoolPath = encodeURIComponent(schoolCode);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [term, setTerm] = useState("");
  const [reason, setReason] = useState("");
  const [termOptions, setTermOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !payment) return;
    setAmount(String(payment.amount));
    setReference(payment.referenceNumber ?? "");
    setTerm(payment.term);
    setReason("");
  }, [open, payment]);

  useEffect(() => {
    if (!open || !payment) return;
    const qs = new URLSearchParams({ academicYear: payment.academicYear });
    fetch(`/api/schools/${schoolPath}/students/${studentId}/fees?${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const rows = Array.isArray(data?.termBalances) ? data.termBalances : [];
        const names = rows.map((t: { term?: string }) => t.term).filter(Boolean);
        if (names.length) setTermOptions(names as string[]);
        else setTermOptions([payment.term]);
      })
      .catch(() => setTermOptions([payment.term]));
  }, [open, payment, schoolPath, studentId]);

  const handleSubmit = async () => {
    if (!payment) return;
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid amount greater than zero.",
        variant: "destructive",
      });
      return;
    }
    const trimmedReason = reason.trim();
    if (trimmedReason.length < PAYMENT_CORRECTION_MIN_REASON_LENGTH) {
      toast({
        title: "Reason required",
        description: `Explain the correction (${PAYMENT_CORRECTION_MIN_REASON_LENGTH}+ characters).`,
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(
        `/api/schools/${schoolPath}/payments/${payment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: parsed,
            referenceNumber: reference.trim() || null,
            term,
            reason: trimmedReason,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not update payment"
        );
      }
      toast({
        title: "Transaction updated",
        description: "Balances and receipt were recalculated.",
      });
      onOpenChange(false);
      onCorrected?.();
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilLine className="h-5 w-5" style={{ color: brandColor }} />
            Update last transaction
          </DialogTitle>
          <DialogDescription>
            Correct the most recent payment when undo has expired. A reason is saved for
            audit ({payment?.receiptNumber}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="correct-amount">Amount (KES)</Label>
              <Input
                id="correct-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="correct-ref">Reference</Label>
              <Input
                id="correct-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Receipt / bank ref"
              />
            </div>
          </div>

          {termOptions.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {termOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="correct-reason">
              Reason for correction <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="correct-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Wrong amount keyed — parent paid 6,000 not 60,000"
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              Minimum {PAYMENT_CORRECTION_MIN_REASON_LENGTH} characters. Visible in payment
              history.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="text-white"
            style={{ backgroundColor: brandColor }}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Update transaction"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
