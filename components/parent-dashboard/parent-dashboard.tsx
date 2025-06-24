"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Camera, Users, DollarSign, Receipt, BarChart2, Key, LogOut, Calendar, AlertCircle, CheckCircle, Edit, Trash2, RefreshCw, Download } from "lucide-react";
import { ReceiptView } from "@/components/ui/receipt-view";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from "@/components/ui/table";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

export function ParentDashboard({ schoolCode, parentId }: { schoolCode: string; parentId?: string }) {
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
  const [pendingParentCredentials, setPendingParentCredentials] = useState<{ phone: string; tempPassword: string } | null>(null);
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        console.log('ParentDashboard: Starting fetchSession', { schoolCode, parentId });
        
        // If parentId is provided, fetch specific parent data
        if (parentId) {
          console.log('ParentDashboard: Fetching parent by ID:', parentId);
          const res = await fetch(`/api/schools/${schoolCode}/parents/${parentId}`);
          console.log('ParentDashboard: Parent by ID response status:', res.status);
          
          if (!res.ok) {
            console.log('ParentDashboard: Parent by ID failed, redirecting to login');
            router.replace(`/schools/${schoolCode}/parent/login`);
            return;
          }
          const data = await res.json();
          console.log('ParentDashboard: Parent data received:', { parent: data.parent, studentsCount: data.students?.length });
          setParent(data.parent);
          setStudents(data.students);
        } else {
          console.log('ParentDashboard: Using session-based authentication');
          // Fallback to session-based authentication
          const res = await fetch(`/api/schools/${schoolCode}/parents/session`);
          console.log('ParentDashboard: Session response status:', res.status);
          
          if (!res.ok) {
            console.log('ParentDashboard: Session failed, redirecting to login');
            router.replace(`/schools/${schoolCode}/parent/login`);
            return;
          }
          const data = await res.json();
          console.log('ParentDashboard: Session data received:', { parent: data.parent, studentsCount: data.students?.length });
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
        console.log('Fee structure updated, refreshing parent data...', event.detail)
        fetchFeeStructures(students)
        toast({ 
          title: "Fee Structure Updated", 
          description: "New fee structure has been added and is now available for payment.",
          variant: "default" 
        })
      }
    }

    window.addEventListener('feeStructureUpdated', handleFeeStructureUpdate as EventListener)
    
    return () => {
      window.removeEventListener('feeStructureUpdated', handleFeeStructureUpdate as EventListener)
    }
  }, [schoolCode, students])

  // Manual refresh function
  const handleRefreshFees = async () => {
    if (students.length > 0) {
      console.log('Manually refreshing fee structures...')
      await fetchFeeStructures(students)
      toast({ 
        title: "Fee Structures Refreshed", 
        description: "Latest fee structures have been loaded.",
        variant: "default" 
      })
    }
  }

  // Fetch fee structures for students
  const fetchFeeStructures = async (studentList: any[]) => {
    try {
      setLoadingFees(true);
      const classLevels = [...new Set(studentList.map(student => student.className || student.classLevel))];
      
      console.log('Fetching fee structures for class levels:', classLevels);
      
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
          `/api/schools/${schoolCode}/fee-structure?term=${currentTerm}&year=${currentYear}&classLevel=${encodeURIComponent(classLevel)}`
        );
        if (response.ok) {
          const data = await response.json();
          console.log(`Fee structures for ${classLevel}:`, data);
          
          // Find active fee structure (same logic as student dashboard)
          const activeFeeStructure = data.find((fee: any) => fee.isActive);
          console.log(`Active fee structure for ${classLevel}:`, activeFeeStructure);
          
          return activeFeeStructure || null;
        } else {
          console.error(`Failed to fetch fee structures for ${classLevel}:`, response.status, response.statusText);
          return null;
        }
      });

      const feeResults = await Promise.all(feePromises);
      const allFees = feeResults.filter(fee => fee !== null);
      console.log('All active fee structures:', allFees);
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

    return feeStructures.find(fee => 
      fee.classLevel === studentClass && 
      fee.term === currentTerm && 
      fee.year === currentYear &&
      fee.isActive
    );
  };

  // Handle payment modal opening
  const handleOpenPaymentModal = (student: any) => {
    const feeStructure = getStudentFeeStructure(student.className || student.classLevel);
    if (!feeStructure) {
      toast({ 
        title: "Error", 
        description: "No fee structure available for this student", 
        variant: "destructive" 
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
      description: `Payment of KES ${payment.amount?.toLocaleString() || selectedFeeStructure?.totalAmount.toLocaleString()} has been processed successfully.`,
      variant: "default" 
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
      variant: "destructive" 
    });
  };

  // Fetch receipts
  const fetchReceipts = async () => {
    try {
      // This would fetch actual receipts from your API
      // For now, we'll use placeholder data
      const mockReceipts = students.map((student, index) => ({
        id: `receipt-${index}`,
        student: { name: student.name, className: student.className, admissionNumber: student.admissionNumber },
        receiptNumber: `RCP-${Date.now()}-${index}`,
        paymentDate: new Date().toISOString(),
        amount: 5000,
        paymentMethod: 'mobile_money',
        description: 'School fees payment'
      }));
      setReceipts(mockReceipts);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
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
        name: receipt.studentName || 'Demo Student',
        className: 'Demo Class',
        admissionNumber: receipt.studentId
      },
      ...receipt
    };
    
    setReceipts(prev => [newReceipt, ...prev]);
    toast({
      title: "Receipt Generated",
      description: "Payment receipt has been added to your receipts tab.",
      variant: "default"
    });
  };

  const handleDownloadReceipt = (receipt: any) => {
    const receiptContent = `
Payment Receipt

School: ${receipt.schoolName || 'Demo School'}
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
${receipt.phoneNumber ? `- Phone Number: ${receipt.phoneNumber}` : ''}
${receipt.transactionId ? `- Transaction ID: ${receipt.transactionId}` : ''}
- Reference: ${receipt.reference}
- Status: ${receipt.status.toUpperCase()}

Total Amount: ${receipt.currency || 'KES'} ${receipt.amount.toLocaleString()}

Issued on: ${new Date(receipt.paymentDate || receipt.issuedAt).toLocaleDateString()}
Issued by: ${receipt.issuedBy || 'School System'}

Thank you for your payment!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt Downloaded",
      description: "Receipt has been downloaded successfully.",
      variant: "default"
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
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <aside className="w-80 bg-white/90 shadow-xl flex flex-col items-center py-10 px-6 border-r rounded-r-3xl min-h-screen sticky top-0 z-10">
        {/* Profile at top */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="w-28 h-28 mb-3 ring-4 ring-blue-200 shadow-lg relative group">
            <img
              src={avatarUrl || "/placeholder-user.jpg"}
              alt={parent.parentName || "Parent Avatar"}
              className="rounded-full object-cover w-full h-full"
            />
            <label className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-md group-hover:scale-110 transition" title="Change profile picture">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} ref={fileInputRef} />
              <Camera className="w-5 h-5" />
            </label>
            {avatarUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full"><span className="text-blue-600 font-bold">Uploading...</span></div>}
            {avatarError && <div className="absolute left-0 right-0 -bottom-8 text-xs text-red-600 text-center">{avatarError}</div>}
          </Avatar>
          <div className="text-xl font-bold text-gray-900">{parent.parentName}</div>
          <div className="text-blue-700 font-semibold text-sm">{parent.parentPhone}</div>
        </div>
        {/* Navigation */}
        <nav className="flex flex-col w-full gap-2 mb-10">
          <button
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeTab === "children" ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
            onClick={() => setActiveTab("children")}
          >
            <Users className="w-6 h-6" /> My Children
          </button>
          <button
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeTab === "fees" ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
            onClick={() => setActiveTab("fees")}
          >
            <DollarSign className="w-6 h-6" /> Fees
          </button>
          <button
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeTab === "receipts" ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
            onClick={() => setActiveTab("receipts")}
          >
            <Receipt className="w-6 h-6" /> Receipts
          </button>
          <button
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeTab === "performance" ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
            onClick={() => setActiveTab("performance")}
          >
            <BarChart2 className="w-6 h-6" /> Performance
          </button>
          <button
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeTab === "settings" ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
            onClick={() => setActiveTab("settings")}
          >
            <Key className="w-6 h-6" /> Settings
          </button>
        </nav>
        {/* Logout */}
        <div className="mt-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="w-5 h-5" />
                Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to logout? You will need to login again to access the dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="children">My Children</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Children Tab */}
          <TabsContent value="children">
            <Card className="w-full max-w-4xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-extrabold text-blue-800 mb-6 text-center">My Children</CardTitle>
              </CardHeader>
              <CardContent className="w-full">
                {students.length === 0 ? (
                  <div className="text-center text-gray-500">No children found.</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {students.map((student: any) => (
                      <Card key={student.admissionNumber} className="p-6 border-2 border-blue-100 hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-4 mb-4">
                          <Avatar className="w-16 h-16">
                            <img
                              src={student.avatarUrl || "/placeholder-user.jpg"}
                              alt={student.name}
                              className="rounded-full object-cover w-full h-full"
                            />
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
                            <p className="text-blue-600 font-semibold">{student.className || student.classLevel}</p>
                            <p className="text-sm text-gray-500">Admission: {student.admissionNumber}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Gender:</span>
                            <span className="font-medium">{student.gender || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Date of Birth:</span>
                            <span className="font-medium">
                              {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'Not specified'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Date Admitted:</span>
                            <span className="font-medium">
                              {student.dateAdmitted ? new Date(student.dateAdmitted).toLocaleDateString() : 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees">
            <Card className="w-full max-w-4xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center mb-8">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-2xl font-extrabold text-blue-800 mb-6 text-center">Fee Structures</CardTitle>
                  <Button
                    onClick={handleRefreshFees}
                    disabled={loadingFees}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingFees ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="w-full">
                {loadingFees ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading fee structures...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center text-gray-500">No children found.</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {students.map((student: any) => {
                      const currentDate = new Date();
                      const currentYear = currentDate.getFullYear();
                      const currentMonth = currentDate.getMonth();
                      
                      let currentTerm = "Term 1";
                      if (currentMonth >= 4 && currentMonth <= 7) currentTerm = "Term 2";
                      else if (currentMonth >= 8) currentTerm = "Term 3";

                      const feeStructure = getStudentFeeStructure(student.className || student.classLevel);

                      return (
                        <Card key={student.admissionNumber} className="p-6 border-2 border-blue-100 hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-4 mb-4">
                            <Avatar className="w-16 h-16">
                              <img
                                src={student.avatarUrl || "/placeholder-user.jpg"}
                                alt={student.name}
                                className="rounded-full object-cover w-full h-full"
                              />
                            </Avatar>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
                              <p className="text-blue-600 font-semibold">{student.className || student.classLevel}</p>
                              <p className="text-sm text-gray-500">Admission: {student.admissionNumber}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-6">
                            <div className="text-center">
                              <Badge variant="outline" className="mb-2">
                                {student.className || student.classLevel} - {currentTerm} {currentYear}
                              </Badge>
                            </div>
                            
                            {feeStructure ? (
                              <div className="space-y-3">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    KES {feeStructure.totalAmount?.toLocaleString() || '0'}
                                  </div>
                                  <div className="text-sm text-gray-600">Total Term Fees</div>
                                </div>
                                
                                <div className="bg-white rounded-lg p-4 space-y-2">
                                  <div className="font-semibold text-gray-700 mb-2">Fee Breakdown:</div>
                                  {Object.entries(feeStructure.breakdown || {}).map(([key, value]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                      <span className="font-medium">KES {value?.toLocaleString() || '0'}</span>
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="text-center text-xs text-gray-500">
                                  Released on {new Date(feeStructure.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                <p className="text-orange-600 font-medium">No fee structure available</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  Fee structure for {student.className || student.classLevel} - {currentTerm} {currentYear} has not been released yet.
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Button
                              className="w-full"
                              disabled={!feeStructure}
                              onClick={() => handleOpenPaymentModal(student)}
                            >
                              Pay Fees
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts">
            <Card className="w-full max-w-4xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-extrabold text-blue-800 mb-6 text-center">Receipts</CardTitle>
              </CardHeader>
              <CardContent className="w-full">
                {receipts.length === 0 ? (
                  <div className="text-center text-gray-500">No receipts found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border mb-6">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 border">Student</th>
                          <th className="px-4 py-2 border">Receipt No</th>
                          <th className="px-4 py-2 border">Date</th>
                          <th className="px-4 py-2 border">Amount</th>
                          <th className="px-4 py-2 border">Method</th>
                          <th className="px-4 py-2 border">Description</th>
                          <th className="px-4 py-2 border">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipts.map((receipt) => (
                          <tr key={receipt.id}>
                            <td className="px-4 py-2 border">{receipt.student.name}</td>
                            <td className="px-4 py-2 border">{receipt.receiptNumber}</td>
                            <td className="px-4 py-2 border">{new Date(receipt.paymentDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2 border">{receipt.amount.toFixed(2)}</td>
                            <td className="px-4 py-2 border">{receipt.paymentMethod.replace('_', ' ').toUpperCase()}</td>
                            <td className="px-4 py-2 border">{receipt.description}</td>
                            <td className="px-4 py-2 border">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedReceipt(receipt)}
                                  className="flex items-center gap-1"
                                >
                                  <Receipt className="w-4 h-4" /> View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadReceipt(receipt)}
                                  className="flex items-center gap-1"
                                >
                                  <Download className="w-4 h-4" /> Download
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {selectedReceipt && (
                  <ReceiptView
                    receipt={selectedReceipt}
                    studentName={selectedReceipt.student.name}
                    studentClass={selectedReceipt.student.className || selectedReceipt.student.classLevel}
                    admissionNumber={selectedReceipt.student.admissionNumber}
                    onClose={() => setSelectedReceipt(null)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <Card className="w-full max-w-4xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-extrabold text-blue-800 mb-6 text-center">Performance</CardTitle>
              </CardHeader>
              <CardContent className="w-full">
                {students.length === 0 ? (
                  <div className="text-center text-gray-500">No students found.</div>
                ) : (
                  students.map((student: any) => (
                    <div key={student.admissionNumber} className="mb-8">
                      <div className="text-lg font-bold text-blue-700 mb-2">{student.name} - {student.className || student.classLevel}</div>
                      <div className="mb-4 text-gray-700 text-lg">Below are your child's term-based grades. Download their performance report for each term.</div>
                      <table className="min-w-full text-sm border mb-6">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 border">Term</th>
                            <th className="px-4 py-2 border">Average Grade</th>
                            <th className="px-4 py-2 border">Download Report</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Placeholder data, replace with real grades if available */}
                          <tr>
                            <td className="px-4 py-2 border">Term 1</td>
                            <td className="px-4 py-2 border">B+</td>
                            <td className="px-4 py-2 border">
                              <a href="#" className="text-blue-600 underline">Download Performance Report</a>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border">Term 2</td>
                            <td className="px-4 py-2 border">A-</td>
                            <td className="px-4 py-2 border">
                              <a href="#" className="text-blue-600 underline">Download Performance Report</a>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border">Term 3</td>
                            <td className="px-4 py-2 border">A</td>
                            <td className="px-4 py-2 border">
                              <a href="#" className="text-blue-600 underline">Download Performance Report</a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="w-full max-w-4xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-extrabold text-blue-800 mb-6 text-center">Settings</CardTitle>
              </CardHeader>
              <CardContent className="w-full max-w-md">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  {passwordMsg && (
                    <div className={`text-sm ${passwordMsg.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordMsg}
                    </div>
                  )}
                  <Button type="submit" className="w-full">
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
        />
      )}
    </div>
  );
} 