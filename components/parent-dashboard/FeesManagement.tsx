import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, Download, Receipt, Calendar, BookOpen, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import PaymentHub from "@/components/payment/PaymentHub";

interface FeesManagementProps {
  students: any[];
  schoolCode: string;
  selectedId: string;
  setSelectedId: (id: string) => void;
}

export default function FeesManagement({ students, schoolCode, selectedId, setSelectedId }: FeesManagementProps) {
  const selectedStudent = students.find((child: any) => child.id === selectedId) || students[0];
  const [showPaymentHub, setShowPaymentHub] = useState(false);
  const [termlyFees, setTermlyFees] = useState<any[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [feesError, setFeesError] = useState("");
  const [currentAcademicYear, setCurrentAcademicYear] = useState("");
  const [selectedTermForPayment, setSelectedTermForPayment] = useState<string>("");
  const [suggestedAmount, setSuggestedAmount] = useState<number>(0);
  const [feeSummary, setFeeSummary] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>("fees");

  // Fetch current academic year and fee structure
  useEffect(() => {
    if (selectedStudent) {
      fetchOverviewFeeData();
    }
  }, [selectedStudent, schoolCode]);

  const fetchOverviewFeeData = async () => {
    try {
      setLoadingFees(true);
      setFeesError("");
      const response = await fetch(`/api/schools/${schoolCode}/students/${selectedStudent.id}/fees`);
      if (!response.ok) throw new Error("Failed to fetch fees");
      const data = await response.json();
      setFeeSummary(data);

      // Determine academic year label
      const yearFromBalances = Array.isArray(data)
        ? (data[0]?.year ? String(data[0].year) : "")
        : (data?.termBalances?.[0]?.year ? String(data.termBalances[0].year) : "");
      setCurrentAcademicYear(yearFromBalances || new Date().getFullYear().toString());

      // Calculate current term balance (initial balance - payments)
      const balancesArray = Array.isArray(data) ? data : (data?.termBalances || []);
      const mapped = (balancesArray || []).map((t: any) => {
        const totalAmount = Number(t.totalAmount || t.amount || 0);
        const outstanding = Number(t.balance || t.outstanding || 0);
        
        // Use backend-calculated paidAmount if available, otherwise calculate
        const paidAmount = t.paidAmount !== undefined 
          ? Number(t.paidAmount) 
          : Math.max(0, totalAmount - outstanding);
        
        return {
          term: t.term,
          amount: totalAmount,
          paidAmount: paidAmount,
          outstanding: outstanding,
          dueDate: t.dueDate || new Date().toISOString(),
          status: outstanding <= 0 ? "Paid" : "Pending",
          breakdown: t.breakdown || {},
          termId: t.termId,
          academicYearId: t.academicYearId,
        };
      });
      setTermlyFees(mapped);

      // Track total academic year balance
      const totalAcademicYearBalance = mapped.reduce((sum: number, term: any) => sum + term.outstanding, 0);
      console.log('Total academic year outstanding balance:', totalAcademicYearBalance);
      
    } catch (error) {
      console.error("Error fetching fee data:", error);
      setFeesError("Failed to load fee structure. Please try again.");
      setTermlyFees([]);
    } finally {
      setLoadingFees(false);
    }
  };

  const handlePayNow = (term: string) => {
    setSelectedTermForPayment(term);
    const termData = termlyFees.find((t) => t.term === term);
    const outstanding = typeof termData?.outstanding === 'number' ? termData.outstanding : 0;
    const amount = outstanding > 0 ? outstanding : (typeof termData?.amount === 'number' ? termData.amount : 0);
    setSuggestedAmount(amount || 0);
    setShowPaymentHub(true);
    setActiveTab('payment');
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <Card className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="space-y-6 h-full flex flex-col p-6">
          {students.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <DollarSign className="w-16 h-16 text-slate-400 mb-4" />
              <p className="text-white font-medium text-lg">No children found</p>
              <p className="text-slate-300 text-sm mt-2">Please contact the school administration to register your children.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6">
              {/* Student Selection */}
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Select Student</label>
                <select
                  className="w-full p-4 border-2 border-white/30 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-300/50 focus:border-indigo-300 bg-white/10 backdrop-blur-sm text-white text-lg font-medium transition-all duration-200"
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                >
                  {students.map((child: any) => (
                    <option key={child.id} value={child.id} className="bg-slate-800 text-white">
                      {child.name || child.user?.name || child.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Student Details */}
              {selectedStudent && (
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl border border-white/30 overflow-hidden shadow-lg">
                  {/* Student Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">
                          {selectedStudent.name || selectedStudent.user?.name || "Student"}
                        </h3>
                        <p className="text-indigo-100 mt-1">
                          {selectedStudent.grade?.name || "Grade"} • {selectedStudent.studentId || "ID"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {selectedStudent.status || "Active"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Fee Management Tabs */}
                  <div className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="fees" className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Termly Fees
                        </TabsTrigger>
                        <TabsTrigger value="payment" className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Make Payment
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="fees" className="mt-4">
                        <div className="space-y-4">
                          <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-white mb-2">
                              Academic Year {currentAcademicYear} Fee Structure
                            </h3>
                            <p className="text-sm text-slate-300">
                              {selectedStudent?.grade?.name ? `${selectedStudent.grade.name} - ` : ""}
                              Select a term to view details and make payment
                            </p>
                          </div>
                          
                          {loadingFees ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                              <span className="ml-3 text-white">Loading fee structure...</span>
                            </div>
                          ) : feesError ? (
                            <div className="text-center py-8">
                              <div className="text-red-400 mb-4">
                                <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm">{feesError}</p>
                              </div>
                              <Button onClick={fetchOverviewFeeData} variant="outline" className="border-white text-white hover:bg-white/20 shadow-lg">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                              </Button>
                            </div>
                          ) : termlyFees.length === 0 ? (
                            <div className="text-center py-8">
                              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                              <p className="text-white">No fee structure found for this grade and academic year.</p>
                              <p className="text-sm text-slate-300 mt-2">Please contact the school administration.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {termlyFees.map((termFee, index) => (
                                <Card key={index} className="bg-white/15 backdrop-blur-md border-2 border-white/40 hover:border-indigo-300/70 transition-all duration-300 shadow-xl">
                                  <CardHeader className="pb-4 bg-gradient-to-r from-white/10 to-white/5">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-xl flex items-center gap-3 text-white font-bold">
                                        <Calendar className="w-5 h-5 text-indigo-300" />
                                        {termFee.term}
                                      </CardTitle>
                                      <Badge 
                                        variant={termFee.status === "Paid" ? "default" : "destructive"}
                                        className={`text-sm px-3 py-1 font-semibold ${termFee.status === "Paid" ? "bg-green-600 text-white shadow-lg" : "bg-red-600 text-white shadow-lg"}`}
                                      >
                                        {termFee.status}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="text-center bg-white/10 rounded-lg p-4">
                                      <div className="text-3xl font-bold text-white mb-1">
                                        KES {termFee.amount.toLocaleString()}
                                      </div>
                                      <div className="text-sm text-slate-300 font-medium">Total Amount</div>
                                    </div>

                                    {/* Payment Progress */}
                                    <div className="bg-white/5 rounded-lg p-3 space-y-3">
                                      <div className="flex justify-between text-base">
                                        <span className="text-white font-medium">Paid:</span>
                                        <span className="font-bold text-green-400 text-lg">KES {(termFee.paidAmount || 0).toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between text-base">
                                        <span className="text-white font-medium">Outstanding:</span>
                                        <span className={`font-bold text-lg ${termFee.outstanding > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                          KES {termFee.outstanding.toLocaleString()}
                                        </span>
                                      </div>
                                      
                                      {/* Progress Bar */}
                                      <div className="w-full bg-white/30 rounded-full h-3 mt-3">
                                        <div 
                                          className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500 shadow-lg" 
                                          style={{ 
                                            width: `${termFee.amount > 0 ? Math.min(((termFee.paidAmount || 0) / termFee.amount) * 100, 100) : 0}%` 
                                          }}
                                        ></div>
                                      </div>
                                      <div className="text-sm text-white text-center font-semibold">
                                        {termFee.paidAmount > termFee.amount ? (
                                          <>
                                            100% Paid
                                            <div className="text-xs text-green-300 mt-1">
                                              Overpaid: KES {((termFee.paidAmount || 0) - termFee.amount).toLocaleString()}
                                            </div>
                                          </>
                                        ) : (
                                          `${termFee.amount > 0 ? Math.round(((termFee.paidAmount || 0) / termFee.amount) * 100) : 0}% Paid`
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Fee Breakdown */}
                                    {termFee.breakdown && Object.keys(termFee.breakdown).length > 0 && (
                                      <div className="bg-white/5 rounded-lg p-3 space-y-2">
                                        <div className="text-sm font-semibold text-white mb-2">Fee Breakdown:</div>
                                        {Object.entries(termFee.breakdown).map(([key, value]) => (
                                          <div key={key} className="flex justify-between text-sm">
                                            <span className="capitalize text-slate-300 font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                            <span className="text-white font-bold">KES {Number(value).toLocaleString()}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    <div className="pt-4 border-t border-white/30">
                                      <div className="flex justify-between text-base text-white mb-3 bg-white/5 rounded-lg p-2">
                                        <span className="font-medium">Due Date:</span>
                                        <span className="font-bold">{new Date(termFee.dueDate).toLocaleDateString()}</span>
                                      </div>
                                      
                                      {termFee.outstanding <= 0 ? (
                                        <Button
                                          className="w-full bg-green-600 text-white cursor-not-allowed opacity-60"
                                          disabled
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Fully Paid
                                        </Button>
                                      ) : (
                                        <Button
                                          onClick={() => handlePayNow(termFee.term)}
                                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                                        >
                                          <CreditCard className="w-4 h-4 mr-2" />
                                          Pay KES {termFee.outstanding.toLocaleString()}
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="payment" className="mt-4">
                        {showPaymentHub ? (
                          <PaymentHub
                            studentId={selectedStudent.id}
                            schoolCode={schoolCode}
                            initialSelectedTerm={selectedTermForPayment}
                            initialAmount={suggestedAmount}
                            initialAcademicYear={currentAcademicYear}
                            onPaymentComplete={async (receipt) => {
                              console.log("Payment completed:", receipt);
                              
                              // Refresh fee data to show updated balances
                              await fetchOverviewFeeData();
                              
                              // Close payment hub and switch to fees tab to show updated data
                              setShowPaymentHub(false);
                              setActiveTab('fees');
                              
                              // Show success message with payment details
                              const termData = termlyFees.find(t => t.term === selectedTermForPayment);
                              const message = receipt.carryForward && receipt.carryForward > 0
                                ? `Payment successful! KES ${receipt.amount.toLocaleString()} paid. Overpayment of KES ${receipt.carryForward.toLocaleString()} carried forward to next term.`
                                : `Payment successful! KES ${receipt.amount.toLocaleString()} paid for ${selectedTermForPayment}.`;
                              
                              // You could add a toast notification here
                              console.log(message);
                            }}
                          />
                        ) : (
                          <div className="text-center py-8">
                            < CreditCard className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">Ready to Make Payment?</h3>
                            <p className="text-slate-300 mb-4">Select a term from the "Termly Fees" tab and click "Pay Now" to proceed with payment.</p>
                            <Button onClick={() => setShowPaymentHub(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">
                              <CreditCard className="w-4 h-4 mr-2" />
                              Open Payment Form
                            </Button>
                          </div>
                        )}
                      </TabsContent>


                    </Tabs>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 