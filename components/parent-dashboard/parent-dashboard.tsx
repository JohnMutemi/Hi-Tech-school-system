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

  const [studentFeeSummaries, setStudentFeeSummaries] = useState<any>({});

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
  const handleOpenPaymentModal = (student: any) => {
    const feeStructure = getStudentFeeStructure(student.gradeId);
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
  const handlePaymentSuccess = (payment: any) => {
    toast({
      title: "Payment Successful",
      description: `Payment of KES ${
        payment.amount?.toLocaleString() ||
        selectedFeeStructure?.totalAmount.toLocaleString()
      } has been processed successfully.`,
      variant: "default",
    });

    // Close modal
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

  // Fetch receipts
  const fetchReceipts = async () => {
    try {
      if (students.length === 0) return;

      const currentStudent =
        students.find((c) => c.id === focusedChildId) || students[0];

      // Fetch real payment history from API
      const response = await fetch(
        `/api/schools/${schoolCode}/payments?studentId=${currentStudent.id}`
      );

      if (response.ok) {
        const payments = await response.json();

        // Transform payments to receipt format
        const realReceipts = payments.map((payment: any) => ({
          id: payment.id,
          student: {
            name: payment.student?.user?.name || currentStudent.name,
            className: payment.student?.class?.name || currentStudent.className,
            admissionNumber:
              payment.student?.admissionNumber ||
              currentStudent.admissionNumber,
          },
          receiptNumber: payment.receiptNumber,
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          description: payment.description,
          referenceNumber: payment.referenceNumber,
          balance: payment.receipt?.balance || 0,
          balanceCarriedForward: payment.receipt?.balanceCarriedForward || 0,
        }));

        setReceipts(realReceipts);
      } else {
        console.error("Failed to fetch receipts:", response.status);
        // Fallback to empty array
        setReceipts([]);
      }
    } catch (error) {
      console.error("Failed to fetch receipts:", error);
      setReceipts([]);
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

  const handleDownloadReceipt = (receipt: any) => {
    const receiptContent = `
Payment Receipt

School: ${receipt.schoolName || "Demo School"}
Receipt #: ${receipt.receiptNumber}

Student Information:
- Student ID: ${receipt.studentId}
- Student Name: ${receipt.student.name}
- Class: ${receipt.student.className}

Payment Details:
- Fee Type: ${receipt.feeType || receipt.description}
- Term: ${receipt.term}
- Academic Year: ${receipt.academicYear}
- Payment Method: ${receipt.paymentMethod.toUpperCase()}
${receipt.phoneNumber ? `- Phone Number: ${receipt.phoneNumber}` : ""}
${receipt.transactionId ? `- Transaction ID: ${receipt.transactionId}` : ""}
- Reference: ${receipt.reference}
- Status: ${(receipt.status || "completed").toUpperCase()}

Total Amount: ${receipt.currency || "KES"} ${receipt.amount.toLocaleString()}

Issued on: ${new Date(
      receipt.paymentDate || receipt.issuedAt
    ).toLocaleDateString()}
Issued by: ${receipt.issuedBy || "School System"}

Thank you for your payment!
    `;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${receipt.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt Downloaded",
      description: "Receipt has been downloaded successfully.",
      variant: "default",
    });
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

  // Fetch student fee summary for all students
  useEffect(() => {
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
    fetchStudentFeeSummaries();
  }, [students, schoolCode]);

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 w-64 bg-white border-r p-4 transform transition-transform md:relative md:translate-x-0">
        {/* Profile at top */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="w-28 h-28 mb-3 ring-4 ring-blue-200 shadow-lg relative group">
            <img
              src={avatarUrl || "/placeholder-user.jpg"}
              alt={parent.parentName || "Parent Avatar"}
              className="rounded-full object-cover w-full h-full"
            />
            <label
              className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-md group-hover:scale-110 transition"
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
          <div className="text-xl font-bold text-gray-900">
            {parent.parentName}
          </div>
          <div className="text-blue-700 font-semibold text-sm">
            {parent.parentPhone}
          </div>
        </div>
        {/* Navigation */}
        <nav className="mt-6 space-y-2">
          {sidebarNav.map((item) => (
            <Button
              key={item.section}
              variant={selectedSection === item.section ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedSection(item.section)}
            >
              <item.icon className="w-4 h-4 mr-2" /> {item.label}
            </Button>
          ))}
        </nav>
        {/* Logout */}
        <div className="mt-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
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
      <div className="flex-1 flex flex-col">
        {/* ...header... */}
        <main className="flex-grow p-4 md:p-6">
          {selectedSection === "children" && (
            <div>
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
              {students.length > 0 &&
                (() => {
                  const child =
                    students.find((c) => c.id === focusedChildId) ||
                    students[0];
                  // Find the current term
                  const currentDate = new Date();
                  const currentYear = currentDate.getFullYear();
                  const currentMonth = currentDate.getMonth();
                  let currentTerm = "Term 1";
                  if (currentMonth >= 4 && currentMonth <= 7)
                    currentTerm = "Term 2";
                  else if (currentMonth >= 8) currentTerm = "Term 3";
                  // Get the outstanding balance for the current term
                  let outstandingFees = 0;
                  const feeSummary =
                    studentFeeSummaries[child.id]?.feeSummary || [];
                  const currentTermSummary = feeSummary.find(
                    (f: any) => f.term === currentTerm && f.year === currentYear
                  );
                  if (currentTermSummary) {
                    outstandingFees = currentTermSummary.balance;
                  }
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
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Fee Structure
              </h2>
              {students.length === 0 ? (
                <Card className="mb-6">
                  <CardContent>No children found.</CardContent>
                </Card>
              ) : (
                (() => {
                  const child =
                    students.find((c) => c.id === focusedChildId) ||
                    students[0];
                  // Use the real-time fee summary from the backend
                  const feeSummary =
                    studentFeeSummaries[child.id]?.feeSummary || [];
                  const currentDate = new Date();
                  const currentMonth = currentDate.getMonth();
                  let currentTerm = "Term 1";
                  if (currentMonth >= 4 && currentMonth <= 7)
                    currentTerm = "Term 2";
                  else if (currentMonth >= 8) currentTerm = "Term 3";

                  return (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>
                            Fee Details for {child.fullName || child.name}
                          </CardTitle>
                          <CardDescription>
                            {feeSummary.length > 0
                              ? `${feeSummary.length} fee structure(s) available for ${child.gradeName}`
                              : "No fee structures found."}
                          </CardDescription>
                        </CardHeader>
                      </Card>

                      {feeSummary.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                          {feeSummary.map((fee) => (
                            <Card
                              key={fee.term + fee.year}
                              className={`$
                                {fee.term === currentTerm
                                  ? "ring-2 ring-blue-500 bg-blue-50"
                                  : ""
                              }`}
                            >
                              <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                  <span>{fee.term}</span>
                                  {fee.term === currentTerm && (
                                    <Badge
                                      variant="default"
                                      className="bg-blue-600"
                                    >
                                      Current
                                    </Badge>
                                  )}
                                </CardTitle>
                                <CardDescription>
                                  {fee.year} - {child.gradeName}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold">
                                      Total Fee
                                    </span>
                                    <span className="text-blue-700 font-bold">
                                      KES {fee.totalAmount.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold">Paid</span>
                                    <span className="text-green-700 font-bold">
                                      KES{" "}
                                      {(fee.totalPaid || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold">
                                      Outstanding
                                    </span>
                                    <span className="text-red-600 font-bold">
                                      KES {fee.balance.toLocaleString()}
                                    </span>
                                  </div>
                                  {fee.carryForward > 0 && (
                                    <div className="flex justify-between items-center">
                                      <span className="font-semibold">
                                        Carry Forward
                                      </span>
                                      <span className="text-orange-600 font-bold">
                                        KES {fee.carryForward.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="font-semibold text-sm">
                                      Status
                                    </span>
                                    <span
                                      className={
                                        fee.balance === 0
                                          ? "text-green-600 font-bold text-sm"
                                          : fee.totalPaid > 0
                                          ? "text-orange-600 font-bold text-sm"
                                          : "text-red-600 font-bold text-sm"
                                      }
                                    >
                                      {fee.balance === 0
                                        ? "Paid"
                                        : fee.totalPaid > 0
                                        ? "Partial"
                                        : "Outstanding"}
                                    </span>
                                  </div>
                                  {/* Payment History */}
                                  {fee.payments && fee.payments.length > 0 && (
                                    <div className="mt-2">
                                      <div className="font-semibold text-xs mb-1">
                                        Payment History
                                      </div>
                                      <ul className="text-xs text-gray-700 space-y-1">
                                        {fee.payments.map(
                                          (p: any, idx: number) => (
                                            <li
                                              key={p.id || idx}
                                              className="flex justify-between"
                                            >
                                              <span>
                                                {new Date(
                                                  p.paymentDate
                                                ).toLocaleDateString()}{" "}
                                                -{" "}
                                                {p.paymentMethod.replace(
                                                  "_",
                                                  " "
                                                )}
                                              </span>
                                              <span className="font-bold">
                                                KES {p.amount.toLocaleString()}
                                              </span>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                  {/* Pay Button */}
                                  <div className="mt-4">
                                    {fee.balance === 0 ? (
                                      <Badge className="bg-green-600">
                                        Paid
                                      </Badge>
                                    ) : (
                                      <Button
                                        className="w-full"
                                        onClick={() => {
                                          setSelectedStudent(child);
                                          setSelectedFeeStructure({
                                            ...fee,
                                            totalAmount: fee.balance, // Only allow payment of outstanding
                                          });
                                          setPaymentModalOpen(true);
                                        }}
                                        disabled={fee.balance === 0}
                                      >
                                        Pay KES {fee.balance.toLocaleString()}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card>
                          <CardContent>
                            <div className="text-gray-500 text-center py-8">
                              No fee structures available for this child.
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          )}
          {selectedSection === "receipts" && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Payment History & Receipts
              </h2>
              {students.length === 0 ? (
                <Card className="mb-6">
                  <CardContent>No children found.</CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Payment Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Summary</CardTitle>
                      <CardDescription>
                        Payment history for{" "}
                        {students.find((c) => c.id === focusedChildId)
                          ?.fullName || students[0].fullName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {receipts.length}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Payments
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            KES{" "}
                            {receipts
                              .reduce((sum, receipt) => sum + receipt.amount, 0)
                              .toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Paid
                          </div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {receipts.length > 0
                              ? new Date(
                                  receipts[0].paymentDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                          <div className="text-sm text-gray-600">
                            Last Payment
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment History Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>
                        Recent payments and receipts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {receipts.length > 0 ? (
                        <div className="space-y-4">
                          {receipts.map((receipt) => (
                            <div
                              key={receipt.id}
                              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-lg">
                                    Receipt #{receipt.receiptNumber}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {receipt.description}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-600">
                                    KES {receipt.amount.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(
                                      receipt.paymentDate
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">
                                    Payment Method:
                                  </span>
                                  <p className="capitalize">
                                    {receipt.paymentMethod.replace("_", " ")}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Reference:
                                  </span>
                                  <p className="text-xs">
                                    {receipt.referenceNumber}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Balance After:
                                  </span>
                                  <p className="text-red-600">
                                    KES {receipt.balance.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Balance Before:
                                  </span>
                                  <p className="text-gray-600">
                                    KES{" "}
                                    {receipt.balanceCarriedForward.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadReceipt(receipt)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Receipt
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
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
                        <div className="text-center py-8 text-gray-500">
                          <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No payment history found for this student.</p>
                          <p className="text-sm">
                            Payments will appear here once made.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
          {selectedSection === "performance" && (
            <div>
              {focusedChildId
                ? `Performance for child ID: ${focusedChildId}`
                : "Select a child to view performance."}
            </div>
          )}
          {selectedSection === "settings" && <div>Settings section</div>}
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
    </div>
  );
}
