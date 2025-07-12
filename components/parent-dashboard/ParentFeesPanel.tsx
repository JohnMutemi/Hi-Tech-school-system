import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Download,
  FileText,
  AlertCircle,
  DollarSign,
  Receipt,
  ChevronDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { PaymentModal } from "@/components/payment/payment-modal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ParentFeesPanelProps {
  schoolCode: string;
  students: any[];
  focusedChildId: string | null;
  studentFeeSummaries: any;
  refreshFeeData: () => void;
}

export function ParentFeesPanel({
  schoolCode,
  students,
  focusedChildId,
  studentFeeSummaries,
  refreshFeeData,
}: ParentFeesPanelProps) {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [filterLoading, setFilterLoading] = useState(true);
  const [filterError, setFilterError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);
  const [currentTerm, setCurrentTerm] = useState<any>(null);
  const [feeStructure, setFeeStructure] = useState<any>(null);
  const [statement, setStatement] = useState<any[]>([]);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementError, setStatementError] = useState("");
  const [feeSummary, setFeeSummary] = useState<any>(null);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<any>(null);
  const [selectedFeeStructureForPayment, setSelectedFeeStructureForPayment] = useState<any>(null);

  // Student selection logic
  const [localFocusedChildId, setLocalFocusedChildId] = useState<string>(
    focusedChildId || students[0]?.id || ""
  );
  useEffect(() => {
    if (focusedChildId) setLocalFocusedChildId(focusedChildId);
  }, [focusedChildId]);
  const child =
    students.find((c) => c.id === localFocusedChildId) || students[0];

  // Fetch current academic year and term
  useEffect(() => {
    async function fetchCurrent() {
      try {
        const [yearRes, termRes] = await Promise.all([
          fetch(`/api/schools/${schoolCode}?action=current-academic-year`),
          fetch(`/api/schools/${schoolCode}?action=current-term`),
        ]);
        if (!yearRes.ok || !termRes.ok) return;
        const yearData = await yearRes.json();
        const termData = await termRes.json();
        setCurrentAcademicYear(yearData);
        setCurrentTerm(termData);
        
        // Set current year as default selected year
        if (yearData) {
          setSelectedYearId(yearData.id);
        }
      } catch {}
    }
    fetchCurrent();
  }, [schoolCode]);

  // Fetch academic years and terms (only current and past years)
  useEffect(() => {
    async function fetchYearsAndTerms() {
      setFilterLoading(true);
      setFilterError("");
      try {
        const res = await fetch(`/api/schools/${schoolCode}/academic-years`);
        if (!res.ok) throw new Error("Failed to fetch academic years");
        const years = await res.json();
        
        // Filter to only show current and past years
        const currentYear = new Date().getFullYear();
        const filteredYears = years.filter((y: any) => {
          const yearNumber = parseInt(y.name);
          return yearNumber <= currentYear;
        });
        
        setAcademicYears(filteredYears);
        
        // Set current year as default
        const current = filteredYears.find((y: any) => y.isCurrent);
        const defaultYearId = current?.id || filteredYears[0]?.id || "";
        setSelectedYearId(defaultYearId);
        
        if (defaultYearId) {
          const tRes = await fetch(
            `/api/schools/${schoolCode}/terms?yearId=${defaultYearId}`
          );
          if (!tRes.ok) throw new Error("Failed to fetch terms");
          const t = await tRes.json();
          setTerms(t);
          const currentTerm = t.find((term: any) => term.isCurrent);
          setSelectedTermId(currentTerm?.id || t[0]?.id || "");
        }
      } catch (err: any) {
        setFilterError(err.message || "Unknown error");
      } finally {
        setFilterLoading(false);
      }
    }
    if (schoolCode) fetchYearsAndTerms();
  }, [schoolCode]);

  // When year changes, fetch terms
  useEffect(() => {
    async function fetchTerms() {
      if (!selectedYearId) return;
      setFilterLoading(true);
      setFilterError("");
      try {
        const tRes = await fetch(
          `/api/schools/${schoolCode}/terms?yearId=${selectedYearId}`
        );
        if (!tRes.ok) throw new Error("Failed to fetch terms");
        const t = await tRes.json();
        setTerms(t);
        const currentTerm = t.find((term: any) => term.isCurrent);
        setSelectedTermId(currentTerm?.id || t[0]?.id || "");
      } catch (err: any) {
        setFilterError(err.message || "Unknown error");
      } finally {
        setFilterLoading(false);
      }
    }
    fetchTerms();
  }, [selectedYearId, schoolCode]);

  // Fetch fee structure for selected child/year/term
  useEffect(() => {
    async function fetchFeeStructure() {
      const child =
        students.find((c) => c.id === localFocusedChildId) || students[0];
      if (!child || !selectedYearId || !selectedTermId) return;
      try {
        const res = await fetch(
          `/api/schools/${schoolCode}/fee-structure?academicYearId=${selectedYearId}&termId=${selectedTermId}&gradeId=${child.gradeId}`
        );
        if (!res.ok) throw new Error("Failed to fetch fee structure");
        const data = await res.json();
        setFeeStructure(data[0] || null);
      } catch {
        setFeeStructure(null);
      }
    }
    fetchFeeStructure();
  }, [
    schoolCode,
    students,
    localFocusedChildId,
    selectedYearId,
    selectedTermId,
  ]);

  // Top-level async function to fetch fee statement for selected child (current year only)
  async function fetchStatement() {
    setStatementLoading(true);
    setStatementError("");
    const child = students.find((c) => c.id === localFocusedChildId) || students[0];
    if (!child || !currentAcademicYear) return;
    try {
      const url = `/api/schools/${schoolCode}/students/${child.id}/fee-statement?academicYearId=${currentAcademicYear.id}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch fee statement");
      const data = await res.json();
      setStatement(data || []);
    } catch (err: any) {
      setStatementError(err.message || "Unknown error");
    } finally {
      setStatementLoading(false);
    }
  }

  // Top-level async function to fetch fee summary for selected child
  async function fetchFeeSummary() {
    const child = students.find((c) => c.id === localFocusedChildId) || students[0];
    if (!child || !currentAcademicYear) return;
    try {
      const res = await fetch(
        `/api/schools/${schoolCode}/students/${child.id}/fees?academicYearId=${currentAcademicYear.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch fee summary");
      const data = await res.json();
      setFeeSummary(data);
    } catch {}
  }

  // Fetch fee statement for selected child (current year only)
  useEffect(() => {
    fetchStatement();
  }, [schoolCode, students, localFocusedChildId, currentAcademicYear]);

  // Fetch fee summary for selected child
  useEffect(() => {
    fetchFeeSummary();
  }, [schoolCode, students, localFocusedChildId, currentAcademicYear]);

  // Use new fields from /fees
  const academicYearOutstanding = feeSummary?.academicYearOutstanding || 0;
  const termBalances = feeSummary?.termBalances || [];
  const arrears = feeSummary?.arrears || 0;
  // Always use the current active term from DB for Current Term Due
  const currentTermId = currentTerm?.id;
  const currentTermSummary = termBalances.find(
    (f: any) => f.termId === currentTermId
  );
  const outstandingFees = currentTermSummary?.balance || 0;

  // Calculate totals for statement
  const totalDebit = statement.reduce(
    (sum, item) => sum + (item.debit || 0),
    0
  );
  const totalCredit = statement.reduce(
    (sum, item) => sum + (item.credit || 0),
    0
  );
  const totalBalance =
    statement.length > 0 ? statement[statement.length - 1].balance || 0 : 0;
  // Use statement's last balance as total outstanding
  const totalOutstanding = totalBalance;

  // Handle payment button click
  const handlePaymentClick = (student: any, feeStructure: any) => {
    setSelectedStudentForPayment(student);
    setSelectedFeeStructureForPayment(feeStructure);
    setShowPaymentModal(true);
  };

  // Handle payment modal close
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setSelectedStudentForPayment(null);
    setSelectedFeeStructureForPayment(null);

    // Refresh all fee data after payment
    if (typeof refreshFeeData === 'function') {
      refreshFeeData();
    }
    // Also refresh local data
    fetchFeeSummary();
    fetchStatement();
  };

  // PDF export handler
  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    // Fallback: Draw 'LOGO HERE' as placeholder for future logo
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("LOGO HERE", 12, 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("Fee Statement", 60, 20);
    doc.setFontSize(10);
    doc.text(`Student: ${child?.fullName || child?.name || ""}`, 60, 28);
    doc.text(`Class: ${child?.gradeName || ""}`, 60, 34);
    doc.text(
      `Period: ${currentAcademicYear?.name || ""} ${
        terms.find((t) => t.id === selectedTermId)?.name || ""
      }`,
      60,
      40
    );
    autoTable(doc, {
      startY: 45,
      head: [
        [
          "No",
          "Date",
          "Description",
          "Debit (KES)",
          "Credit (KES)",
          "Balance (KES)",
        ],
      ],
      body: statement.map((item) => [
        item.no || "",
        item.date ? new Date(item.date).toLocaleDateString() : "",
        item.description || "",
        item.debit ? item.debit.toLocaleString() : "",
        item.credit ? item.credit.toLocaleString() : "",
        item.balance ? item.balance.toLocaleString() : "",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    });
    doc.save(`fee-statement-${child?.fullName || child?.name || ""}.pdf`);
  };

  // Get current year fee structures for the student
  const getCurrentYearFeeStructures = () => {
    if (!child || !currentAcademicYear) return [];
    
    const currentYear = currentAcademicYear.name;
    const termBalances = feeSummary?.termBalances || [];
    
    // Filter to only show current year terms
    return termBalances.filter((term: any) => {
      return term.year === parseInt(currentYear);
    });
  };

  const currentYearFeeStructures = getCurrentYearFeeStructures();

  // Debug logging
  console.log('ParentFeesPanel Debug:', {
    child,
    currentAcademicYear,
    feeSummary,
    termBalances: feeSummary?.termBalances || [],
    currentYearFeeStructures,
    academicYearOutstanding,
    outstandingFees
  });

  return (
    <div className="space-y-6">
      {/* Current Year Fee Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Academic Year ({currentAcademicYear?.name || "Loading..."})
          </CardTitle>
          <CardDescription>
            Fee status for the current academic year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Total Outstanding</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                KES {academicYearOutstanding.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-800">Current Term Due</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                KES {outstandingFees.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-800">Arrears</span>
              </div>
              <div className="text-2xl font-bold text-red-900">
                KES {arrears.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Overpayment Information */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Payment Information</h4>
                <p className="text-sm text-yellow-700">
                  • You can only pay for the current term fees<br/>
                  • If you pay more than the current term amount, the excess will be applied to the next term's balance<br/>
                  • Previous term arrears are automatically carried forward
                </p>
              </div>
            </div>
          </div>

          {/* Current Term Quick Payment */}
          {outstandingFees > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">Current Term Payment</h4>
                  <p className="text-sm text-blue-700">
                    Pay fees for {currentTerm?.name || "current term"} - {currentAcademicYear?.name || "this academic year"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Overpayment will be applied to the next term's balance
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const currentTermFee = currentYearFeeStructures.find((f: any) => f.termId === currentTerm?.id);
                    if (currentTermFee) {
                      handlePaymentClick(child, currentTermFee);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pay Current Term (KES {outstandingFees.toLocaleString()})
                </Button>
              </div>
            </div>
          )}

          {/* Current Year Fee Structures */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Term-wise Fee Structure</h3>
            </div>
            {currentYearFeeStructures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No fee structures found for the current academic year.</p>
                {outstandingFees > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Current term outstanding: KES {outstandingFees.toLocaleString()}
                    </p>
                    <Button
                      onClick={() => {
                        const currentTermFee = currentYearFeeStructures.find((f: any) => f.termId === currentTerm?.id);
                        if (currentTermFee) {
                          handlePaymentClick(child, currentTermFee);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Pay Current Term
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentYearFeeStructures.map((termFee: any, index: number) => {
                  const isCurrentTerm = termFee.termId === currentTerm?.id;
                  const isPaid = termFee.balance <= 0;
                  
                  return (
                    <Card key={index} className={`${isCurrentTerm ? 'ring-2 ring-blue-500' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {termFee.term} {termFee.year}
                          </CardTitle>
                          {isCurrentTerm && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              Current
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Amount:</span>
                          <span className="font-semibold">
                            KES {termFee.totalAmount?.toLocaleString() || '0'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Balance:</span>
                          <span className={`font-semibold ${termFee.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            KES {termFee.balance?.toLocaleString() || '0'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isPaid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {isPaid ? 'Fully Paid' : 'Outstanding'}
                          </span>
                        </div>
                        
                        {/* Payment Button - Show for any term with outstanding balance */}
                        {termFee.balance > 0 && (
                          <Button
                            onClick={() => handlePaymentClick(child, termFee)}
                            className="w-full mt-2"
                            size="sm"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            {isCurrentTerm ? 'Pay Current Term' : 'Pay Term Fees'}
                          </Button>
                        )}
                        
                        {/* Show overpayment info for current term */}
                        {isCurrentTerm && termFee.balance <= 0 && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                            <span className="text-xs text-green-700">Fully Paid</span>
                          </div>
                        )}
                        
                        {/* Show previous term status */}
                        {!isCurrentTerm && (
                          <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-center">
                            <span className="text-xs text-gray-600">
                              {termFee.balance > 0 ? 'Outstanding' : 'Paid'}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fee Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fee Statement ({currentAcademicYear?.name || "Current Year"})
            </span>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </CardTitle>
          <CardDescription>
            Detailed transaction history for the current academic year
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statementLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading fee statement...</p>
            </div>
          ) : statementError ? (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>{statementError}</p>
            </div>
          ) : statement.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No transactions found for the current academic year.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">No</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Debit (KES)</th>
                    <th className="text-right py-2">Credit (KES)</th>
                    <th className="text-right py-2">Balance (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2">{item.no || index + 1}</td>
                      <td className="py-2">
                        {item.date ? new Date(item.date).toLocaleDateString() : ""}
                      </td>
                      <td className="py-2">{item.description || ""}</td>
                      <td className="py-2 text-right">
                        {item.debit ? item.debit.toLocaleString() : ""}
                      </td>
                      <td className="py-2 text-right">
                        {item.credit ? item.credit.toLocaleString() : ""}
                      </td>
                      <td className="py-2 text-right font-semibold">
                        {item.balance ? item.balance.toLocaleString() : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {selectedStudentForPayment && selectedFeeStructureForPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentModalClose}
          studentId={selectedStudentForPayment.id}
          schoolCode={schoolCode}
          amount={selectedFeeStructureForPayment.balance || selectedFeeStructureForPayment.totalAmount}
          feeType={`${selectedFeeStructureForPayment.term} ${selectedFeeStructureForPayment.year} Fees`}
          term={selectedFeeStructureForPayment.term}
          academicYear={selectedFeeStructureForPayment.year?.toString() || currentAcademicYear?.name}
          onReceiptGenerated={handlePaymentModalClose}
        />
      )}
    </div>
  );
}
