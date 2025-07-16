"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Camera,
  Users,
  DollarSign,
  Receipt,
  BarChart2,
  Key,
  LogOut,
  Calendar,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  ChevronDown,
  Sparkles,
  GraduationCap,
  School,
  BookOpen,
  Settings,
} from "lucide-react";
import { ReceiptView } from "@/components/ui/receipt-view";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaymentModal } from "@/components/payment/payment-modal";
import { ParentFeesPanel } from "./ParentFeesPanel";
import { ParentSidebar } from "./ParentSidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FeeStructure {
  id: string;
  term: string;
  year: number;
  gradeId: string;
  gradeName: string;
  totalAmount: number;
  breakdown: Record<string, number>;
  isActive: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

function ChildOverview({
  child,
  outstandingFees = 0,
  feeStructure,
}: {
  child: any;
  outstandingFees?: number;
  feeStructure?: any;
}) {
  if (!child) return null;
  // Mock data for grade and attendance (replace with real data if available)
  const recentGrade = child.recentGrade || "B+";
  const attendance = child.attendance || 96;
  return (
    <div className="mb-8 flex flex-col md:flex-row gap-6 items-stretch">
      <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col md:flex-row gap-6 items-center">
        <Avatar className="w-20 h-20 mr-4">
          <img
            src={child.avatarUrl || "/placeholder-user.jpg"}
            alt={child.fullName || child.name}
            className="rounded-full object-cover w-full h-full"
          />
        </Avatar>
        <div className="flex-1">
          <div className="font-bold text-lg">
            {child.fullName || child.name}
          </div>
          <div className="text-blue-700 font-semibold text-sm">
            {child.gradeName}
          </div>
          <div className="text-xs text-gray-500">
            Adm: {child.admissionNumber}
          </div>
          <div className="text-xs text-gray-700 mt-2">
            Gender: {child.gender}
            <br />
            Date of Birth:{" "}
            {child.dateOfBirth ? child.dateOfBirth.split("T")[0] : ""}
            <br />
            Date Admitted:{" "}
            {child.dateAdmitted ? child.dateAdmitted.split("T")[0] : ""}
          </div>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col gap-4 justify-center">
        <div className="font-semibold text-gray-700 mb-2">Quick Stats</div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center bg-blue-50 rounded px-3 py-2">
            <span>Outstanding Fees</span>
            <span className="text-red-600 font-bold">
              KES {outstandingFees.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center bg-purple-50 rounded px-3 py-2">
            <span>Recent Grade</span>
            <span className="font-bold">{recentGrade}</span>
          </div>
          <div className="flex justify-between items-center bg-green-50 rounded px-3 py-2">
            <span>Attendance</span>
            <span className="font-bold text-green-700">{attendance}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to extract grade from class name (e.g., 'Grade 1A' -> 'Grade 1')
function extractGrade(classNameOrLevel: string) {
  if (!classNameOrLevel) return "";
  // Match 'Grade X' or 'Form X' at the start
  const match = classNameOrLevel.match(/^(Grade|Form) \d+/i);
  return match ? match[0] : classNameOrLevel;
}

// Helper to get the next unpaid/current term for a student
function getCurrentTermForStudent(feeSummary: any[]) {
  const termOrder = ["Term 1", "Term 2", "Term 3"];
  // Sort by year and then by term order
  const sorted = [...feeSummary].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return termOrder.indexOf(a.term) - termOrder.indexOf(b.term);
  });
  // Find the first term with balance > 0
  const current = sorted.find((f) => f.balance > 0);
  return current || sorted[sorted.length - 1]; // If all paid, return last term
}

export function ParentDashboard({
  schoolCode,
  parentId,
}: {
  schoolCode: string;
  parentId?: string;
}) {
  const [parent, setParent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [schoolName, setSchoolName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loadingFees, setLoadingFees] = useState(true);
  const [pendingParentCredentials, setPendingParentCredentials] = useState<{
    phone: string;
    tempPassword: string;
  } | null>(null);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedFeeStructure, setSelectedFeeStructure] =
    useState<FeeStructure | null>(null);

  // Add state for selected section and selected child
  const [focusedChildId, setFocusedChildId] = useState<string | null>(null);

  const [studentFeeData, setStudentFeeData] = useState<any>({});

  // Add state for current academic year and term
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);
  const [currentTerm, setCurrentTerm] = useState<any>(null);
  const [loadingAcademicInfo, setLoadingAcademicInfo] = useState(true);
  const [academicInfoError, setAcademicInfoError] = useState("");

  // Add state for academic year/term filters
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [filterLoading, setFilterLoading] = useState(true);
  const [filterError, setFilterError] = useState("");
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [receiptsError, setReceiptsError] = useState("");

  // Add state for search
  const [receiptSearch, setReceiptSearch] = useState("");

  // Add state for student fee summaries
  const [studentFeeSummaries, setStudentFeeSummaries] = useState<any>({});

  // Calculate total outstanding fees across all children
  const totalOutstandingFees = students.reduce((total, student) => {
    const termBalances = studentFeeSummaries[student.id]?.termBalances || [];
    const currentTermId = currentTerm?.id;
    const currentTermSummary = termBalances.find(
      (f: any) => f.termId === currentTermId
    );
    const outstandingFees = currentTermSummary ? currentTermSummary.balance : 0;
    return total + outstandingFees;
  }, 0);

  // Calculate total payments from receipts
  const totalPayments = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  // Get recent activity (last 5 receipts)
  const recentActivity = receipts.slice(0, 5);

  // Fetch session and parent data
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/schools/${schoolCode}/parents/session`);
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        const data = await res.json();
        setParent(data.parent);
        setStudents(data.students || []);
        setSchoolName(data.schoolName || "");
        if (data.students && data.students.length > 0) {
          setFocusedChildId(data.students[0].id);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Session fetch error:", error);
        router.push(`/schools/${schoolCode}/parent/login`);
      }
    }
    fetchSession();
  }, [schoolCode, router]);

  // Fetch fee structures
  useEffect(() => {
    if (students.length > 0) {
      fetchFeeStructures(students);
    }
  }, [students]);

  // Event listener for fee structure updates
  useEffect(() => {
    const handleFeeStructureUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.type === "feeStructureUpdated") {
        fetchFeeStructures(students);
      }
    };

    window.addEventListener("feeStructureUpdated", handleFeeStructureUpdate as EventListener);
    return () => {
      window.removeEventListener("feeStructureUpdated", handleFeeStructureUpdate as EventListener);
    };
  }, [students]);

  // Refresh fees function
  const handleRefreshFees = async () => {
    if (students.length > 0) {
      await fetchFeeStructures(students);
      await fetchStudentFeeSummaries();
    }
  };

  // Fetch fee structures for students
  const fetchFeeStructures = async (studentList: any[]) => {
    setLoadingFees(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/fee-structure`);
      if (!res.ok) {
        throw new Error("Failed to fetch fee structures");
      }
      const data = await res.json();
      setFeeStructures(data);

      // Map fee structures to students
      const studentFeeData: any = {};
      studentList.forEach((student) => {
        const studentFeeStructure = data.find(
          (fs: any) => fs.gradeId === student.gradeId
        );
        if (studentFeeStructure) {
          studentFeeData[student.id] = studentFeeStructure;
        }
      });
      setStudentFeeData(studentFeeData);
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      toast({
        title: "Error",
        description: "Failed to load fee structures",
        variant: "destructive",
      });
    } finally {
      setLoadingFees(false);
    }
  };

  // Fetch student fee summaries
  const fetchStudentFeeSummaries = async () => {
    if (students.length === 0) return;

    try {
      const summaries: any = {};
      for (const student of students) {
        try {
          const res = await fetch(
            `/api/schools/${schoolCode}/students/${student.id}/fees`
          );
          if (res.ok) {
            const data = await res.json();
            summaries[student.id] = data;
          }
        } catch (error) {
          console.error(`Error fetching fees for student ${student.id}:`, error);
        }
      }
      setStudentFeeSummaries(summaries);
    } catch (error) {
      console.error("Error fetching student fee summaries:", error);
    }
  };

  // Get student fee structure
  const getStudentFeeStructure = (studentId: string) => {
    return studentFeeData[studentId];
  };

  // Handle opening payment modal
  const handleOpenPaymentModal = (student: any) => {
    const feeStructure = getStudentFeeStructure(student.id);
    if (!feeStructure) {
      toast({
        title: "No Fee Structure",
        description: "No fee structure found for this student's grade",
        variant: "destructive",
      });
      return;
    }
    setSelectedStudent(student);
    setSelectedFeeStructure(feeStructure);
    setPaymentModalOpen(true);
  };

  // Handle payment success
  const handlePaymentSuccess = async (payment: any) => {
    toast({
      title: "Payment Successful!",
      description: `Payment of KES ${payment.amount.toLocaleString()} processed successfully`,
    });
    setPaymentModalOpen(false);
    setSelectedStudent(null);
    setSelectedFeeStructure(null);
    
    // Refresh fee data
    await handleRefreshFees();
    
    // Refresh receipts
    if (activeTab === "receipts") {
      await fetchReceipts();
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  // Fetch receipts
  const fetchReceipts = async () => {
    if (students.length === 0) return;
    
    setLoadingReceipts(true);
    setReceiptsError("");
    
    try {
      const allReceipts: any[] = [];
      
      for (const student of students) {
        try {
          const res = await fetch(
            `/api/schools/${schoolCode}/students/${student.id}/receipts`
          );
          if (res.ok) {
            const data = await res.json();
            allReceipts.push(...data);
          }
        } catch (error) {
          console.error(`Error fetching receipts for student ${student.id}:`, error);
        }
      }
      
      // Sort receipts by date (newest first)
      allReceipts.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      
      setReceipts(allReceipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      setReceiptsError("Failed to load receipts");
    } finally {
      setLoadingReceipts(false);
    }
  };

  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("File size must be less than 5MB");
      return;
    }

    setAvatarUploading(true);
    setAvatarError("");

    // Simulate upload (replace with actual upload logic)
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
        setAvatarUploading(false);
        toast({
          title: "Avatar Updated",
          description: "Profile picture updated successfully",
        });
      };
      reader.readAsDataURL(file);
    }, 1000);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch(`/api/schools/${schoolCode}/parents/logout`, {
        method: "POST",
      });
      router.push(`/schools/${schoolCode}/parent/login`);
    } catch (error) {
      console.error("Logout error:", error);
      router.push(`/schools/${schoolCode}/parent/login`);
    }
  };

  // Handle change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg("Password must be at least 6 characters long");
      return;
    }

    try {
      const res = await fetch(`/api/schools/${schoolCode}/parents/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        setPasswordMsg("Password changed successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
      } else {
        const data = await res.json();
        setPasswordMsg(data.error || "Failed to change password");
      }
    } catch (error) {
      setPasswordMsg("An error occurred while changing password");
    }
  };

  // Handle receipt generated
  const handleReceiptGenerated = (receipt: any) => {
    setReceipts((prev) => [receipt, ...prev]);
    toast({
      title: "Receipt Generated",
      description: "Payment receipt has been generated",
    });
  };

  // Handle download receipt
  const handleDownloadReceipt = async (receipt: any) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Payment Receipt</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .details { margin-bottom: 20px; }
              .summary { border-top: 1px solid #ccc; padding-top: 10px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              .print-button { display: block; margin: 20px auto; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
          </style>
      </head>
      <body>
          <div className="receipt">
              <div className="header">
                  <h1>${schoolName}</h1>
                  <h2>Payment Receipt</h2>
                  <p>Receipt #${receipt.receiptNumber}</p>
              </div>
              
              <div className="details">
                  <p><strong>Date:</strong> ${new Date(receipt.paymentDate).toLocaleDateString()}</p>
                  <p><strong>Student:</strong> ${students.find(s => s.id === receipt.studentId)?.fullName || 'N/A'}</p>
                  <p><strong>Payment Method:</strong> ${receipt.paymentMethod}</p>
                  <p><strong>Reference:</strong> ${receipt.referenceNumber}</p>
                  <p><strong>Status:</strong> ${receipt.status}</p>
              </div>

              <div className="summary">
                  <p><strong>Total Paid:</strong> KES ${receipt.amount.toLocaleString()}</p>
                  <p><strong>Outstanding Before:</strong> KES ${receipt.balanceCarriedForward?.toLocaleString() || '0'}</p>
                  <p><strong>Outstanding After:</strong> KES ${receipt.balance?.toLocaleString() || '0'}</p>
              </div>

              <div className="footer">
                  <p>Issued by ${schoolName}</p>
                  <p>Thank you for your payment!</p>
              </div>
              <button className="print-button" onclick="window.print()">Print Receipt</button>
          </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, "_blank");
    if (newWindow) newWindow.focus();
  };

  // Fetch receipts when focused child changes
  useEffect(() => {
    if (students.length > 0 && focusedChildId) {
      fetchReceipts();
    }
  }, [focusedChildId, students]);

  // Fetch receipts when receipts section is selected
  useEffect(() => {
    if (activeTab === "receipts" && students.length > 0) {
      fetchReceipts();
    }
  }, [activeTab, students]);

  // Fetch student fee summaries
  useEffect(() => {
    fetchStudentFeeSummaries();
  }, [students, schoolCode]);

  // Fetch current academic year and term on mount
  useEffect(() => {
    async function fetchAcademicInfo() {
      setLoadingAcademicInfo(true);
      setAcademicInfoError("");
      try {
        const [yearRes, termRes] = await Promise.all([
          fetch(`/api/schools/${schoolCode}?action=current-academic-year`),
          fetch(`/api/schools/${schoolCode}?action=current-term`),
        ]);
        if (!yearRes.ok) throw new Error("Failed to fetch academic year");
        if (!termRes.ok) throw new Error("Failed to fetch term");
        const yearData = await yearRes.json();
        const termData = await termRes.json();
        setCurrentAcademicYear(yearData);
        setCurrentTerm(termData);
      } catch (err: any) {
        setAcademicInfoError(err.message || "Failed to load academic info");
      } finally {
        setLoadingAcademicInfo(false);
      }
    }
    fetchAcademicInfo();
  }, [schoolCode]);

  // Fetch academic years and terms
  useEffect(() => {
    async function fetchYearsAndTerms() {
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
        // Optionally handle error
      }
    }
    if (schoolCode) fetchYearsAndTerms();
  }, [schoolCode]);

  // When year changes, fetch terms
  useEffect(() => {
    async function fetchTerms() {
      if (!selectedYearId) return;
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
        // Optionally handle error
      }
    }
    fetchTerms();
  }, [selectedYearId, schoolCode]);

  // Update fee summary and quick stats when filters change
  useEffect(() => {
    if (!selectedYearId || !selectedTermId || students.length === 0) return;
    const child = students.find((c) => c.id === focusedChildId) || students[0];
    if (!child) return;
    async function fetchFilteredFeeSummary() {
      try {
        const res = await fetch(
          `/api/schools/${schoolCode}/students/${child.id}/fees`
        );
        if (!res.ok) return;
        const data = await res.json();
        let feeSummary = data.feeSummary || [];
        let filteredSummary = feeSummary;
        if (
          feeSummary.length > 0 &&
          (feeSummary[0].termId || feeSummary[0].academicYearId)
        ) {
          filteredSummary = feeSummary.filter(
            (f: any) =>
              f.termId === selectedTermId && f.academicYearId === selectedYearId
          );
        } else {
          const selectedYear = academicYears.find(
            (y) => y.id === selectedYearId
          );
          const selectedTerm = terms.find((t) => t.id === selectedTermId);
          filteredSummary = feeSummary.filter(
            (f: any) =>
              f.term === selectedTerm?.name &&
              String(f.year) === selectedYear?.name
          );
        }
        setStudentFeeSummaries((prev: any) => ({
          ...prev,
          [child.id]: { ...data, filteredSummary },
        }));
      } catch {}
    }
    fetchFilteredFeeSummary();
  }, [
    selectedYearId,
    selectedTermId,
    focusedChildId,
    students,
    schoolCode,
    academicYears,
    terms,
  ]);

  // UI for search
const renderReceiptSearch = () => (
  <div className="mb-4">
    <input
      type="text"
      placeholder="Search receipts..."
      value={receiptSearch}
      onChange={(e) => setReceiptSearch(e.target.value)}
      className="border rounded px-3 py-2 w-full max-w-xs"
    />
  </div>
);

// Filter receipts by search
const filteredReceipts = receipts.filter((receipt: any) => {
  const search = receiptSearch.toLowerCase();
  return (
    receipt.receiptNumber?.toLowerCase().includes(search) ||
    receipt.amount?.toString().includes(search) ||
    receipt.paymentMethod?.toLowerCase().includes(search) ||
    receipt.description?.toLowerCase().includes(search) ||
    receipt.academicYearId?.toLowerCase?.().includes(search) ||
    receipt.termId?.toLowerCase?.().includes(search)
  );
});

// Render receipts table
const renderReceiptsTable = () => (
  <div className="w-full">
    {renderReceiptSearch()}
    {loadingReceipts ? (
      <div>Loading receipts...</div>
    ) : receiptsError ? (
      <div className="text-red-600">{receiptsError}</div>
    ) : (
      <table className="min-w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Receipt No</th>
            <th className="px-4 py-2 border">Date</th>
            <th className="px-4 py-2 border">Amount</th>
            <th className="px-4 py-2 border">Method</th>
            <th className="px-4 py-2 border">Description</th>
            <th className="px-4 py-2 border">Outstanding Before</th>
            <th className="px-4 py-2 border">Outstanding After</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredReceipts.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-8 text-gray-500">
                No receipts found for this search.
              </td>
            </tr>
          ) : (
            filteredReceipts.map((receipt: any) => (
              <tr key={receipt.id}>
                <td className="px-4 py-2 border">{receipt.receiptNumber}</td>
                <td className="px-4 py-2 border">
                  {new Date(receipt.paymentDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 border">
                  {receipt.amount.toLocaleString()}
                </td>
                <td className="px-4 py-2 border">
                  {(receipt.paymentMethod || "")
                    .replace("_", " ")
                    .toUpperCase()}
                </td>
                <td className="px-4 py-2 border">{receipt.description}</td>
                <td className="px-4 py-2 border">
                  {receipt.academicYearOutstandingBefore?.toLocaleString?.() ??
                    receipt.academicYearOutstandingBefore}
                </td>
                <td className="px-4 py-2 border">
                  {receipt.academicYearOutstandingAfter?.toLocaleString?.() ??
                    receipt.academicYearOutstandingAfter}
                </td>
                <td className="px-4 py-2 border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadReceipt(receipt)}
                    className="flex items-center gap-1"
                  >
                    <Receipt className="w-4 h-4" /> Download
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    )}
  </div>
);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p>Loading dashboard...</p>
        </Card>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p>You are not logged in. Redirecting...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Parent Sidebar */}
      <ParentSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        colorTheme="#3b82f6"
        onLogout={handleLogout}
        parent={parent}
        onAvatarChange={handleAvatarChange}
        avatarUploading={avatarUploading}
        avatarError={avatarError}
        avatarUrl={avatarUrl}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex justify-center items-start relative">
        {/* Vertical divider/shadow */}
        <div className="hidden md:block absolute left-0 top-0 h-full w-10 z-10">
          <div className="h-full w-2 ml-6 bg-gradient-to-b from-transparent via-blue-200 to-transparent shadow-2xl rounded-full opacity-80" />
        </div>
        
        <main className="flex-1 flex justify-center items-start p-2 md:p-6 transition-all duration-300">
          <section className="w-full max-w-7xl bg-white/80 rounded-3xl shadow-2xl p-4 md:p-14 backdrop-blur-lg mx-2 md:mx-6 ml-0 md:ml-20 lg:ml-32 pl-0 md:pl-16">
            {/* Header */}
            <div
              className="sticky top-0 z-20 bg-white/70 shadow-sm border-b rounded-2xl mb-8 px-4 py-8 flex items-center justify-between"
              style={{ borderTopColor: "#3b82f6", borderTopWidth: "4px" }}
            >
              <div className="flex items-center space-x-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center border-2 shadow-lg"
                  style={{
                    backgroundColor: "#3b82f6" + "20",
                    borderColor: "#3b82f6",
                  }}
                >
                  <Users
                    className="w-8 h-8"
                    style={{ color: "#3b82f6" }}
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome, {parent.parentName}!
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="default">
                  Parent Portal
                </Badge>
              </div>
            </div>

            {/* Main Tab Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
                {/* Summary Stats Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <Users className="w-6 h-6 text-blue-500 mb-1" />
                      <div className="text-2xl font-bold">{students.length}</div>
                      <div className="text-gray-500 text-sm">Children</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <DollarSign className="w-6 h-6 text-red-500 mb-1" />
                      <div className="text-2xl font-bold">KES {totalOutstandingFees.toLocaleString()}</div>
                      <div className="text-gray-500 text-sm">Outstanding</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <Receipt className="w-6 h-6 text-green-500 mb-1" />
                      <div className="text-2xl font-bold">KES {totalPayments.toLocaleString()}</div>
                      <div className="text-gray-500 text-sm">Total Paid</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <BarChart2 className="w-6 h-6 text-purple-500 mb-1" />
                      <div className="text-2xl font-bold">{receipts.length}</div>
                      <div className="text-gray-500 text-sm">Payments</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Academic Year & Term Info Card */}
                <Card className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-2xl border-0 px-4 py-4 md:px-12 md:py-10">
                  <CardHeader className="px-2 py-2 md:px-6 md:py-4">
                    <CardTitle className="flex items-center space-x-2 text-base md:text-xl">
                      <Calendar className="w-6 h-6 md:w-5 md:h-5 text-blue-500" />
                      <span>Academic Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingAcademicInfo ? (
                      <div className="text-center py-4">
                        <span className="text-blue-700 font-semibold animate-pulse">
                          Loading academic year and term...
                        </span>
                      </div>
                    ) : academicInfoError ? (
                      <div className="text-center py-4">
                        <span className="text-red-600 font-semibold">
                          {academicInfoError}
                        </span>
                      </div>
                    ) : currentAcademicYear && currentTerm ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 rounded-xl p-4">
                          <div className="text-sm font-semibold text-gray-600 mb-2">Current Academic Year</div>
                          <div className="text-xl font-bold text-blue-700">{currentAcademicYear.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(currentAcademicYear.startDate).toLocaleDateString()} - {new Date(currentAcademicYear.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4">
                          <div className="text-sm font-semibold text-gray-600 mb-2">Current Term</div>
                          <div className="text-xl font-bold text-purple-700">{currentTerm.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(currentTerm.startDate).toLocaleDateString()} - {new Date(currentTerm.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Children Summary */}
                {students.length > 0 && (
                  <Card className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        My Children ({students.length})
                      </CardTitle>
                      <CardDescription>
                        Select a child to view detailed information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map((child) => (
                          <div
                            key={child.id}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                              focusedChildId === child.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 bg-white hover:border-blue-300"
                            }`}
                            onClick={() => setFocusedChildId(child.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="w-12 h-12">
                                <img
                                  src={child.avatarUrl || "/placeholder-user.jpg"}
                                  alt={child.fullName || child.name}
                                  className="rounded-full object-cover w-full h-full"
                                />
                              </Avatar>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {child.fullName || child.name}
                                </div>
                                <div className="text-sm text-blue-600">
                                  {child.gradeName || child.className}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Adm: {child.admissionNumber}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Activity */}
                <Card className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Latest payments and activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentActivity.length > 0 ? (
                      <div className="space-y-3">
                        {recentActivity.map((receipt) => (
                          <div key={receipt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Receipt className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  Payment - {receipt.description}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(receipt.paymentDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                KES {receipt.amount.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                Receipt #{receipt.receiptNumber}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No recent activity</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* My Children Tab */}
              <TabsContent value="children" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                {/* Child Selection */}
                {students.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Child:
                    </label>
                    <select
                      className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-xs"
                      value={focusedChildId || students[0].id}
                      onChange={(e) => setFocusedChildId(e.target.value)}
                    >
                      {students.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.fullName || child.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Child Overview */}
                {students.length > 0 && focusedChildId && (
                  (() => {
                    const child = students.find((c) => c.id === focusedChildId) || students[0];
                    const termBalances = studentFeeSummaries[child.id]?.termBalances || [];
                    const currentTermId = currentTerm?.id;
                    const currentTermSummary = termBalances.find(
                      (f: any) => f.termId === currentTermId
                    );
                    const outstandingFees = currentTermSummary ? currentTermSummary.balance : 0;

                    return (
                      <ChildOverview
                        child={child}
                        outstandingFees={outstandingFees}
                        feeStructure={getStudentFeeStructure(child.id)}
                      />
                    );
                  })()
                )}

                {students.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No children found.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Fee Management Tab */}
              <TabsContent value="fees" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                {students.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No children found.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <ParentFeesPanel
                    schoolCode={schoolCode}
                    students={students}
                    focusedChildId={focusedChildId}
                    studentFeeSummaries={studentFeeSummaries}
                    refreshFeeData={fetchStudentFeeSummaries}
                  />
                )}
              </TabsContent>

              {/* Payment History Tab */}
              <TabsContent value="receipts" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                <Card className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      Payment History & Receipts
                    </CardTitle>
                    <CardDescription>
                      View and download payment receipts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {students.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No children found.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Payment Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {receipts.length}
                            </div>
                            <div className="text-sm text-gray-600">Total Payments</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              KES {totalPayments.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">Total Paid</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">
                              {receipts.length > 0
                                ? new Date(receipts[0].paymentDate).toLocaleDateString()
                                : "N/A"}
                            </div>
                            <div className="text-sm text-gray-600">Last Payment</div>
                          </div>
                        </div>

                        {/* Receipts Table */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Receipt No</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {receipts.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No payment history found.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                receipts.map((receipt) => (
                                  <TableRow key={receipt.id}>
                                    <TableCell>{receipt.receiptNumber}</TableCell>
                                    <TableCell>
                                      {new Date(receipt.paymentDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="font-bold text-green-600">
                                      KES {receipt.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="capitalize">
                                      {(receipt.paymentMethod || "").replace("_", " ")}
                                    </TableCell>
                                    <TableCell>{receipt.description}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownloadReceipt(receipt)}
                                      >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Academic Performance Tab */}
              <TabsContent value="performance" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                <Card className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="w-5 h-5" />
                      Academic Performance
                    </CardTitle>
                    <CardDescription>
                      Track your child's academic progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {students.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No children found.</p>
                      </div>
                    ) : focusedChildId ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">
                          Performance tracking for {students.find(c => c.id === focusedChildId)?.fullName || students[0].fullName}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Academic performance features coming soon...
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>Select a child to view performance.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Account Settings Tab */}
              <TabsContent value="settings" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                <Card className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Account Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your account preferences and security
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Profile Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Parent Name
                            </label>
                            <p className="text-gray-900 font-medium">{parent.parentName}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <p className="text-gray-900 font-medium">{parent.parentPhone}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                            </label>
                            <p className="text-gray-900 font-medium">{parent.parentEmail || "Not provided"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Password Change Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Current Password
                            </label>
                            <Input
                              type="password"
                              value={oldPassword}
                              onChange={(e) => setOldPassword(e.target.value)}
                              placeholder="Enter current password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              New Password
                            </label>
                            <Input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Confirm New Password
                            </label>
                            <Input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                            />
                          </div>
                          {passwordMsg && (
                            <div className={`text-sm ${passwordMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                              {passwordMsg}
                            </div>
                          )}
                          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            Change Password
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </main>
      </div>

      {/* Payment Modal */}
      {selectedStudent && selectedFeeStructure && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedStudent(null);
            setSelectedFeeStructure(null);
          }}
          studentId={selectedStudent.id}
          schoolCode={schoolCode}
          amount={selectedFeeStructure.totalAmount}
          feeType="School Fees"
          term={selectedFeeStructure.term}
          academicYear={selectedFeeStructure.year.toString()}
          onReceiptGenerated={handleReceiptGenerated}
        />
      )}

      {selectedReceipt && (
        <ReceiptView
          receipt={selectedReceipt}
          studentName={
            students.find((s) => s.id === selectedReceipt.studentId)?.user
              ?.name || "N/A"
          }
          studentClass={
            students.find((s) => s.id === selectedReceipt.studentId)?.class
              ?.name || "N/A"
          }
          admissionNumber={
            students.find((s) => s.id === selectedReceipt.studentId)
              ?.admissionNumber || "N/A"
          }
          schoolName={schoolName}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
