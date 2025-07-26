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
import { Calendar, Download, DollarSign, Receipt, ChevronDown, FileText } from "lucide-react";
import { PaymentModal } from "@/components/payment/payment-modal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface FeesSectionProps {
  schoolCode: string;
  students: any[];
  focusedChildId: string | null;
  refreshFeeData: () => void;
}

export default function FeesSection({
  schoolCode,
  students,
  focusedChildId,
  refreshFeeData,
}: FeesSectionProps) {
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

  // Fetch fee statement for selected child/year/term
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

  // PDF export handler
  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
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
      {/* ... (rest of the code as in your ParentFeesPanel) ... */}
    </div>
  );
} 