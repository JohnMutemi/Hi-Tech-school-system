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
  Eye,
  User,
  Save,
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

export function ParentDashboard({
  schoolCode,
  parentId,
}: {
  schoolCode: string;
  parentId?: string;
}) {
  const [parent, setParent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
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

  // Sidebar navigation items
  const sidebarNav = [
    { label: "My Children", icon: Users, section: "children" },
    { label: "Fees", icon: DollarSign, section: "fees" },
    { label: "Receipts", icon: Receipt, section: "receipts" },
    { label: "Performance", icon: BarChart2, section: "performance" },
    { label: "Settings", icon: Key, section: "settings" },
  ];

  const [studentFeeSummaries, setStudentFeeSummaries] = useState<any>({});

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

        console.log("ParentDashboard: Starting fetchSession", {
          schoolCode,
          parentId,
        });

        // If parentId is provided, fetch specific parent data
        if (parentId) {
          console.log("ParentDashboard: Fetching parent by ID:", parentId);
          const res = await fetch(
            `/api/schools/${schoolCode}/parents/${parentId}`
          );
          console.log(
            "ParentDashboard: Parent by ID response status:",
            res.status
          );

          if (!res.ok) {
            console.log(
              "ParentDashboard: Parent by ID failed, redirecting to login"
            );
            router.replace(`/schools/${schoolCode}/parent/login`);
            return;
          }
          const data = await res.json();
          console.log("ParentDashboard: Parent data received:", {
            parent: data.parent,
            studentsCount: data.students?.length,
          });
          setParent(data.parent);
          setStudents(data.students);
        } else {
          console.log("ParentDashboard: Using session-based authentication");
          // Fallback to session-based authentication
          const res = await fetch(`/api/schools/${schoolCode}/parents/session`);
          console.log("ParentDashboard: Session response status:", res.status);

          if (!res.ok) {
            console.log(
              "ParentDashboard: Session failed, redirecting to login"
            );
            router.replace(`/schools/${schoolCode}/parent/login`);
            return;
          }
          const data = await res.json();
          console.log("ParentDashboard: Session data received:", {
            parent: data.parent,
            studentsCount: data.students?.length,
          });
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


  // Get fee structure for a specific student (updated to use gradeId)
  const getStudentFeeStructure = (studentGradeId: string) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    let currentTerm = "Term 1";
    if (currentMonth >= 4 && currentMonth <= 7) currentTerm = "Term 2";
    else if (currentMonth >= 8) currentTerm = "Term 3";

    // First try to find the current term's fee structure
    const currentTermFee = feeStructures.find(
      (fee) =>
        fee.gradeId === studentGradeId &&
        fee.term === currentTerm &&
        fee.year === currentYear &&
        fee.isActive
    );

    // If current term fee structure exists, return it
    if (currentTermFee) {
      return currentTermFee;
    }

    // Otherwise, return the first available fee structure for this student
    return feeStructures.find(
      (fee) =>
        fee.gradeId === studentGradeId &&
        fee.year === currentYear &&
        fee.isActive
    );
  };

  // Get all fee structures for a specific student
  const getStudentAllFeeStructures = (studentGradeId: string) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    return feeStructures.filter(
      (fee) =>
        fee.gradeId === studentGradeId &&
        fee.year === currentYear &&
        fee.isActive
    );
  };

  // Handle payment modal opening

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
    const feeStructure = getStudentFeeStructure(student.gradeId);
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

  // Fetch student fee summary for all students
  async function fetchStudentFeeSummaries() {
    if (students.length === 0) return;
    const summaries: any = {};
    await Promise.all(
      students.map(async (student) => {
        try {
          const res = await fetch(
            `/api/schools/${schoolCode}/students/${student.id}/fees`
          );
          if (res.ok) {
            const data = await res.json();
            summaries[student.id] = data;
          }
        } catch (e) {
          // ignore
        }
      })
    );
    setStudentFeeSummaries(summaries);
  }

  // Handle payment success
  const handlePaymentSuccess = async (payment: any) => {
    toast({
      title: "Payment Successful!",
      description: `Payment of KES ${payment.amount.toLocaleString()} processed successfully`,
    });


    // Refresh student fee summaries to ensure receipt uses up-to-date data
    await fetchStudentFeeSummaries();

    // Close modal

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


  // Fetch receipts from backend (directly from receipt table)
  const fetchReceipts = async () => {
    setLoadingReceipts(true);
    setReceiptsError("");
    try {
      if (students.length === 0) return;
      const currentStudent =
        students.find((c) => c.id === focusedChildId) || students[0];
      let url = `/api/schools/${schoolCode}/students/${currentStudent.id}/receipts`;
      const params = [];
      if (selectedYearId) params.push(`academicYearId=${selectedYearId}`);
      if (selectedTermId) params.push(`termId=${selectedTermId}`);
      if (params.length > 0) url += `?${params.join("&")}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch receipts");
      const data = await response.json();
      setReceipts(data);
    } catch (err: any) {
      setReceiptsError(err.message || "Failed to load receipts");

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

  // Simulate profile image upload
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


  const handleDownloadReceipt = async (receipt: any) => {
    let studentId = receipt.studentId || receipt.student?.id;
    let studentName = receipt.studentName || receipt.student?.name;
    let admissionNumber =
      receipt.admissionNumber || receipt.student?.admissionNumber;
    let className = receipt.className || receipt.student?.className;

    if (
      (!studentName || !admissionNumber || !className) &&
      Array.isArray(students)
    ) {
      const found = students.find((s) => s.id === studentId);
      if (found) {
        studentName = studentName || found.fullName || found.name;
        admissionNumber = admissionNumber || found.admissionNumber;
        className = className || found.className;
      }
    }

    let academicYear = receipt.academicYear;
    let term = receipt.term;

    if ((!academicYear || !term) && receipt.description) {
      const termMatch = receipt.description.match(/Term \d/);
      const yearMatch = receipt.description.match(/\d{4}/);
      if (!term && termMatch) term = termMatch[0];
      if (!academicYear && yearMatch) academicYear = yearMatch[0];
    }

    if (
      (!academicYear || !term) &&
      receipt.academicYearId &&
      receipt.termId &&
      terms.length > 0 &&
      academicYears.length > 0
    ) {
      const yearObj = academicYears.find(
        (y) => y.id === receipt.academicYearId
      );
      if (yearObj) academicYear = academicYear || yearObj.name;
      const termObj = terms.find((t) => t.id === receipt.termId);
      if (termObj) term = term || termObj.name;
    }

    const reference = receipt.referenceNumber || receipt.reference || "N/A";
    const receiptNumber = receipt.receiptNumber || "N/A";
    const paymentMethod = (receipt.paymentMethod || "").replace("_", " ");
    const amount = receipt.amount || 0;
    const paymentDate = new Date(
      receipt.paymentDate || receipt.issuedAt
    ).toLocaleDateString();
    const status = (receipt.status || "completed").toUpperCase();
    // Use real school name from receipt
    const schoolName = receipt.schoolName || "";
    const issuedBy = receipt.issuedBy || "School System";
    const currency = receipt.currency || "KES";
    // Use real outstanding balances from receipt
    function formatOutstanding(val: any) {
      if (typeof val === "number" && !isNaN(val))
        return `${currency} ${val.toLocaleString()}`;
      return "N/A";
    }
    const outstandingBefore = receipt.academicYearOutstandingBefore;
    const outstandingAfter = receipt.academicYearOutstandingAfter;
    const termOutstandingBefore = receipt.termOutstandingBefore;
    const termOutstandingAfter = receipt.termOutstandingAfter;
    const cleanDescription = (receipt.description || "Fee Payment").split(
      " - "
    )[0];

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Receipt #${receiptNumber}</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f5; }
              .receipt-container { max-width: 800px; margin: auto; background: #fff; border: 1px solid #e2e8f0; padding: 20px 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
              .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 15px; margin-bottom: 25px; }
              .header h1 { margin: 0; font-size: 2em; color: #1e293b; }
              .header p { margin: 5px 0 0; color: #475569; }
              h3 { font-size: 1.1em; color: #334155; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-top: 30px; }
              .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; font-size: 0.9em; }
              .details-grid div { padding: 4px 0; }
              .details-grid .label { font-weight: 600; color: #475569; }
              .summary { margin-top: 30px; border-top: 2px solid #1e293b; padding-top: 15px; }
              .summary-item { display: flex; justify-content: space-between; padding: 8px 0; font-size: 1em; }
              .summary-item .label { font-weight: 600; }
              .total { font-size: 1.2em; font-weight: bold; color: #1e293b; }
              .footer { text-align: center; margin-top: 40px; font-size: 0.8em; color: #64748b; }
              .print-button { display: block; width: 100%; padding: 12px; margin-top: 30px; background-color: #2563eb; color: white; border: none; border-radius: 6px; font-size: 1em; cursor: pointer; }
              @media print {
                  body { margin: 0; padding: 0; background-color: #fff; }
                  .receipt-container { box-shadow: none; border: none; margin: 0; padding: 0; }
                  .print-button { display: none; }
              }
          </style>
      </head>
      <body>
          <div class="receipt-container">
              <div class="header">
                  <h1>${schoolName}</h1>
                  <p>Payment Receipt</p>
                  <p><strong>Receipt #:</strong> ${receiptNumber}</p>
              </div>

              <h3>Student Information</h3>
              <div class="details-grid">
                  <div><span class="label">Student Name:</span> ${
                    studentName || "N/A"
                  }</div>
                  <div><span class="label">Admission No:</span> ${
                    admissionNumber || "N/A"
                  }</div>
                  <div><span class="label">Class:</span> ${
                    className || "N/A"
                  }</div>
              </div>

              <h3>Payment Details</h3>
              <div class="details-grid">
                  <div><span class="label">Description:</span> ${cleanDescription}</div>
                  <div><span class="label">Term:</span> ${term || "N/A"}</div>
                  <div><span class="label">Year:</span> ${
                    academicYear || "N/A"
                  }</div>
                  <div><span class="label">Payment Date:</span> ${paymentDate}</div>
                  <div><span class="label">Payment Method:</span> ${paymentMethod}</div>
                  <div><span class="label">Reference:</span> ${reference}</div>
                  <div><span class="label">Status:</span> ${status}</div>
              </div>

              <div class="summary">
                  <div class="summary-item total"><span class="label">Total Paid:</span> ${currency} ${amount.toLocaleString()}</div>
                  <div class="summary-item"><span class="label">Outstanding Before (Academic Year):</span> ${formatOutstanding(
                    outstandingBefore
                  )}</div>
                  <div class="summary-item"><span class="label">Outstanding After (Academic Year):</span> ${formatOutstanding(
                    outstandingAfter
                  )}</div>
                  <div class="summary-item"><span class="label">Outstanding Before (Term):</span> ${formatOutstanding(
                    termOutstandingBefore
                  )}</div>
                  <div class="summary-item"><span class="label">Outstanding After (Term):</span> ${formatOutstanding(
                    termOutstandingAfter
                  )}</div>
              </div>

              <div class="footer">Issued by ${issuedBy}</div>
              <button class="print-button" onclick="window.print()">Print Receipt</button>


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

=======
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

        // Find the summary for the selected year and term (by ID)
        let feeSummary = data.feeSummary || [];
        // If backend returns termId/academicYearId, filter by those; else fallback to term/year

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

          // fallback: try to match by term/year name if IDs missing

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
      {/* Child Selection for Receipts - Only show if multiple children */}
      {students.length > 1 && (
        <div className="mb-6 flex items-center gap-4">
          <label
            htmlFor="receipt-child-select"
            className="font-semibold text-gray-700"
          >
            Select Child:
          </label>
          <select
            id="receipt-child-select"
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

      {/* Academic Year & Term Filters for Receipts */}
      {academicYears.length > 0 && terms.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">
              Academic Year
            </label>
            <div className="relative">
              <select
                className="appearance-none border rounded-lg px-4 py-2 pr-8 bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                disabled={filterLoading || academicYears.length === 0}
              >
                {academicYears.map((year: any) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
              />
            </div>
          </div>
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
          {filterError && (
            <div className="text-red-600 mb-2">{filterError}</div>
          )}
        </div>
      )}

      {/* Current Child Info */}
      {students.length > 0 && (
        <div className="mb-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-blue-900">
                    Viewing receipts for:{" "}
                    <span className="text-blue-700">
                      {students.find((c) => c.id === focusedChildId)
                        ?.fullName ||
                        students.find((c) => c.id === focusedChildId)?.name ||
                        students[0]?.fullName ||
                        students[0]?.name}
                    </span>
                  </div>
                  <div className="text-sm text-blue-600">
                    {students.find((c) => c.id === focusedChildId)?.gradeName ||
                      students[0]?.gradeName}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {renderReceiptSearch()}
      {loadingReceipts ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading receipts...</p>
          </div>
        </div>
      ) : receiptsError ? (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {receiptsError}
        </div>
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
                  <div className="flex flex-col items-center gap-2">
                    <Receipt className="w-8 h-8 text-gray-400" />
                    <p>No receipts found for this search.</p>
                    {receiptSearch && (
                      <p className="text-sm text-gray-400">
                        Try adjusting your search terms.
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredReceipts.map((receipt: any) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border font-medium">
                    {receipt.receiptNumber}
                  </td>
                  <td className="px-4 py-2 border">
                    {new Date(receipt.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 border font-semibold text-green-700">
                    KES {receipt.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border">
                    <Badge variant="outline" className="text-xs">
                      {(receipt.paymentMethod || "")
                        .replace("_", " ")
                        .toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 border text-sm">
                    {receipt.description}
                  </td>
                  <td className="px-4 py-2 border text-sm">
                    {receipt.academicYearOutstandingBefore?.toLocaleString?.() ??
                      receipt.academicYearOutstandingBefore}
                  </td>
                  <td className="px-4 py-2 border text-sm">
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
                      <Download className="w-4 h-4" /> Download
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-blue-800">
            <Sparkles className="w-6 h-6" />
            Welcome, {parent?.parentName}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">Manage your children's education and stay updated with their progress.</p>
        </CardContent>
      </Card>

      {/* Children Overview */}
      {students.map((child) => (
        <ChildOverview
          key={child.id}
          child={child}
          outstandingFees={getStudentFeeStructure(child.id)?.balance || 0}
          feeStructure={getStudentFeeStructure(child.id)}
        />
      ))}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => setActiveTab("fees")}
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              <DollarSign className="w-6 h-6" />
              <span>Pay Fees</span>
            </Button>
            <Button
              onClick={() => setActiveTab("receipts")}
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
            >
              <Receipt className="w-6 h-6" />
              <span>View Receipts</span>
            </Button>
            <Button
              onClick={() => setActiveTab("performance")}
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <BarChart2 className="w-6 h-6" />
              <span>Academic Progress</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderChildren = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            My Children
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((child) => (
              <Card key={child.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <img
                        src={child.avatarUrl || "/placeholder-user.jpg"}
                        alt={child.fullName || child.name}
                        className="rounded-full object-cover w-full h-full"
                      />
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {child.fullName || child.name}
                      </h3>
                      <p className="text-blue-700 font-medium">{child.gradeName}</p>
                      <p className="text-sm text-gray-600">Adm: {child.admissionNumber}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-medium">{child.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date of Birth:</span>
                      <span className="font-medium">
                        {child.dateOfBirth ? child.dateOfBirth.split("T")[0] : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date Admitted:</span>
                      <span className="font-medium">
                        {child.dateAdmitted ? child.dateAdmitted.split("T")[0] : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <BarChart2 className="w-4 h-4 mr-1" />
                      Progress
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFees = () => (
    <div className="space-y-6">
      <ParentFeesPanel
        students={students}
        schoolCode={schoolCode}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </div>
  );

  const renderReceipts = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No receipts found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {receipts.map((receipt) => (
                <div key={receipt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Receipt #{receipt.receiptNumber}</p>
                      <p className="text-sm text-gray-600">{receipt.studentName} • {receipt.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">KES {receipt.amount.toLocaleString()}</span>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(receipt)}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

              )}
              {/* Child Overview Panel */}
              {students.length > 0 &&
                (() => {
                  const child =
                    students.find((c) => c.id === focusedChildId) ||
                    students[0];
                  // Use new logic for outstandingFees
                  const termBalances =
                    studentFeeSummaries[child.id]?.termBalances || [];
                  const currentTermId = currentTerm?.id;
                  const currentTermSummary = termBalances.find(
                    (f: any) => f.termId === currentTermId
                  );
                  const outstandingFees = currentTermSummary?.balance || 0;
                  return (
                    <ChildOverview
                      child={child}
                      outstandingFees={outstandingFees}
                      feeStructure={getStudentFeeStructure(child.gradeId)}
                    />
                  );
                })()}
            </div>
          )}
          {selectedSection === "fees" && (
            <ParentFeesPanel
              schoolCode={schoolCode}
              students={students}
              focusedChildId={focusedChildId}
              studentFeeSummaries={studentFeeSummaries}
              refreshFeeData={fetchStudentFeeSummaries}
            />
          )}
          {selectedSection === "receipts" && renderReceiptsTable()}
          {selectedSection === "performance" && (
            <div>
              {focusedChildId
                ? `Performance for child ID: ${focusedChildId}`
                : "Select a child to view performance."}
=======
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            Academic Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Academic performance tracking coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <img
                  src={avatarUrl || "/placeholder-user.jpg"}
                  alt={parent?.parentName || "Parent Avatar"}
                  className="rounded-full object-cover w-full h-full"
                />
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{parent?.parentName}</h3>
                <p className="text-gray-600">{parent?.parentPhone}</p>
                <p className="text-gray-600">{parent?.parentEmail}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={parent?.parentName || ""}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={parent?.parentPhone || ""}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={parent?.parentEmail || ""}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={parent?.parentAddress || ""}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            {passwordMsg && (
              <p className={`text-sm ${passwordMsg.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                {passwordMsg}
              </p>
            )}
            <Button type="submit" className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "children":
        return renderChildren();
      case "fees":
        return renderFees();
      case "receipts":
        return renderReceipts();
      case "performance":
        return renderPerformance();
      case "settings":
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header - Hidden on desktop */}
        <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-bold text-lg text-blue-700">Parent Portal</span>
                <span className="text-xs text-gray-500">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </span>
              </div>

            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                <User className="w-4 h-4" />
                <span className="font-medium">{parent?.parentName || 'Parent'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          {renderContent()}
        </main>


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

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
          <div className="flex justify-around">
            {[
              { id: "overview", label: "Overview", icon: Sparkles },
              { id: "children", label: "Children", icon: Users },
              { id: "fees", label: "Fees", icon: DollarSign },
              { id: "receipts", label: "Receipts", icon: Receipt },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 transition-all duration-200 ${
                    isActive 
                      ? "text-blue-600 bg-blue-50" 
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptView
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onDownload={() => handleDownloadReceipt(selectedReceipt)}

        />
      )}
    </div>
  );
}
