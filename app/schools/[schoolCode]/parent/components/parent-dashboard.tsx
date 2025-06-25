"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Camera, Users, DollarSign, Receipt, BarChart2, Key, LogOut, Calendar, AlertCircle, CheckCircle, Edit, Trash2, RefreshCw, Download, Menu } from "lucide-react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Fetch receipts for all students
  const fetchReceipts = async () => {
    try {
      const receiptPromises = students.map(async (student) => {
        const response = await fetch(`/api/schools/${schoolCode}/students/${student.id}/payments`);
        if (response.ok) {
          const data = await response.json();
          return data.map((receipt: any) => ({ ...receipt, studentName: student.name }));
        }
        return [];
      });

      const allReceipts = await Promise.all(receiptPromises);
      const flattenedReceipts = allReceipts.flat();
      setReceipts(flattenedReceipts);
    } catch (error) {
      console.error("Failed to fetch receipts:", error);
    }
  };

  // Profile picture upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const avatarUrl = ev.target?.result as string;
      const session = localStorage.getItem("parent-auth");
      if (!session) {
        setAvatarUploading(false);
        setAvatarError("Session expired. Please log in again.");
        return;
      }
      const { parentId } = JSON.parse(session);
      await fetch(`/api/schools/${schoolCode}/parents`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, avatarUrl }),
      });
      setParent((prev: any) => ({ ...prev, avatarUrl }));
      setAvatarUploading(false);
    };
    reader.onerror = () => {
      setAvatarUploading(false);
      setAvatarError("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    // Optionally, call a logout API to clear the cookie
    await fetch(`/api/schools/${schoolCode}/parents/logout`, { method: "POST" });
    router.replace(`/schools/${schoolCode}/parent/login`);
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
    if (oldPassword !== parent?.tempPassword) {
      setPasswordMsg("Old password is incorrect.");
      return;
    }
    const session = localStorage.getItem("parent-auth");
    if (!session) return;
    const { parentId } = JSON.parse(session);
    await fetch(`/api/schools/${schoolCode}/parents`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, tempPassword: newPassword }),
    });
    setParent((prev: any) => ({ ...prev, tempPassword: newPassword }));
    setPasswordMsg("Password changed successfully!");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Handle receipt generation
  const handleReceiptGenerated = (receipt: any) => {
    toast({ 
      title: "Receipt Generated", 
      description: "Receipt has been generated successfully.",
      variant: "default" 
    });
    // Refresh receipts list
    fetchReceipts();
  };

  // Handle receipt download
  const handleDownloadReceipt = (receipt: any) => {
    // This is a placeholder. In a real app, you'd generate a PDF.
    const receiptContent = `
      Receipt for: ${receipt.student.name}
      Amount: KES ${receipt.amount}
      Date: ${new Date(receipt.date).toLocaleDateString()}
    `;
    const blob = new Blob([receiptContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `receipt-${receipt.id}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-lg text-gray-700">Loading Parent Portal...</p>
        </div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              You are not logged in or your session has expired. Please log in to access the parent portal.
            </p>
            <Button onClick={() => router.push(`/schools/${schoolCode}/parent/login`)}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "children":
        return <ChildrenManagement />;
      case "payments":
        return <PaymentsHistory />;
      case "profile":
        return <ProfileSettings />;
      default:
        return <ChildrenManagement />;
    }
  };

  const ChildrenManagement = () => (
    <Card>
      <CardHeader>
        <CardTitle>My Children</CardTitle>
        <CardDescription>Overview of your children's details and fee status.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.map((student) => {
            const feeStructure = getStudentFeeStructure(student.className || student.classLevel);
            return (
              <Card key={student.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <img src={student.avatarUrl || "/placeholder-user.jpg"} alt={student.name} />
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">{student.name}</h3>
                    <p className="text-sm text-gray-600">
                      Class: {student.className} | Adm No: {student.admissionNumber}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  {feeStructure ? (
                    <Button onClick={() => handleOpenPaymentModal(student)} className="w-full sm:w-auto">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pay KES {feeStructure.totalAmount.toLocaleString()}
                    </Button>
                  ) : (
                    <Badge variant="outline">No Fee Structure</Badge>
                  )}
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.push(`/schools/${schoolCode}/student/${student.id}`)}>
                    View Dashboard
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const PaymentsHistory = () => (
    <Card>
      <CardHeader>
        <CardTitle>Payments History</CardTitle>
        <CardDescription>A log of all payments made for your children.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Amount (KES)</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Receipt No.</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>{students.find(s => s.id === receipt.studentId)?.name || 'N/A'}</TableCell>
                  <TableCell>{receipt.amount.toLocaleString()}</TableCell>
                  <TableCell>{new Date(receipt.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell>{receipt.receiptNumber}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(receipt)}>
                      View Receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const ProfileSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Profile & Security</CardTitle>
        <CardDescription>Manage your contact information and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <h3 className="font-semibold">Change Password</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Input type="password" placeholder="Old Password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
            <Input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <Input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          {passwordMsg && <p className="text-sm">{passwordMsg}</p>}
          <Button type="submit">Update Password</Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-white border-r p-4 transform transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <h2 className="font-bold text-xl mb-6">Parent Portal</h2>
        <nav className="space-y-2">
          <Button variant={activeTab === 'children' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('children')}>
            <Users className="w-4 h-4 mr-2" /> My Children
          </Button>
          <Button variant={activeTab === 'payments' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('payments')}>
            <Receipt className="w-4 h-4 mr-2" /> Payments
          </Button>
          <Button variant={activeTab === 'profile' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('profile')}>
            <Key className="w-4 h-4 mr-2" /> Profile
          </Button>
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu />
          </Button>
          <h1 className="font-semibold text-lg">{parent.name}</h1>
          <Avatar>
            <img src={avatarUrl || parent.avatarUrl || "/placeholder-user.jpg"} alt={parent.name} />
          </Avatar>
        </header>

        <main className="flex-grow p-4 md:p-6">
          {renderContent()}
        </main>
      </div>

      {selectedReceipt && (
        <ReceiptView
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onDownload={() => handleDownloadReceipt(selectedReceipt)}
        />
      )}

      {paymentModalOpen && selectedStudent && selectedFeeStructure && (
        <PaymentModal
          student={selectedStudent}
          feeStructure={selectedFeeStructure}
          schoolCode={schoolCode}
          onClose={() => setPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </div>
  );
}
