import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface FeesSectionProps {
  schoolCode: string;
  students: any[];
  selectedId: string;
  setSelectedId: (id: string) => void;
}

export default function FeesSection({ schoolCode, students = [], selectedId, setSelectedId }: FeesSectionProps) {
  const selectedStudent = students.find((child: any) => child.id === selectedId) || students[0];
  const [feeData, setFeeData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState("");

  // Fetch fee structure and payments for selected student
  useEffect(() => {
    async function fetchData() {
      if (!selectedStudent) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/schools/${schoolCode}/students/${selectedStudent.id}/fees`);
        const data = await res.json();
        setFeeData(data);
        // Fetch payment history
        const payRes = await fetch(`/api/schools/${schoolCode}/students/${selectedStudent.id}/payments`);
        const payData = await payRes.json();
        setPayments(payData.payments || []);
      } catch (e) {
        setFeeData(null);
        setPayments([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [schoolCode, selectedStudent]);

  // Payment simulation
  async function handleSimulatePayment() {
    if (!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0) {
      setPayError("Enter a valid amount");
      return;
    }
    if (!payMethod) {
      setPayError("Select a payment method");
      return;
    }
    setPayLoading(true);
    setPayError("");
    setPaySuccess("");
    try {
      // Simulate 3s delay for realism
      await new Promise(resolve => setTimeout(resolve, 3000));
      const res = await fetch(`/api/schools/${schoolCode}/students/${selectedStudent.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(payAmount), paymentMethod: payMethod, description: "Simulated Payment" })
      });
      if (res.ok) {
        setPaySuccess("Payment successful!");
        toast({ title: "Payment Successful", description: `Ksh ${Number(payAmount).toLocaleString()} paid successfully.` });
        // Show green tick for 1.5s before closing
        setTimeout(() => {
          setPaymentModalOpen(false);
          setPayAmount("");
          setPayMethod("cash");
        }, 1500);
        // Optimistically update UI
        const feeRes = await fetch(`/api/schools/${schoolCode}/students/${selectedStudent.id}/fees`);
        setFeeData(await feeRes.json());
        const payRes = await fetch(`/api/schools/${schoolCode}/students/${selectedStudent.id}/payments`);
        setPayments((await payRes.json()).payments || []);
      } else {
        const err = await res.json();
        setPayError(err.error || "Payment failed");
      }
    } catch (e) {
      setPayError("Payment failed");
    }
    setPayLoading(false);
  }

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800"><DollarSign className="w-6 h-6 text-green-600" /> Fee Management</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length > 0 && (
            <div className="w-full sm:w-64 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
              <select
                className="w-full p-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-900"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              >
                <option value="">-- Select --</option>
                {students.map((child: any) => (
                  <option key={child.id} value={child.id}>
                    {child.name || child.user?.name || child.id}
                  </option>
                ))}
              </select>
            </div>
          )}
          {students.length === 0 ? (
            <div className="text-gray-500 text-sm">No children found.</div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Fee Structure Breakdown */}
              {loading ? (
                <div className="flex items-center gap-2 text-green-600"><Loader2 className="animate-spin" /> Loading fee data...</div>
              ) : feeData && feeData.termBalances && feeData.termBalances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border rounded-xl bg-white">
                    <thead>
                      <tr className="bg-green-100">
                        <th className="px-2 py-1 text-left text-green-800">Term</th>
                        <th className="px-2 py-1 text-left text-green-800">Year</th>
                        <th className="px-2 py-1 text-left text-green-800">Fee Amount</th>
                        <th className="px-2 py-1 text-left text-green-800">Outstanding</th>
                        <th className="px-2 py-1 text-left text-green-800">Status</th>
                        <th className="px-2 py-1 text-left text-green-800">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeData.termBalances.map((term: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="px-2 py-1">{term.term || "-"}</td>
                          <td className="px-2 py-1">{term.year || "-"}</td>
                          <td className="px-2 py-1">Ksh {Number(term.totalAmount).toLocaleString()}</td>
                          <td className="px-2 py-1">Ksh {Number(term.balance).toLocaleString()}</td>
                          <td className="px-2 py-1">{Number(term.balance) > 0 ? <Badge variant="destructive">Pending</Badge> : <Badge variant="default">Cleared</Badge>}</td>
                          <td className="px-2 py-1">
                            <Button size="sm" className="bg-green-600 text-white" onClick={() => setPaymentModalOpen(true)} disabled={Number(term.balance) <= 0}>Pay Now</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No fee structure found for this student.</div>
              )}
              {/* Payment History */}
              <div className="mt-8">
                <h3 className="font-bold text-lg text-green-800 mb-2">Payment History</h3>
                {payments.length === 0 ? (
                  <div className="text-gray-500 text-sm">No payments found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border rounded-xl bg-white">
                      <thead>
                        <tr className="bg-green-50">
                          <th className="px-2 py-1 text-left text-green-800">Term</th>
                          <th className="px-2 py-1 text-left text-green-800">Date</th>
                          <th className="px-2 py-1 text-left text-green-800">Amount</th>
                          <th className="px-2 py-1 text-left text-green-800">Method</th>
                          <th className="px-2 py-1 text-left text-green-800">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p: any, idx: number) => {
                          // Try to get term/year from payment or receipt, ensure string
                          function safeTerm(val: any) {
                            if (!val) return "-";
                            if (typeof val === "string" || typeof val === "number") return val;
                            if (typeof val === "object") {
                              return val.name || val.term || val.label || JSON.stringify(val);
                            }
                            return String(val);
                          }
                          const term = safeTerm(p.term || p.receipt?.term || p.receipt?.termName);
                          const year = safeTerm(p.year || p.receipt?.year || p.receipt?.academicYear);
                          // Overpayment logic: if this payment has an overpayment, show it
                          let overpayNote = "";
                          if (p.overpayment && p.nextTerm) {
                            const nextTermStr = safeTerm(p.nextTerm);
                            overpayNote = `Overpaid Ksh ${Number(p.overpayment).toLocaleString()} → ${nextTermStr}`;
                          }
                          return (
                            <tr key={p.id} className="border-b">
                              <td className="px-2 py-1">
                                {term}{year ? ` ${year}` : ""}
                                {overpayNote && (
                                  <div className="text-xs text-green-600 font-semibold mt-1">{overpayNote}</div>
                                )}
                              </td>
                              <td className="px-2 py-1">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "-"}</td>
                              <td className="px-2 py-1">Ksh {Number(p.amount).toLocaleString()}</td>
                              <td className="px-2 py-1">{p.paymentMethod || p.receipt?.paymentMethod || "-"}</td>
                              <td className="px-2 py-1">{p.referenceNumber || p.receiptNumber || "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Payment Modal (simulation) */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Simulate Payment for {selectedStudent?.name || selectedStudent?.user?.name}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <div className="flex gap-3 mb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="payMethod"
                    value="cash"
                    checked={payMethod === "cash"}
                    onChange={() => setPayMethod("cash")}
                    disabled={payLoading}
                  />
                  <span>Cash (Via Bursar)</span>
                </label>
                <label className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                  <input
                    type="radio"
                    name="payMethod"
                    value="mpesa"
                    checked={payMethod === "mpesa"}
                    onChange={() => setPayMethod("mpesa")}
                    disabled
                  />
                  <span>MPESA (Coming Soon)</span>
                </label>
              </div>
            </div>
            <input
              type="number"
              className="w-full p-2 border border-green-200 rounded-lg mb-4"
              placeholder="Enter amount"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              min={1}
              disabled={payLoading}
            />
            {payError && <div className="text-red-600 text-sm mb-2">{payError}</div>}
            {paySuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
                <CheckCircle2 className="w-5 h-5" /> {paySuccess}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPaymentModalOpen(false)} disabled={payLoading}>Cancel</Button>
              <Button className="bg-green-600 text-white flex items-center gap-2" onClick={handleSimulatePayment} disabled={payLoading || !payMethod}>{payLoading ? (<><Loader2 className="animate-spin w-4 h-4" /> Processing...</>) : "Simulate Payment"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 