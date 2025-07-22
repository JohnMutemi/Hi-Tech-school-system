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

  // Student selection logic
  const [localFocusedChildId, setLocalFocusedChildId] = useState<string>(
    focusedChildId || students[0]?.id || ""
  );
  useEffect(() => {
    if (focusedChildId) setLocalFocusedChildId(focusedChildId);
  }, [focusedChildId]);
  const child =
    students.find((c) => c.id === localFocusedChildId) || students[0];

  // Fetch academic years and terms
  useEffect(() => {
    async function fetchYearsAndTerms() {
      setFilterLoading(true);
      setFilterError("");
      try {
        const res = await fetch(`/api/schools/${schoolCode}/academic-years`);
        if (!res.ok) throw new Error("Failed to fetch academic years");
        const years = await res.json();
        setAcademicYears(years);
        const current = years.find((y: any) => y.isCurrent);
        const defaultYearId = current?.id || years[0]?.id || "";
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

  // Fetch current academic year and term
  useEffect(() => {
    async function fetchCurrent() {
      try {
        const [yearRes, termRes] = await Promise.all([
          fetch(`/api/schools/${schoolCode}?action=current-academic-year`),
          fetch(`/api/schools/${schoolCode}?action=current-term`),
        ]);
        if (!yearRes.ok || !termRes.ok) return;
        setCurrentAcademicYear(await yearRes.json());
        setCurrentTerm(await termRes.json());
      } catch {}
    }
    fetchCurrent();
  }, [schoolCode]);

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

  // Fetch fee statement for selected child/year/term (new professional statement)
  useEffect(() => {
    async function fetchStatement() {
      setStatementLoading(true);
      setStatementError("");
      const child =
        students.find((c) => c.id === localFocusedChildId) || students[0];
      if (!child) return;
      try {
        const url = `/api/schools/${schoolCode}/students/${child.id}/fee-statement`;
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
    fetchStatement();
  }, [schoolCode, students, localFocusedChildId]);

  // Fetch fee summary for selected child
  useEffect(() => {
    async function fetchFeeSummary() {
      const child =
        students.find((c) => c.id === localFocusedChildId) || students[0];
      if (!child) return;
      try {
        const res = await fetch(
          `/api/schools/${schoolCode}/students/${child.id}/fees`
        );
        if (!res.ok) throw new Error("Failed to fetch fee summary");
        const data = await res.json();
        setFeeSummary(data);
      } catch {}
    }
    fetchFeeSummary();
  }, [schoolCode, students, localFocusedChildId]);

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
  const outstanding = feeSummary?.outstanding || 0;

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
  // const outstanding = totalBalance; // This line is removed

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
          "No.",
          "Ref",
          "Date",
          "Description",
          "Debit (KES)",
          "Credit (KES)",
          "Balance (KES)",
        ],
      ],
      body: [
        ...statement.map((item: any) => [
          item.no,
          item.ref,
          new Date(item.date).toLocaleDateString(),
          item.description,
          item.debit ? item.debit.toLocaleString() : "-",
          item.credit ? item.credit.toLocaleString() : "-",
          item.balance?.toLocaleString() || "-",
        ]),
        [
          {
            content: "TOTAL",
            colSpan: 4,
            styles: { halign: "right", fontStyle: "bold" },
          },
          totalDebit ? totalDebit.toLocaleString() : "-",
          totalCredit ? totalCredit.toLocaleString() : "-",
          totalBalance ? totalBalance.toLocaleString() : "-",
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [44, 62, 80] },
      styles: { fontSize: 9 },
      didDrawCell: (data) => {
        if (data.row.index === statement.length) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    doc.save(`Fee_Statement_${child?.fullName || child?.name || ""}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Student Details Section */}
      <Card className="mb-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-0 shadow-md">
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-200 w-14 h-14 flex items-center justify-center text-2xl font-bold text-blue-700 shadow">
              {child?.fullName?.[0] || child?.name?.[0] || "?"}
            </div>
            <div>
              <div className="text-lg font-bold text-blue-900">
                {child?.fullName || child?.name}
              </div>
              <div className="text-blue-700 font-semibold text-sm">
                {child?.gradeName}
              </div>
              <div className="text-xs text-gray-500">
                Adm: {child?.admissionNumber}
              </div>
            </div>
          </div>
          {students.length > 1 && (
            <div className="mt-4 md:mt-0">
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                Select Child
              </label>
              <select
                className="border rounded-lg px-4 py-2 bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={localFocusedChildId}
                onChange={(e) => setLocalFocusedChildId(e.target.value)}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName || s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Fee Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Fee Management</h2>
        <Button
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold"
          onClick={() => setShowPaymentModal(true)}
        >
          <DollarSign className="w-5 h-5 mr-2" /> Pay Fee
        </Button>
      </div>

      {/* 1. Current Academic Year Fee Structure */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Fee Structure for {currentAcademicYear?.name || "-"}
          </CardTitle>
          <CardDescription>
            <div className="flex flex-wrap gap-4 items-center mt-2">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">
                  Term
                </label>
                <div className="relative">
                  <select
                    className="appearance-none border rounded-lg px-4 py-2 pr-8 bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={selectedTermId}
                    onChange={(e) => setSelectedTermId(e.target.value)}
                    disabled={filterLoading || terms.length === 0}
                  >
                    {terms.map((term: any) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={18}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="ml-2 flex items-center gap-2"
                onClick={() => {
                  /* TODO: Download fee structure as PDF */
                }}
              >
                <Download className="w-4 h-4" /> Download
              </Button>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feeStructure ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-4 items-center">
                <Badge className="bg-purple-100 text-purple-700 font-medium">
                  {feeStructure.gradeName}
                </Badge>
                <span className="text-gray-600">
                  Due:{" "}
                  {feeStructure.dueDate
                    ? new Date(feeStructure.dueDate).toLocaleDateString()
                    : "-"}
                </span>
                <span className="text-gray-600">
                  Total:{" "}
                  <span className="font-bold text-blue-700">
                    KES {feeStructure.totalAmount?.toLocaleString()}
                  </span>
                </span>
                <span className="text-gray-600">
                  Status:{" "}
                  <span
                    className={
                      feeStructure.isActive
                        ? "text-green-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {feeStructure.isActive ? "Active" : "Inactive"}
                  </span>
                </span>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.isArray(feeStructure.breakdown)
                    ? feeStructure.breakdown.map((item: any, idx: number) => (
                        <div
                          key={item.name + idx}
                          className="flex justify-between bg-blue-50 rounded px-3 py-2"
                        >
                          <span className="capitalize text-gray-700">
                            {item.name}
                          </span>
                          <span className="font-bold text-blue-700">
                            KES {Number(item.value).toLocaleString()}
                          </span>
                        </div>
                      ))
                    : Object.entries(feeStructure.breakdown || {}).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between bg-blue-50 rounded px-3 py-2"
                          >
                            <span className="capitalize text-gray-700">
                              {key}
                            </span>
                            <span className="font-bold text-blue-700">
                              KES {(value as number).toLocaleString()}
                            </span>
                          </div>
                        )
                      )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">
              No fee structure found for this term.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Child's Balance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Outstanding Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-8 items-center text-lg">
            <div>
              <span className="font-semibold">
                🧾 Total Arrears (Past Terms):
              </span>{" "}
              <span className="text-orange-600 font-bold">
                KES {arrears.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-semibold">🕓 Current Term Due:</span>{" "}
              <span className="text-red-600 font-bold">
                KES {outstandingFees.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-semibold">Total Outstanding:</span>{" "}
              <span className="text-blue-700 font-bold">
                KES {outstanding.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Fee Statement */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-purple-600" />
            Fee Statement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleDownloadPDF}
            >
              <FileText className="w-4 h-4" /> Download Statement
            </Button>
          </div>
          {statementLoading ? (
            <div className="text-gray-500">Loading statement...</div>
          ) : statementError ? (
            <div className="text-red-600">{statementError}</div>
          ) : statement.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border" title="Row number">
                      No.
                    </th>
                    <th
                      className="p-2 border"
                      title="Reference number (invoice, payment, or receipt)"
                    >
                      Ref
                    </th>
                    <th className="p-2 border" title="Transaction date">
                      Date
                    </th>
                    <th className="p-2 border" title="Transaction details">
                      Description
                    </th>
                    <th className="p-2 border" title="Amount charged">
                      Debit
                    </th>
                    <th className="p-2 border" title="Amount paid">
                      Credit
                    </th>
                    <th
                      className="p-2 border"
                      title="Running balance after transaction"
                    >
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statement.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2 border text-center">{item.no}</td>
                      <td className="p-2 border text-xs font-mono">
                        {item.ref}
                      </td>
                      <td className="p-2 border">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="p-2 border">{item.description}</td>
                      <td className="p-2 border text-red-600 text-right">
                        {item.debit
                          ? `KES ${item.debit.toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="p-2 border text-green-600 text-right">
                        {item.credit
                          ? `KES ${item.credit.toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="p-2 border font-bold text-right">
                        KES {item.balance?.toLocaleString() || "-"}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="font-bold bg-gray-50">
                    <td className="p-2 border text-right" colSpan={4}>
                      TOTAL
                    </td>
                    <td className="p-2 border text-red-600 text-right">
                      {totalDebit ? `KES ${totalDebit.toLocaleString()}` : "-"}
                    </td>
                    <td className="p-2 border text-green-600 text-right">
                      {totalCredit
                        ? `KES ${totalCredit.toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="p-2 border font-bold text-right">
                      KES {totalBalance ? totalBalance.toLocaleString() : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500">
              No transactions found for this student.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && child && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          studentId={child.id}
          schoolCode={schoolCode}
          amount={feeStructure?.totalAmount || 0}
          feeType="School Fees"
          term={terms.find((t) => t.id === selectedTermId)?.name || ""}
          academicYear={
            academicYears.find((y) => y.id === selectedYearId)?.name || ""
          }
          onReceiptGenerated={refreshFeeData}
        />
      )}
    </div>
  );
}
