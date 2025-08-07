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
import FeesSection from "@/components/parent-dashboard/FeesSection";
import ChildrenSection from "@/components/parent-dashboard/ChildrenSection";
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
    <div className="space-y-4">
      {/* Student Basic Info */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-stretch">
        <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4 items-center">
          <Avatar className="w-16 h-16 mr-3">
            <img
              src={child.avatarUrl || "/placeholder-user.jpg"}
              alt={child.fullName || child.name}
              className="rounded-full object-cover w-full h-full"
            />
          </Avatar>
          <div className="flex-1">
            <div className="font-bold text-base">
              {child.fullName || child.name}
            </div>
            <div className="text-blue-700 font-semibold text-sm">
              {child.gradeName}
            </div>
            <div className="text-xs text-gray-500">
              Adm: {child.admissionNumber}
            </div>
            <div className="text-xs text-gray-700 mt-1">
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
        <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col gap-3 justify-center">
          <div className="font-semibold text-gray-700 mb-2">Quick Stats</div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-blue-50 rounded px-3 py-2">
              <span className="text-sm">Outstanding Fees</span>
              <span className="text-red-600 font-bold text-sm">
                KES {outstandingFees.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center bg-purple-50 rounded px-3 py-2">
              <span className="text-sm">Recent Grade</span>
              <span className="font-bold text-sm">{recentGrade}</span>
            </div>
            <div className="flex justify-between items-center bg-green-50 rounded px-3 py-2">
              <span className="text-sm">Attendance</span>
              <span className="font-bold text-green-700 text-sm">{attendance}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Structure Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
            <DollarSign className="w-5 h-5" />
            Fee Structure - {child.gradeName}
          </CardTitle>
          <CardDescription>
            Complete fee breakdown by academic year and term
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feeStructure ? (
            <div className="space-y-4">
              {/* Fee Structure Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">Total Fee Amount</div>
                  <div className="text-xl font-bold text-blue-600">
                    KES {feeStructure.totalAmount?.toLocaleString() || "0"}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">Academic Year</div>
                  <div className="text-base font-semibold text-gray-800">
                    {feeStructure.year || "N/A"}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">Term</div>
                  <div className="text-base font-semibold text-gray-800">
                    {feeStructure.term || "N/A"}
                  </div>
                </div>
              </div>

              {/* Fee Breakdown */}
              {feeStructure.breakdown && Object.keys(feeStructure.breakdown).length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h3 className="text-base font-semibold text-gray-800 mb-3">Fee Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(feeStructure.breakdown).map(([feeType, amount]) => (
                      <div key={feeType} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="font-medium text-gray-700 capitalize text-sm">
                          {feeType.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-semibold text-gray-900 text-sm">
                          KES {Number(amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fee Structure Details */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Structure Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Grade Level:</span>
                    <span className="ml-2 text-gray-800">{feeStructure.gradeName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className="ml-2">
                      {feeStructure.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">Inactive</Badge>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Created:</span>
                    <span className="ml-2 text-gray-800">
                      {feeStructure.createdAt ? new Date(feeStructure.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Created By:</span>
                    <span className="ml-2 text-gray-800">
                      {feeStructure.creator?.name || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <DollarSign className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-2">No fee structure found</p>
              <p className="text-sm text-gray-400">
                Fee structure for {child.gradeName} has not been configured yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
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

  // Fetch fee structures after students are loaded
  useEffect(() => {
    if (students.length > 0) {
      fetchFeeStructures(students);
    }
  }, [students]);

  // Fetch fee structures for students
  const fetchFeeStructures = async (studentList: any[]) => {
    try {
      setLoadingFees(true);
      
      // Get unique grade names from students (more reliable than grade IDs)
      const gradeNames = [
        ...new Set(
          studentList
            .map((student) => student.gradeName)
            .filter((gradeName) => gradeName && gradeName !== 'Not Assigned') // Filter out null/undefined values
        ),
      ];

      console.log("Fetching fee structures for grade names:", gradeNames);

      if (gradeNames.length === 0) {
        console.log("No valid grade names found for students");
        setFeeStructures([]);
        return;
      }

      // Get current year - TEMPORARILY HARDCODED FOR TESTING
      const currentDate = new Date();
      const currentYear = 2025; // Hardcoded for testing - change back to currentDate.getFullYear() later

      console.log(`Fetching fee structures for year: ${currentYear}`);

      // Fetch fee structures for all terms (Term 1, Term 2, Term 3) for each grade name
      const feePromises = gradeNames.flatMap((gradeName) => {
        const terms = ["Term 1", "Term 2", "Term 3"];
        return terms.map(async (term) => {
          try {
            const res = await fetch(
              `/api/schools/${schoolCode}/fee-structures?gradeName=${encodeURIComponent(gradeName)}&term=${encodeURIComponent(term)}&year=${currentYear}`
            );
            if (res.ok) {
              const data = await res.json();
              return data.feeStructures || [];
            }
            return [];
          } catch (error) {
            console.error(`Error fetching fee structure for ${gradeName} ${term}:`, error);
            return [];
          }
        });
      });

      const allFeeStructures = await Promise.all(feePromises);
      const flattenedStructures = allFeeStructures.flat();
      
      console.log("Fetched fee structures:", flattenedStructures);
      setFeeStructures(flattenedStructures);
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      setFeeStructures([]);
    } finally {
      setLoadingFees(false);
    }
  };

  const getStudentFeeStructure = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || !student.gradeName) return null;

    // Find the fee structure for this student's grade
    const structure = feeStructures.find(
      (fs) => fs.gradeName === student.gradeName && fs.isActive
    );

    return structure || null;
  };

  const handleLogout = async () => {
    try {
      await fetch(`/api/schools/${schoolCode}/parents/logout`, {
        method: "POST",
      });
      router.replace(`/schools/${schoolCode}/parent/login`);
    } catch (error) {
      console.error("Logout failed:", error);
      router.replace(`/schools/${schoolCode}/parent/login`);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setAvatarError("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`/api/schools/${schoolCode}/parents/avatar`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatarUrl);
        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been updated successfully.",
        });
      } else {
        throw new Error("Failed to upload avatar");
      }
    } catch (error) {
      setAvatarError("Failed to upload avatar. Please try again.");
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
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
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-20 h-20 mb-3 ring-4 ring-blue-200 shadow-lg relative group">
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
          <div className="text-lg font-bold text-gray-900">
            {parent.parentName}
          </div>
          <div className="text-blue-700 font-semibold text-sm">
            {parent.parentPhone}
          </div>
        </div>
        {/* Navigation */}
        <nav className="mt-4 space-y-2">
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
        {/* Floating Date Widget with radiant styling - Sticky */}
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-gradient-to-r from-cyan-500/90 via-blue-500/90 to-purple-500/90 backdrop-blur-md rounded-xl px-6 py-3 border border-white/40 shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse">
            <div className="text-white font-bold text-sm">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-cyan-100 text-xs mt-1 opacity-80">
              {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
          </div>
        </div>

        <main className="flex-grow p-3 sm:p-4 pt-16 overflow-y-auto">
          {selectedSection === "children" && (
            <div className="h-full overflow-y-auto">
              {/* Use the proper ChildrenSection component */}
              <ChildrenSection students={students} />
            </div>
          )}
          {selectedSection === "fees" && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-center">Fee Structure</h2>
                {students.length === 0 ? (
                  <Card className="mb-4">
                    <CardContent>No children found.</CardContent>
                  </Card>
                ) : (
                  <FeesSection
                    schoolCode={schoolCode}
                    students={students}
                    selectedId={focusedChildId || ""}
                    setSelectedId={setFocusedChildId}
                    payments={[]}
                    loadingPayments={false}
                    paymentsError=""
                    refreshPayments={() => {}}
                  />
                )}
              </div>
            </div>
          )}
          {selectedSection === "receipts" && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-center">
                  Payment History & Receipts
                </h2>
                <Card className="mb-4">
                  <CardContent>
                    <p className="text-gray-500">Receipts functionality will be implemented here.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {selectedSection === "performance" && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-center">Academic Performance</h2>
                <Card className="mb-4">
                  <CardContent>
                    <p className="text-gray-500">Performance functionality will be implemented here.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {selectedSection === "settings" && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-center">Account Settings</h2>
                <Card className="mb-4">
                  <CardContent>
                    <p className="text-gray-500">Settings functionality will be implemented here.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 