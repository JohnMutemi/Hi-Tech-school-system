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
} from "lucide-react";
import { ReceiptView } from "@/components/ui/receipt-view";
import { Badge } from "@/components/ui/badge";
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
    <div className="mb-8 flex flex-col md:flex-row gap-8 items-stretch">
      <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl p-8 flex flex-col md:flex-row gap-8 items-center border border-white/40 transition-all">
        <Avatar className="w-24 h-24 mr-6 ring-4 ring-blue-200 shadow-xl">
          <img
            src={child.avatarUrl || "/placeholder-user.jpg"}
            alt={child.fullName || child.name}
            className="rounded-full object-cover w-full h-full"
          />
        </Avatar>
        <div className="flex-1">
          <div className="font-extrabold text-2xl text-gray-900 mb-1 drop-shadow-sm">
            {child.fullName || child.name}
          </div>
          <div className="text-blue-700 font-semibold text-base mb-1">
            {child.gradeName}
          </div>
          <div className="text-xs text-gray-500 mb-1">
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
      <div className="flex-1 flex flex-col gap-4 justify-center">
        <div className="font-semibold text-gray-700 mb-2">Quick Stats</div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gradient-to-r from-red-100/80 to-pink-200/80 rounded-xl px-5 py-4 flex items-center shadow-md transition-all">
              <DollarSign className="w-6 h-6 text-red-500 mr-3" />
              <span className="font-semibold">Outstanding Fees</span>
              <span className="ml-auto text-lg font-bold text-red-600">
                KES {outstandingFees.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gradient-to-r from-purple-100/80 to-blue-200/80 rounded-xl px-5 py-4 flex items-center shadow-md transition-all">
              <BarChart2 className="w-6 h-6 text-purple-500 mr-3" />
              <span className="font-semibold">Recent Grade</span>
              <span className="ml-auto text-lg font-bold text-purple-700">
                {recentGrade}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gradient-to-r from-green-100/80 to-blue-100/80 rounded-xl px-5 py-4 flex items-center shadow-md transition-all">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <span className="font-semibold">Attendance</span>
              <span className="ml-auto text-lg font-bold text-green-700">
                {attendance}%
              </span>
            </div>
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
  const [activeTab, setActiveTab] = useState("children");
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
  const [selectedSection, setSelectedSection] = useState("children");
  const [focusedChildId, setFocusedChildId] = useState<string | null>(null);

  // Sidebar navigation items
  const sidebarNav = [
    { label: "My Children", icon: Users, section: "children" },
    { label: "Fees", icon: DollarSign, section: "fees" },
    { label: "Receipts", icon: Receipt, section: "receipts" },
    { label: "Performance", icon: BarChart2, section: "performance" },
    { label: "Settings", icon: Key, section: "settings" },
  ];

  const [studentFeeData, setStudentFeeData] = useState<any>({});
  const [studentFeeSummaries, setStudentFeeSummaries] = useState<any>({});

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

  useEffect(() => {
    async function fetchSession() {
      try {
        console.log("ParentDashboard: Starting fetchSession", {
          schoolCode,
          parentId,
        });

        // Fetch school name
        const schoolRes = await fetch(`/api/schools/${schoolCode}`);
        if (schoolRes.ok) {
          const schoolData = await schoolRes.json();
          setSchoolName(schoolData.name);
        }

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
          setStudents(data.students);
        }
      } catch (error) {
        console.error("ParentDashboard: Failed to fetch session:", error);
        router.replace(`/schools/${schoolCode}/parent/login`);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSession();
  }, [schoolCode, parentId]);

  // NEW: Fetch fee structures after students are loaded
  useEffect(() => {
    if (students.length > 0) {
      fetchFeeStructures(students);
    }
  }, [students]);

  // Listen for fee structure updates from admin panel
  useEffect(() => {
    const handleFeeStructureUpdate = (event: CustomEvent) => {
      if (event.detail.schoolCode === schoolCode && students.length > 0) {
        console.log(
          "Fee structure updated, refreshing parent data...",
          event.detail
        );
        fetchFeeStructures(students);
        toast({
          title: "Fee Structure Updated",
          description:
            "New fee structure has been added and is now available for payment.",
          variant: "default",
        });
      }
    };

    window.addEventListener(
      "feeStructureUpdated",
      handleFeeStructureUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "feeStructureUpdated",
        handleFeeStructureUpdate as EventListener
      );
    };
  }, [schoolCode, students]);

  // Manual refresh function
  const handleRefreshFees = async () => {
    if (students.length > 0) {
      console.log("Manually refreshing fee structures...");
      await fetchFeeStructures(students);
      toast({
        title: "Fee Structures Refreshed",
        description: "Latest fee structures have been loaded.",
        variant: "default",
      });
    }
  };

  // Fetch fee structures for students
  const fetchFeeStructures = async (studentList: any[]) => {
    try {
      setLoadingFees(true);
      // Get unique grade IDs from students
      const gradeIds = [
        ...new Set(
          studentList
            .map((student) => student.gradeId)
            .filter((gradeId) => gradeId) // Filter out null/undefined values
        ),
      ];

      console.log("Fetching fee structures for grade IDs:", gradeIds);

      // Get current year
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();

      console.log(`Fetching fee structures for year: ${currentYear}`);

      // Fetch fee structures for all terms (Term 1, Term 2, Term 3) for each grade ID
      const feePromises = gradeIds.flatMap((gradeId) => {
        const terms = ["Term 1", "Term 2", "Term 3"];
        return terms.map(async (term) => {
          const response = await fetch(
            `/api/schools/${schoolCode}/fee-structure?term=${term}&year=${currentYear}&gradeId=${gradeId}`
          );
          if (response.ok) {
            const data = await response.json();
            console.log(
              `Fee structures for grade ID ${gradeId}, ${term}:`,
              data
            );

            // Find active fee structure
            const activeFeeStructure = data.find((fee: any) => fee.isActive);
            console.log(
              `Active fee structure for grade ID ${gradeId}, ${term}:`,
              activeFeeStructure
            );

            return activeFeeStructure || null;
          } else {
            console.error(
              `Failed to fetch fee structures for grade ID ${gradeId}, ${term}:`,
              response.status,
              response.statusText
            );
            return null;
          }
        });
      });

      const feeResults = await Promise.all(feePromises);
      const allFees = feeResults.filter((fee) => fee !== null);
      console.log("All active fee structures:", allFees);
      setFeeStructures(allFees);
    } catch (error) {
      console.error("Failed to fetch fee structures:", error);
    } finally {
      setLoadingFees(false);
    }
  };

  // Fetch student fee summary for all students
  const fetchStudentFeeSummaries = async () => {
    if (students.length === 0 || !currentAcademicYear) return;
    const summaries: any = {};
    await Promise.all(
      students.map(async (student) => {
        try {
          const res = await fetch(
            `/api/schools/${schoolCode}/students/${student.id}/fees?academicYearId=${currentAcademicYear.id}`,
            { cache: 'no-store' }
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
    setStudentFeeData({ ...summaries });
  };

  // Call fetchStudentFeeSummaries when students or current academic year change
  useEffect(() => {
    if (students.length > 0 && currentAcademicYear) {
      fetchStudentFeeSummaries();
    }
  }, [students, currentAcademicYear]);

  // Update getStudentFeeStructure to use studentFeeData
  const getStudentFeeStructure = (studentId: string) => {
    const termOrder = ["Term 1", "Term 2", "Term 3"];
    const termBalances = studentFeeData[studentId]?.termBalances || [];
    // Sort by term order
    const sortedTerms = [...termBalances].sort((a, b) => termOrder.indexOf(a.term) - termOrder.indexOf(b.term));
    // Find the first unpaid term (balance > 0)
    const firstUnpaid = sortedTerms.find(term => term.balance > 0);
    // Return the first unpaid, or the first available if all are paid
    return firstUnpaid || sortedTerms[0];
  };

  // Update handleOpenPaymentModal to use student.id
  const handleOpenPaymentModal = (student: any) => {
    const feeStructure = getStudentFeeStructure(student.id);
    if (!feeStructure) {
      toast({
        title: "Error",
        description: "No fee structure available for this student",
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
      title: "Payment Successful",
      description: `Payment of KES ${
        payment.amount?.toLocaleString() ||
        selectedFeeStructure?.totalAmount.toLocaleString()
      } has been processed successfully.`,
      variant: "default",
    });

    // Refresh student fee summaries and receipts
    await fetchStudentFeeSummaries();
    await fetchReceipts();

    // Close modal and reset state
    setPaymentModalOpen(false);
    setSelectedStudent(null);
    setSelectedFeeStructure(null);
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error || "An error occurred while processing payment",
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

    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) throw new Error("Failed to fetch receipts");

    const data = await response.json();

    const formattedReceipts = data.map((payment: any) => ({
      id: payment.id,
      student: {
        name: payment.student?.user?.name || currentStudent.name,
        className: payment.student?.class?.name || currentStudent.gradeName,
        admissionNumber: payment.student?.admissionNumber || currentStudent.admissionNumber,
      },
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      description: payment.description,
      referenceNumber: payment.referenceNumber,
      balance: payment.receipt?.balance,
      balanceCarriedForward: payment.receipt?.balanceCarriedForward,
      schoolName: payment.schoolName,
      term: payment.term,
      academicYear: payment.academicYear,
    }));

    setReceipts([...formattedReceipts]);

  } catch (err: any) {
    console.error("Failed to fetch receipts:", err);
    setReceiptsError(err.message || "Failed to load receipts");
    setReceipts([]);
  } finally {
    setLoadingReceipts(false);
  }
};

  // Simulate profile image upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be less than 5MB.");
      return;
    }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = ev.target?.result as string;
      setAvatarUrl(url);
      setAvatarUploading(false);
      // Update parent avatar via API
      await fetch(`/api/schools/${schoolCode}/parents`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: parent.id, avatarUrl: url }),
      });
    };
    reader.onerror = () => {
      setAvatarUploading(false);
      setAvatarError("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  // Logout logic
  const handleLogout = async () => {
    try {
      await fetch(`/api/schools/${schoolCode}/parents/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      router.replace(`/schools/${schoolCode}/parent/login`);
    }
  };

  // Change password logic
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match.");
      return;
    }
    // Update parent password via API
    const res = await fetch(`/api/schools/${schoolCode}/parents`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId: parent.id, oldPassword, newPassword }),
    });
    if (res.ok) {
      setPasswordMsg("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      setPasswordMsg(data.error || "Failed to change password");
    }
  };

  // Receipt handling
  const handleReceiptGenerated = (receipt: any) => {
    // Add the new receipt to the receipts list
    const newReceipt = {
      id: receipt.paymentId,
      receiptNumber: receipt.receiptNumber,
      paymentDate: receipt.issuedAt,
      amount: receipt.amount,
      paymentMethod: receipt.paymentMethod,
      description: `${receipt.feeType} - ${receipt.term} ${receipt.academicYear}`,
      student: {
        name: receipt.studentName || "Demo Student",
        className: "Demo Class",
        admissionNumber: receipt.studentId,
      },
      ...receipt,
    };

    setReceipts((prev) => [newReceipt, ...prev]);
    toast({
      title: "Receipt Generated",
      description: "Payment receipt has been added to your receipts tab.",
      variant: "default",
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
    const yearObj = academicYears.find((y) => y.id === receipt.academicYearId);
    if (yearObj) academicYear = academicYear || yearObj.name;
    const termObj = terms.find((t) => t.id === receipt.termId);
    if (termObj) term = term || termObj.name;
  }

  const reference = receipt.referenceNumber || receipt.reference || "N/A";
  const receiptNumber = receipt.receiptNumber || "N/A";
  const paymentMethod = (receipt.paymentMethod || "").replace("_", " ");
  const amount = receipt.amount || 0;
  const paymentDate = new Date(receipt.paymentDate || receipt.issuedAt).toLocaleDateString();
  const status = (receipt.status || "completed").toUpperCase();
  // Use real school name from receipt
  const schoolName = receipt.schoolName || "";
  const issuedBy = receipt.issuedBy || "School System";
  const currency = receipt.currency || "KES";
  // Use real outstanding balances from receipt
  function formatOutstanding(val: any) {
    if (typeof val === 'number' && !isNaN(val)) return `${currency} ${val.toLocaleString()}`;
    return 'N/A';
  }
  const outstandingBefore = receipt.academicYearOutstandingBefore;
  const outstandingAfter = receipt.academicYearOutstandingAfter;
  const termOutstandingBefore = receipt.termOutstandingBefore;
  const termOutstandingAfter = receipt.termOutstandingAfter;
  const cleanDescription = (receipt.description || "Fee Payment").split(" - ")[0];

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
                <div><span class="label">Student Name:</span> ${studentName || "N/A"}</div>
                <div><span class="label">Admission No:</span> ${admissionNumber || "N/A"}</div>
                <div><span class="label">Class:</span> ${className || "N/A"}</div>
            </div>

            <h3>Payment Details</h3>
            <div class="details-grid">
                <div><span class="label">Description:</span> ${cleanDescription}</div>
                <div><span class="label">Term:</span> ${term || "N/A"}</div>
                <div><span class="label">Year:</span> ${academicYear || "N/A"}</div>
                <div><span class="label">Payment Date:</span> ${paymentDate}</div>
                <div><span class="label">Payment Method:</span> ${paymentMethod}</div>
                <div><span class="label">Reference:</span> ${reference}</div>
                <div><span class="label">Status:</span> ${status}</div>
            </div>

            <div class="summary">
                <div class="summary-item total"><span class="label">Total Paid:</span> ${currency} ${amount.toLocaleString()}</div>
                <div class="summary-item"><span class="label">Outstanding Before (Academic Year):</span> ${formatOutstanding(outstandingBefore)}</div>
                <div class="summary-item"><span class="label">Outstanding After (Academic Year):</span> ${formatOutstanding(outstandingAfter)}</div>
                <div class="summary-item"><span class="label">Outstanding Before (Term):</span> ${formatOutstanding(termOutstandingBefore)}</div>
                <div class="summary-item"><span class="label">Outstanding After (Term):</span> ${formatOutstanding(termOutstandingAfter)}</div>
            </div>

            <div class="footer">Issued by ${issuedBy}</div>
            <button class="print-button" onclick="window.print()">Print Receipt</button>
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
    if (selectedSection === "receipts" && students.length > 0) {
      fetchReceipts();
    }
  }, [selectedSection, students]);

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
        `/api/schools/${schoolCode}/students/${child.id}/fees?academicYearId=${selectedYearId}`
      );
      if (!res.ok) return;
      const data = await res.json();
      let termBalances = data.termBalances || [];
      let filteredSummary = termBalances.filter(
        (f: any) => f.termId === selectedTermId
      );
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
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 w-64 md:w-72 p-4 md:p-6
          bg-white/60 backdrop-blur-xl shadow-2xl border border-white/40
          rounded-2xl md:static md:translate-x-0
          flex flex-col transition-all duration-300
          md:max-h-[90vh] md:overflow-y-auto"
        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' }}
      >
        {/* Profile at top */}
        <div className="flex flex-col items-center mb-10">
          <Avatar className="w-28 h-28 mb-3 ring-4 ring-blue-200 shadow-lg relative group">
            <img
              src={avatarUrl || "/placeholder-user.jpg"}
              alt={parent.parentName || "Parent Avatar"}
              className="rounded-full object-cover w-full h-full"
            />
            <label
              className="absolute bottom-2 right-2 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full p-1 cursor-pointer shadow-md group-hover:scale-110 transition"
              title="Change profile picture"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
                ref={fileInputRef}
              />
              <Camera className="w-5 h-5" />
            </label>
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full">
                <span className="text-blue-600 font-bold">Uploading...</span>
              </div>
            )}
            {avatarError && (
              <div className="absolute left-0 right-0 -bottom-8 text-xs text-red-600 text-center">
                {avatarError}
              </div>
            )}
          </Avatar>
          <div className="text-2xl font-extrabold text-gray-900 drop-shadow-sm">
            {parent.parentName}
          </div>
          <div className="text-blue-700 font-semibold text-sm">
            {parent.parentPhone}
          </div>
        </div>
        {/* Navigation */}
        <nav className="mt-6 space-y-2 w-full">
          {sidebarNav.map((item) => (
            <Button
              key={item.section}
              variant={selectedSection === item.section ? "secondary" : "ghost"}
              className={`w-full justify-start px-5 py-3 rounded-xl text-lg font-medium flex items-center gap-3 transition-all duration-200
                ${selectedSection === item.section
                  ? "bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white shadow-lg ring-2 ring-blue-300/40"
                  : "hover:bg-blue-100/60 hover:text-blue-700"}
              `}
              style={selectedSection === item.section ? { boxShadow: '0 4px 24px 0 rgba(99, 102, 241, 0.15)' } : {}}
              onClick={() => setSelectedSection(item.section)}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </Button>
          ))}
        </nav>
        {/* Logout */}
        <div className="mt-auto pt-8">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-100/60 rounded-xl font-semibold"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to logout? You will need to login again
                  to access the dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-0 py-0 px-0">
        {/* ...header... */}
        <main className="flex-grow p-0 md:p-0">
          {selectedSection === "children" && (
            <div>
              {/* Academic Year & Term Info - Beautiful Glassmorphism Card */}
              <div className="mb-6">
                {loadingAcademicInfo ? (
                  <div className="rounded-2xl bg-gradient-to-r from-blue-100/60 via-purple-100/60 to-pink-100/60 shadow-xl p-8 flex items-center justify-center min-h-[80px] backdrop-blur-xl border border-white/40 animate-pulse">
                    <span className="text-blue-700 font-semibold">Loading academic year and term...</span>
                  </div>
                ) : academicInfoError ? (
                  <div className="rounded-2xl bg-gradient-to-r from-red-100/60 to-pink-100/60 shadow-xl p-8 flex items-center justify-center min-h-[80px] backdrop-blur-xl border border-white/40">
                    <span className="text-red-600 font-semibold">{academicInfoError}</span>
                  </div>
                ) : currentAcademicYear && currentTerm ? (
                  <div className="rounded-2xl bg-gradient-to-r from-blue-100/60 via-purple-100/60 to-pink-100/60 shadow-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl border border-white/40">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/60 rounded-full p-4 shadow-md flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                          Academic Year
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-blue-700 drop-shadow-sm">
                          {currentAcademicYear.name}
                          <span className="ml-3 text-base font-medium text-gray-500">
                            (
                            {new Date(currentAcademicYear.startDate).toLocaleDateString()} - {new Date(currentAcademicYear.endDate).toLocaleDateString()}
                            )
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-[1px] bg-gradient-to-r from-blue-200/40 via-purple-200/40 to-pink-200/40 my-4 md:hidden" />
                    <div className="flex items-center gap-4">
                      <div className="bg-white/60 rounded-full p-4 shadow-md flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-purple-500" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                          Current Term
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-purple-700 drop-shadow-sm">
                          {currentTerm.name}
                          <span className="ml-3 text-base font-medium text-gray-500">
                            (
                            {new Date(currentTerm.startDate).toLocaleDateString()} - {new Date(currentTerm.endDate).toLocaleDateString()}
                            )
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              {/* Academic Year & Term Filters */}
              {academicYears.length > 0 && terms.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-6 items-center">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Academic Year</label>
                    <div className="relative">
                      <select
                        className="appearance-none border rounded-xl px-4 py-2 pr-10 bg-white/70 shadow focus:outline-none focus:ring-2 focus:ring-blue-200 backdrop-blur-md text-base"
                        value={selectedYearId}
                        onChange={(e) => setSelectedYearId(e.target.value)}
                        disabled={filterLoading || academicYears.length === 0}
                      >
                        {academicYears.map((year: any) => (
                          <option key={year.id} value={year.id}>{year.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Term</label>
                    <div className="relative">
                      <select
                        className="appearance-none border rounded-xl px-4 py-2 pr-10 bg-white/70 shadow focus:outline-none focus:ring-2 focus:ring-purple-200 backdrop-blur-md text-base"
                        value={selectedTermId}
                        onChange={(e) => setSelectedTermId(e.target.value)}
                        disabled={filterLoading || terms.length === 0}
                      >
                        {terms.map((term: any) => (
                          <option key={term.id} value={term.id}>{term.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                    </div>
                  </div>
                  {filterError && (
                    <div className="text-red-600 mb-2">{filterError}</div>
                  )}
                </div>
              )}
              {/* Children summary at the top */}
              {students.length > 0 && (
                <Card className="mb-6">
                  <CardContent>
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <div>
                        <b>Children:</b> {students.length}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Dropdown for selecting child */}
              {students.length > 0 && (
                <div className="mb-6 flex items-center gap-4">
                  <label
                    htmlFor="child-select"
                    className="font-semibold text-gray-700"
                  >
                    Select Child:
                  </label>
                  <select
                    id="child-select"
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
              {/* Child Overview Panel */}
              {students.length > 0 && (
                (() => {
                  const child =
                    students.find((c) => c.id === focusedChildId) ||
                    students[0];
// Use merged logic for outstandingFees
const termBalances = studentFeeData[child.id]?.termBalances || [];
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
            </div>
          )}
          {selectedSection === "fees" && (
  <div className="max-w-4xl mx-auto">
    <h2 className="text-3xl font-extrabold mb-8 text-center text-blue-700 drop-shadow-sm tracking-tight">Fee Structure</h2>
    {students.length === 0 ? (
      <Card className="mb-6 bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl">
        <CardContent className="py-8 text-center text-gray-500 text-lg">No children found.</CardContent>
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
  </div>
)}

{selectedSection === "receipts" && (
  <div className="max-w-4xl mx-auto">
    <h2 className="text-3xl font-extrabold mb-8 text-center text-purple-700 drop-shadow-sm tracking-tight">
      Payment History & Receipts
    </h2>
    {students.length === 0 ? (
      <Card className="mb-6 bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl">
        <CardContent className="py-8 text-center text-gray-500 text-lg">No children found.</CardContent>
      </Card>
    ) : (
      <div className="space-y-8">
        {/* Payment Summary Card */}
        <Card className="bg-gradient-to-r from-blue-100/70 via-purple-100/70 to-pink-100/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-700">Payment Summary</CardTitle>
            <CardDescription className="text-gray-600">
              Payment history for {students.find((c) => c.id === focusedChildId)?.fullName || students[0].fullName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white/70 rounded-xl shadow-md">
                <div className="text-3xl font-extrabold text-blue-600 mb-1">{receipts.length}</div>
                <div className="text-base text-gray-600">Total Payments</div>
              </div>
              <div className="text-center p-6 bg-white/70 rounded-xl shadow-md">
                <div className="text-3xl font-extrabold text-green-600 mb-1">
                  KES {receipts.reduce((sum, receipt) => sum + receipt.amount, 0).toLocaleString()}
                </div>
                <div className="text-base text-gray-600">Total Paid</div>
              </div>
              <div className="text-center p-6 bg-white/70 rounded-xl shadow-md">
                <div className="text-3xl font-extrabold text-orange-600 mb-1">
                  {receipts.length > 0 ? new Date(receipts[0].paymentDate).toLocaleDateString() : "N/A"}
                </div>
                <div className="text-base text-gray-600">Last Payment</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History Table */}
        <Card className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-purple-700">Payment History</CardTitle>
            <CardDescription className="text-gray-600">Recent payments and receipts</CardDescription>
          </CardHeader>
          <CardContent>
            {receipts.length > 0 ? (
              <div className="space-y-6">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="border border-white/40 rounded-xl p-6 bg-gradient-to-r from-blue-50/60 via-purple-50/60 to-pink-50/60 hover:bg-white/80 transition-colors shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-lg text-blue-700">Receipt #{receipt.receiptNumber}</h4>
                        <p className="text-sm text-gray-600">{receipt.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          KES {receipt.amount != null ? receipt.amount.toLocaleString() : "0"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(receipt.paymentDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Payment Method:</span>
                        <p className="capitalize">{receipt.paymentMethod ? receipt.paymentMethod.replace("_", " ") : "N/A"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Reference:</span>
                        <p className="text-xs">{receipt.referenceNumber || "N/A"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Balance After:</span>
                        <p className="text-red-600">KES {receipt.balance != null ? receipt.balance.toLocaleString() : "0"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Balance Before:</span>
                        <p className="text-gray-600">KES {receipt.balanceCarriedForward != null ? receipt.balanceCarriedForward.toLocaleString() : "0"}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg bg-gradient-to-r from-blue-100/60 to-purple-100/60 hover:from-blue-200/80 hover:to-purple-200/80"
                        onClick={() => handleDownloadReceipt(receipt)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Receipt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg bg-gradient-to-r from-purple-100/60 to-pink-100/60 hover:from-purple-200/80 hover:to-pink-200/80"
                        onClick={() => setSelectedReceipt(receipt)}
                      >
                        <Receipt className="w-4 h-4 mr-2" />
                        View Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Receipt className="w-14 h-14 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No payment history found for this student.</p>
                <p className="text-base">Payments will appear here once made.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )}
  </div>
)}
        </main>
      </div>
    </div>
  );
}
