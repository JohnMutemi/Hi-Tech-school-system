import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, History, Download, Receipt, Calendar, BookOpen, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
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
        // Backend returns 'balance' as outstanding amount, calculate paid amount
        const outstanding = Number(t.balance || t.outstanding || 0);
        const paidAmount = Math.max(0, totalAmount - outstanding);
        
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
    <div className="h-full flex flex-col space-y-8">
      <Card className="flex-1 bg-gradient-to-br from-green-50/90 via-emerald-50/90 to-teal-50/90 border-green-200/60 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-green-800 text-xl">
            <DollarSign className="w-7 h-7 text-green-600" /> 
            Fee Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 h-full flex flex-col">
          {students.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium text-lg">No children found</p>
              <p className="text-gray-400 text-sm mt-2">Please contact the school administration to register your children.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6">
              {/* Student Selection */}
              <div className="bg-white/70 rounded-lg p-4 border border-green-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Select Student</label>
                <select
                  className="w-full p-4 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-400 bg-white text-gray-900 text-lg font-medium transition-all duration-200"
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                >
                  {students.map((child: any) => (
                    <option key={child.id} value={child.id}>
                      {child.name || child.user?.name || child.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Student Details */}
              {selectedStudent && (
                <div className="flex-1 bg-white rounded-xl border-2 border-green-100 overflow-hidden shadow-lg">
                  {/* Student Header */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">
                          {selectedStudent.name || selectedStudent.user?.name || "Student"}
                        </h3>
                        <p className="text-green-100 mt-1">
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
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="fees" className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Termly Fees
                        </TabsTrigger>
                        <TabsTrigger value="payment" className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Make Payment
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                          <History className="w-4 h-4" />
                          Payment History
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="fees" className="mt-4">
                        <div className="space-y-4">
                          <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                              Academic Year {currentAcademicYear} Fee Structure
                            </h3>
                            <p className="text-sm text-gray-600">
                              {selectedStudent?.grade?.name ? `${selectedStudent.grade.name} - ` : ""}
                              Select a term to view details and make payment
                            </p>
                          </div>
                          
                          {loadingFees ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                              <span className="ml-3 text-gray-600">Loading fee structure...</span>
                            </div>
                          ) : feesError ? (
                            <div className="text-center py-8">
                              <div className="text-red-500 mb-4">
                                <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-sm">{feesError}</p>
                              </div>
                              <Button onClick={fetchOverviewFeeData} variant="outline">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                              </Button>
                            </div>
                          ) : termlyFees.length === 0 ? (
                            <div className="text-center py-8">
                              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">No fee structure found for this grade and academic year.</p>
                              <p className="text-sm text-gray-400 mt-2">Please contact the school administration.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {termlyFees.map((termFee, index) => (
                                <Card key={index} className="border-2 hover:border-green-300 transition-colors">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-green-600" />
                                        {termFee.term}
                                      </CardTitle>
                                      <Badge 
                                        variant={termFee.status === "Paid" ? "default" : "destructive"}
                                        className="text-xs"
                                      >
                                        {termFee.status}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-green-600">
                                        KES {termFee.amount.toLocaleString()}
                                      </div>
                                      <div className="text-sm text-gray-500">Total Amount</div>
                                    </div>

                                    {/* Payment Progress */}
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span>Paid:</span>
                                        <span className="font-medium text-blue-600">KES {(termFee.paidAmount || 0).toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>Outstanding:</span>
                                        <span className={`font-medium ${termFee.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                          KES {termFee.outstanding.toLocaleString()}
                                        </span>
                                      </div>
                                      
                                      {/* Progress Bar */}
                                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                        <div 
                                          className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                          style={{ 
                                            width: `${termFee.amount > 0 ? ((termFee.paidAmount || 0) / termFee.amount) * 100 : 0}%` 
                                          }}
                                        ></div>
                                      </div>
                                      <div className="text-xs text-gray-500 text-center">
                                        {termFee.amount > 0 ? Math.round(((termFee.paidAmount || 0) / termFee.amount) * 100) : 0}% Paid
                                      </div>
                                    </div>
                                    
                                    {/* Fee Breakdown */}
                                    {termFee.breakdown && Object.keys(termFee.breakdown).length > 0 && (
                                      <div className="space-y-1">
                                        <div className="text-xs font-medium text-gray-700 mb-1">Breakdown:</div>
                                        {Object.entries(termFee.breakdown).map(([key, value]) => (
                                          <div key={key} className="flex justify-between text-xs">
                                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                            <span>KES {Number(value).toLocaleString()}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    <div className="pt-3 border-t">
                                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                                        <span>Due Date:</span>
                                        <span>{new Date(termFee.dueDate).toLocaleDateString()}</span>
                                      </div>
                                      
                                      {termFee.outstanding <= 0 ? (
                                        <Button
                                          className="w-full bg-green-100 text-green-800 cursor-not-allowed"
                                          disabled
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Fully Paid
                                        </Button>
                                      ) : (
                                        <Button
                                          onClick={() => handlePayNow(termFee.term)}
                                          className="w-full bg-green-600 hover:bg-green-700"
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
                            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Make Payment?</h3>
                            <p className="text-gray-600 mb-4">Select a term from the "Termly Fees" tab and click "Pay Now" to proceed with payment.</p>
                            <Button onClick={() => setShowPaymentHub(true)} className="bg-green-600 hover:bg-green-700">
                              <CreditCard className="w-4 h-4 mr-2" />
                              Open Payment Form
                            </Button>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="history" className="mt-4">
                        <PaymentHub
                          studentId={selectedStudent.id}
                          schoolCode={schoolCode}
                          onPaymentComplete={(receipt) => {
                            console.log("Payment completed:", receipt);
                          }}
                        />
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