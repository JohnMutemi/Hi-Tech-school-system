import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface FeesSectionProps {
  schoolCode: string;
  students: any[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  payments: any[];
  loadingPayments: boolean;
  paymentsError: string;
  refreshPayments: (studentId: string) => void;
}

export default function FeesSection({ schoolCode, students = [], selectedId, setSelectedId, payments, loadingPayments, paymentsError, refreshPayments }: FeesSectionProps) {
  const selectedStudent = students.find((child: any) => child.id === selectedId) || students[0];
  const [feeData, setFeeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Fetch fee structure and payments for selected student
  useEffect(() => {
    async function fetchData() {
      if (!selectedStudent) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/schools/${schoolCode}/students/${selectedStudent.id}/fees`);
        const data = await res.json();
        setFeeData(data);
        console.log('FeesSection feeData', data); // <-- Debug log
        // Fetch payment history
        refreshPayments(selectedStudent.id);
      } catch (e) {
        setFeeData(null);
        // setPayments([]); // This line is removed as per new_code
      }
      setLoading(false);
    }
    fetchData();
  }, [schoolCode, selectedStudent]);

  // Payment simulation with enhanced logic
  async function handleSimulatePayment() {
    if (!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0) {
      setPayError("Enter a valid amount");
      return;
    }
    if (!payMethod) {
      setPayError("Select a payment method");
      return;
    }
    if (!selectedTerm) {
      setPayError("Please select a term to pay for");
      return;
    }
    
    setPayLoading(true);
    setPayError("");
    setPaySuccess("");
    setPaymentResult(null);
    
    try {
      // Simulate 3s delay for realism
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const res = await fetch(`/api/schools/${schoolCode}/students/${selectedStudent.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: Number(payAmount), 
          paymentMethod: payMethod, 
          description: `Payment for ${selectedTerm.term} ${selectedTerm.year}`,
          term: selectedTerm.term,
          academicYear: String(selectedTerm.year)
        })
      });
      
      if (res.ok) {
        const result = await res.json();
        setPaymentResult(result);
        
        // Show success message with overpayment details
        let successMessage = `Payment successful! Ksh ${Number(payAmount).toLocaleString()} paid.`;
        
        if (result.overpaymentAmount > 0) {
          successMessage += ` Overpayment of Ksh ${result.overpaymentAmount.toLocaleString()} applied to subsequent terms.`;
        }
        
        if (result.nextTermApplied) {
          successMessage += ` Applied Ksh ${result.nextTermApplied.amount.toLocaleString()} to ${result.nextTermApplied.term} ${result.nextTermApplied.year}.`;
        }
        
        setPaySuccess(successMessage);
        toast({ 
          title: "Payment Successful", 
          description: successMessage,
          duration: 5000
        });
        
        // Show green tick for 2s before closing
        setTimeout(() => {
          setPaymentModalOpen(false);
          setPayAmount("");
          setPayMethod("cash");
          setSelectedTerm(null);
          setPaymentResult(null);
        }, 2000);
        
        // Refresh data to show updated balances
        refreshPayments(selectedId);
        
        // Refresh fee data to update outstanding amounts
        const feeRes = await fetch(`/api/schools/${schoolCode}/students/${selectedStudent.id}/fees`);
        const feeData = await feeRes.json();
        setFeeData(feeData);
        
      } else {
        const err = await res.json();
        setPayError(err.error || "Payment failed");
      }
    } catch (e) {
      setPayError("Payment failed");
    }
    setPayLoading(false);
  }

  // Calculate outstanding amount for a term
  const getTermOutstanding = (term: any) => {
    if (!feeData) return 0;
    
    if (Array.isArray(feeData)) {
      const termData = feeData.find((t: any) => t.term === term.term && t.year === term.year);
      return termData ? Number(termData.balance || 0) : 0;
    }
    
    if (feeData.termBalances) {
      const termData = feeData.termBalances.find((t: any) => t.term === term.term && t.year === term.year);
      return termData ? Number(termData.balance || 0) : 0;
    }
    
    return 0;
  };

  // Check if term is fully paid
  const isTermFullyPaid = (term: any) => {
    return getTermOutstanding(term) <= 0;
  };

  // Get fee amount for a term
  const getTermFeeAmount = (term: any) => {
    if (!feeData) return 0;
    
    if (Array.isArray(feeData)) {
      const termData = feeData.find((t: any) => t.term === term.term && t.year === term.year);
      return termData ? Number(termData.totalAmount || 0) : 0;
    }
    
    if (feeData.termBalances) {
      const termData = feeData.termBalances.find((t: any) => t.term === term.term && t.year === term.year);
      return termData ? Number(termData.totalAmount || 0) : 0;
    }
    
    return 0;
  };

  return (
    <div className="h-full flex flex-col space-y-8">
      <Card className="flex-1 bg-gradient-to-br from-cyan-50/90 via-blue-50/90 to-teal-50/90 border-cyan-200/60 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-cyan-800 text-xl">
            <DollarSign className="w-7 h-7 text-cyan-600" /> 
            Fee Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 h-full flex flex-col">
          {/* Enhanced Child Selection */}
          {students.length > 0 && (
            <div className="bg-white/70 rounded-lg p-4 border border-green-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Select Child</label>
              <select
                className="w-full p-4 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-400 bg-white text-gray-900 text-lg font-medium transition-all duration-200"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              >
                <option value="">-- Select Child --</option>
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
              ) : Array.isArray(feeData) && feeData.length > 0 ? (
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
                      {feeData.map((term: any, idx: number) => {
                        const outstanding = Number(term.balance ?? 0);
                        const isPaid = outstanding <= 0;
                        const feeAmount = Number(term.totalAmount);
                        
                        return (
                          <tr key={term.id || idx} className="border-b">
                            <td className="px-2 py-1">{term.term || "-"}</td>
                            <td className="px-2 py-1">{term.year || "-"}</td>
                            <td className="px-2 py-1">Ksh {feeAmount.toLocaleString()}</td>
                            <td className="px-2 py-1">
                              <span className={outstanding > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                                Ksh {outstanding.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-2 py-1">
                              {isPaid ? 
                                <Badge variant="default" className="bg-green-100 text-green-800">Cleared</Badge> : 
                                <Badge variant="destructive">Pending</Badge>
                              }
                            </td>
                            <td className="px-2 py-1">
                              <Button 
                                size="sm" 
                                className="bg-green-600 text-white hover:bg-green-700" 
                                onClick={() => {
                                  setSelectedTerm(term);
                                  setPayAmount(outstanding.toString());
                                  setPaymentModalOpen(true);
                                }} 
                                disabled={isPaid}
                              >
                                {isPaid ? "Paid" : "Pay Now"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
                      {feeData.termBalances.map((term: any, idx: number) => {
                        const outstanding = Number(term.balance);
                        const isPaid = outstanding <= 0;
                        const feeAmount = Number(term.totalAmount);
                        
                        return (
                          <tr key={idx} className="border-b">
                            <td className="px-2 py-1">{term.term || "-"}</td>
                            <td className="px-2 py-1">{term.year || "-"}</td>
                            <td className="px-2 py-1">Ksh {feeAmount.toLocaleString()}</td>
                            <td className="px-2 py-1">
                              <span className={outstanding > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                                Ksh {outstanding.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-2 py-1">
                              {isPaid ? 
                                <Badge variant="default" className="bg-green-100 text-green-800">Cleared</Badge> : 
                                <Badge variant="destructive">Pending</Badge>
                              }
                            </td>
                            <td className="px-2 py-1">
                              <Button 
                                size="sm" 
                                className="bg-green-600 text-white hover:bg-green-700" 
                                onClick={() => {
                                  setSelectedTerm(term);
                                  setPayAmount(outstanding.toString());
                                  setPaymentModalOpen(true);
                                }} 
                                disabled={isPaid}
                              >
                                {isPaid ? "Paid" : "Pay Now"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No fee structure found for this student.</div>
              )}
              {/* Payment History */}
              <div className="mt-8">
                <h3 className="font-bold text-lg text-green-800 mb-2">Payment History</h3>
                {loadingPayments ? (
                  <div className="flex items-center gap-2 text-green-600"><Loader2 className="animate-spin" /> Loading payment history...</div>
                ) : paymentsError ? (
                  <div className="text-red-600 text-sm">{paymentsError}</div>
                ) : payments.length === 0 ? (
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
      {/* Enhanced Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">
              Payment for {selectedStudent?.name || selectedStudent?.user?.name}
            </h2>
            
            {selectedTerm && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Selected Term</h3>
                <div className="text-sm text-blue-700">
                  <p><strong>Term:</strong> {selectedTerm.term} {selectedTerm.year}</p>
                  <p><strong>Fee Amount:</strong> Ksh {Number(selectedTerm.totalAmount).toLocaleString()}</p>
                  <p><strong>Outstanding:</strong> Ksh {Number(selectedTerm.balance || 0).toLocaleString()}</p>
                </div>
              </div>
            )}
            
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
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
              <input
                type="number"
                className="w-full p-2 border border-green-200 rounded-lg"
                placeholder="Enter amount"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                min={1}
                disabled={payLoading}
              />
              {selectedTerm && Number(payAmount) > Number(selectedTerm.balance || 0) && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      Overpayment detected! Excess amount will be applied to subsequent terms.
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {payError && <div className="text-red-600 text-sm mb-2">{payError}</div>}
            {paySuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
                <CheckCircle2 className="w-5 h-5" /> {paySuccess}
              </div>
            )}
            
            {paymentResult && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Payment Summary</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Total Paid:</strong> Ksh {paymentResult.totalPaid?.toLocaleString()}</p>
                  {paymentResult.overpaymentAmount > 0 && (
                    <p><strong>Overpayment:</strong> Ksh {paymentResult.overpaymentAmount.toLocaleString()}</p>
                  )}
                  {paymentResult.nextTermApplied && (
                    <p><strong>Applied to:</strong> {paymentResult.nextTermApplied.term} {paymentResult.nextTermApplied.year}</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPaymentModalOpen(false)} disabled={payLoading}>Cancel</Button>
              <Button className="bg-green-600 text-white flex items-center gap-2" onClick={handleSimulatePayment} disabled={payLoading || !payMethod || !selectedTerm}>
                {payLoading ? (<><Loader2 className="animate-spin w-4 h-4" /> Processing...</>) : "Process Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 