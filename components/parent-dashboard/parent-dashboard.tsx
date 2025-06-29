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
  classLevel: string;
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
  feeStructure,
}: {
  child: any;
  feeStructure?: any;
}) {
  if (!child) return null;
  // Mock data for grade and attendance (replace with real data if available)
  const recentGrade = child.recentGrade || "B+";
  const attendance = child.attendance || 96;
  const outstandingFees = feeStructure ? feeStructure.totalAmount : 0;
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
            {child.className || child.classLevel}
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

        // Fetch fee structures for all students
        await fetchFeeStructures(students);
      } catch (error) {
        console.error("ParentDashboard: Failed to fetch session:", error);
        router.replace(`/schools/${schoolCode}/parent/login`);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSession();
  }, [schoolCode, parentId]);

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
      const classLevels = [
        ...new Set(
          studentList.map((student) => student.className || student.classLevel)
        ),
      ];

      console.log("Fetching fee structures for class levels:", classLevels);

      // Get current term
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      let currentTerm = "Term 1";
      if (currentMonth >= 4 && currentMonth <= 7) currentTerm = "Term 2";
      else if (currentMonth >= 8) currentTerm = "Term 3";

      console.log(`Current term: ${currentTerm}, Year: ${currentYear}`);

      // Fetch fee structures for each class level using the same logic as student dashboard
      const feePromises = classLevels.map(async (classLevel) => {
        const response = await fetch(
          `/api/schools/${schoolCode}/fee-structure?term=${currentTerm}&year=${currentYear}&classLevel=${encodeURIComponent(
            classLevel
          )}`
        );
        if (response.ok) {
          const data = await response.json();
          console.log(`Fee structures for ${classLevel}:`, data);

          // Find active fee structure (same logic as student dashboard)
          const activeFeeStructure = data.find((fee: any) => fee.isActive);
          console.log(
            `Active fee structure for ${classLevel}:`,
            activeFeeStructure
          );

          return activeFeeStructure || null;
        } else {
          console.error(
            `Failed to fetch fee structures for ${classLevel}:`,
            response.status,
            response.statusText
          );
          return null;
        }
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

  // Get fee structure for a specific student (updated to match student dashboard logic)
  const getStudentFeeStructure = (studentClass: string) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    let currentTerm = "Term 1";
    if (currentMonth >= 4 && currentMonth <= 7) currentTerm = "Term 2";
    else if (currentMonth >= 8) currentTerm = "Term 3";

    return feeStructures.find(
      (fee) =>
        fee.classLevel === studentClass &&
        fee.term === currentTerm &&
        fee.year === currentYear &&
        fee.isActive
    );
  };

  // Handle payment modal opening
  const handleOpenPaymentModal = (student: any) => {
    const feeStructure = getStudentFeeStructure(
      student.className || student.classLevel
    );
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
      // This would fetch actual receipts from your API
      // For now, we'll use placeholder data
      const mockReceipts = students.map((student, index) => ({
        id: `receipt-${index}`,
        student: {
          name: student.name,
          className: student.className,
          admissionNumber: student.admissionNumber,
        },
        receiptNumber: `RCP-${Date.now()}-${index}`,
        paymentDate: new Date().toISOString(),
        amount: 5000,
        paymentMethod: "mobile_money",
        description: "School fees payment",
      }));
      setReceipts(mockReceipts);
    } catch (error) {
      console.error("Failed to fetch receipts:", error);
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
- Status: ${receipt.status.toUpperCase()}

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
              {students.length > 0 && (
                <ChildOverview
                  child={
                    students.find((c) => c.id === focusedChildId) || students[0]
                  }
                  feeStructure={getStudentFeeStructure(
                    (
                      students.find((c) => c.id === focusedChildId) ||
                      students[0]
                    ).className ||
                      (
                        students.find((c) => c.id === focusedChildId) ||
                        students[0]
                      ).classLevel
                  )}
                />
              )}
            </div>
          )}
          {selectedSection === "fees" && (
            <div>
              {focusedChildId
                ? `Fees for child ID: ${focusedChildId}`
                : "Select a child to view fees."}
            </div>
          )}
          {selectedSection === "receipts" && (
            <div>
              {focusedChildId
                ? `Receipts for child ID: ${focusedChildId}`
                : "Select a child to view receipts."}
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
