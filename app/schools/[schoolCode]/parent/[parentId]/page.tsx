"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
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

interface StudentFeeStructures {
  [studentId: string]: {
    [term: string]: FeeStructure | null;
  };
}

interface PaymentHistory {
  id: string;
  studentId: string;
  studentName: string;
  term: string;
  year: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  paymentDate: string;
  status: 'pending' | 'partial' | 'completed' | 'failed';
  paymentMethod: string;
  receiptNumber: string;
  transactionId: string;
}

interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  studentName: string;
  studentClass: string;
  admissionNumber: string;
  term: string;
  year: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionId: string;
  status: string;
  breakdown: Record<string, number>;
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
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [studentFeeStructures, setStudentFeeStructures] = useState<StudentFeeStructures>({});
  const [loadingFees, setLoadingFees] = useState(true);
  const [pendingParentCredentials, setPendingParentCredentials] = useState<{ phone: string; tempPassword: string } | null>(null);
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  
  // Payment processing state
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentMessage, setPaymentMessage] = useState("");
  
  // Enhanced payment state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [mpesaProcessing, setMpesaProcessing] = useState(false);
  
  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  
  // Collapsible term state
  const [collapsedTerms, setCollapsedTerms] = useState<{[studentId: string]: {[term: string]: boolean}}>({});
  
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
      } catch (error) {
        console.error("ParentDashboard: Failed to fetch session:", error);
        router.replace(`/schools/${schoolCode}/parent/login`);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSession();
  }, [schoolCode, parentId]);

  // Add this useEffect to fetch fee structures after students state is updated
  useEffect(() => {
    if (students.length > 0) {
      fetchFeeStructures(students);
    }
  }, [students]);

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
      const currentYear = new Date().getFullYear();
      const terms = ['Term 1', 'Term 2', 'Term 3'];
      
      console.log('Fetching fee structures for all terms and students:', studentList.length);
      console.log('Student list:', studentList.map(s => ({ id: s.id, name: s.name, className: s.className })));

      // Fetch fee structures for each student and all terms
      const allFeePromises = studentList.map(async (student) => {
        const studentFees: { [term: string]: FeeStructure | null } = {};
        
        console.log(`Processing student: ${student.name} (ID: ${student.id})`);
        
        // Fetch fees for each term
        for (const term of terms) {
          const response = await fetch(
            `/api/schools/${schoolCode}/fee-structure?term=${term}&year=${currentYear}&classLevel=${encodeURIComponent(student.className || student.classLevel)}`
          );
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Fee structures for ${student.name} - ${term}:`, data);
            
            // Find active fee structure
            const activeFeeStructure = data.find((fee: any) => fee.isActive);
            console.log(`Active fee structure for ${student.name} - ${term}:`, activeFeeStructure);
            
            studentFees[term] = activeFeeStructure || null;
          } else {
            console.error(`Failed to fetch fee structures for ${student.name} - ${term}:`, response.status, response.statusText);
            studentFees[term] = null;
          }
        }
        
        console.log(`Student fees for ${student.name}:`, studentFees);
        return { studentId: student.id, fees: studentFees };
      });

      const results = await Promise.all(allFeePromises);
      
      // Update state with all fee structures
      const newStudentFeeStructures: StudentFeeStructures = {};
      results.forEach(({ studentId, fees }) => {
        newStudentFeeStructures[studentId] = fees;
        console.log(`Stored fees for student ID ${studentId}:`, fees);
      });
      
      console.log('All student fee structures:', newStudentFeeStructures);
      setStudentFeeStructures(newStudentFeeStructures);
    } catch (error) {
      console.error("Failed to fetch fee structures:", error);
    } finally {
      setLoadingFees(false);
    }
  };

  // Get fee structure for a specific student and term
  const getStudentFeeStructure = (studentId: string, term: string) => {
    return studentFeeStructures[studentId] && studentFeeStructures[studentId][term];
  };

  // Get current term
  const getCurrentTerm = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    
    if (currentMonth >= 4 && currentMonth <= 7) return "Term 2";
    else if (currentMonth >= 8) return "Term 3";
    else return "Term 1";
  };

  // Handle payment modal opening for current term
  const handleOpenPaymentModal = (student: any) => {
    const currentTerm = getCurrentTerm();
    const feeStructure = getStudentFeeStructure(student.id, currentTerm);
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
    setSelectedTerm(currentTerm);
    setPaymentModalOpen(true);
  };

  // Handle payment modal opening for specific term
  const handleOpenPaymentModalForTerm = (student: any, term: string) => {
    const feeStructure = getStudentFeeStructure(student.id, term);
    if (!feeStructure) {
      toast({ 
        title: "Error", 
        description: `No fee structure available for ${term}`, 
        variant: "destructive" 
      });
      return;
    }

    const totalPaid = getTotalPaidAmount(student.id, term);
    const remainingBalance = getRemainingBalance(student.id, term);
    
    setSelectedStudent(student);
    setSelectedFeeStructure(feeStructure);
    setSelectedTerm(term);
    
    // Set default payment amount based on remaining balance
    if (remainingBalance > 0) {
      setPaymentAmount(remainingBalance);
      setPaymentType('partial');
    } else {
      setPaymentAmount(feeStructure.totalAmount);
      setPaymentType('full');
    }
    
    setPhoneNumber("");
    setShowPaymentForm(false);
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
      const mockReceipts: PaymentReceipt[] = students.map((student, index) => ({
        id: `receipt-${index}`,
        receiptNumber: `RCP-${Date.now()}-${index}`,
        studentName: student.name,
        studentClass: student.className || student.classLevel,
        admissionNumber: student.admissionNumber,
        term: 'Term 1',
        year: new Date().getFullYear(),
        amount: 5000,
        paymentMethod: 'mobile_money',
        paymentDate: new Date().toISOString(),
        transactionId: `TXN-${Date.now()}-${index}`,
        status: 'completed',
        breakdown: { 'School Fees': 5000 }
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

  // Simulate payment processing
  const simulatePayment = async (student: any, feeStructure: FeeStructure, term: string, amount: number) => {
    setPaymentProcessing(true);
    setPaymentStatus('processing');
    setPaymentMessage("Processing payment...");

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate random payment scenarios (full payment, partial payment, or failure)
    const scenarios = ['full', 'partial', 'failed'];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    let paidAmount = 0;
    let status: 'completed' | 'partial' | 'failed' = 'failed';
    let transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    switch (randomScenario) {
      case 'full':
        paidAmount = amount;
        status = 'completed';
        break;
      case 'partial':
        paidAmount = Math.floor(amount * 0.6); // 60% payment
        status = 'partial';
        break;
      case 'failed':
        paidAmount = 0;
        status = 'failed';
        break;
    }

    const paymentRecord: PaymentHistory = {
      id: `payment-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      term: term,
      year: feeStructure.year,
      totalAmount: amount,
      paidAmount: paidAmount,
      balance: amount - paidAmount,
      paymentDate: new Date().toISOString(),
      status: status,
      paymentMethod: 'mobile_money',
      receiptNumber: receiptNumber,
      transactionId: transactionId
    };

    // Update payment history
    setPaymentHistory(prev => [paymentRecord, ...prev]);

    if (status === 'failed') {
      setPaymentStatus('failed');
      setPaymentMessage("Payment failed. Please try again.");
      toast({
        title: "Payment Failed",
        description: "Payment could not be processed. Please try again.",
        variant: "destructive"
      });
    } else {
      setPaymentStatus('success');
      setPaymentMessage(status === 'completed' ? "Payment completed successfully!" : "Partial payment received!");
      
      // Generate receipt if payment was successful
      if (paidAmount > 0) {
        const receipt: PaymentReceipt = {
          id: `receipt-${Date.now()}`,
          receiptNumber: receiptNumber,
          studentName: student.name,
          studentClass: student.className || student.classLevel,
          admissionNumber: student.admissionNumber,
          term: term,
          year: feeStructure.year,
          amount: paidAmount,
          paymentMethod: 'mobile_money',
          paymentDate: new Date().toISOString(),
          transactionId: transactionId,
          status: status,
          breakdown: feeStructure.breakdown
        };

        setReceipts(prev => [receipt, ...prev]);

        toast({
          title: status === 'completed' ? "Payment Successful" : "Partial Payment Received",
          description: status === 'completed' 
            ? `Payment of KES ${paidAmount.toLocaleString()} completed successfully. Receipt generated.`
            : `Partial payment of KES ${paidAmount.toLocaleString()} received. Balance: KES ${(amount - paidAmount).toLocaleString()}`,
          variant: "default"
        });
      }

      // Auto-close payment modal after 3 seconds
      setTimeout(() => {
        setPaymentModalOpen(false);
        setPaymentProcessing(false);
        setPaymentStatus('idle');
        setPaymentMessage("");
        setSelectedStudent(null);
        setSelectedFeeStructure(null);
        setSelectedTerm("");
      }, 3000);
    }

    setPaymentProcessing(false);
  };

  // Generate PDF receipt
  const generatePDFReceipt = (receipt: PaymentReceipt) => {
    // Create a simple PDF-like structure using HTML
    const pdfContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${receipt.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .school-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .receipt-title { font-size: 20px; margin: 10px 0; }
            .receipt-number { font-size: 16px; color: #666; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; color: #333; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .label { font-weight: bold; }
            .value { }
            .amount { font-size: 24px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }
            .breakdown { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">Hi-Tech School System</div>
            <div class="receipt-title">PAYMENT RECEIPT</div>
            <div class="receipt-number">Receipt #: ${receipt.receiptNumber}</div>
          </div>

          <div class="section">
            <div class="section-title">Student Information</div>
            <div class="info-row">
              <span class="label">Student Name:</span>
              <span class="value">${receipt.studentName}</span>
            </div>
            <div class="info-row">
              <span class="label">Class:</span>
              <span class="value">${receipt.studentClass}</span>
            </div>
            <div class="info-row">
              <span class="label">Admission Number:</span>
              <span class="value">${receipt.admissionNumber}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Payment Details</div>
            <div class="info-row">
              <span class="label">Term:</span>
              <span class="value">${receipt.term}</span>
            </div>
            <div class="info-row">
              <span class="label">Academic Year:</span>
              <span class="value">${receipt.year}</span>
            </div>
            <div class="info-row">
              <span class="label">Payment Method:</span>
              <span class="value">${receipt.paymentMethod.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="label">Transaction ID:</span>
              <span class="value">${receipt.transactionId}</span>
            </div>
            <div class="info-row">
              <span class="label">Payment Date:</span>
              <span class="value">${new Date(receipt.paymentDate).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value">${receipt.status.toUpperCase()}</span>
            </div>
          </div>

          <div class="amount">
            Total Amount: KES ${receipt.amount.toLocaleString()}
          </div>

          <div class="section">
            <div class="section-title">Fee Breakdown</div>
            <div class="breakdown">
              ${Object.entries(receipt.breakdown || {}).map(([key, value]) => `
                <div class="info-row">
                  <span class="label">${key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span class="value">KES ${value.toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>This is a computer-generated receipt. No signature required.</p>
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.receiptNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt Downloaded",
      description: "Receipt has been downloaded as PDF.",
      variant: "default"
    });
  };

  // Toggle term collapse
  const toggleTermCollapse = (studentId: string, term: string) => {
    setCollapsedTerms(prev => {
      const newState = { ...prev };
      
      // If we're expanding this term, collapse others
      if (newState[studentId]?.[term]) {
        // Collapsing this term
        newState[studentId] = { ...newState[studentId], [term]: false };
      } else {
        // Expanding this term - collapse others
        newState[studentId] = {};
        newState[studentId][term] = true;
      }
      
      return newState;
    });
  };

  // Get payment history for a student and term
  const getPaymentHistory = (studentId: string, term: string) => {
    return paymentHistory.filter(payment => 
      payment.studentId === studentId && payment.term === term
    );
  };

  // Get total paid amount for a student and term
  const getTotalPaidAmount = (studentId: string, term: string) => {
    const payments = getPaymentHistory(studentId, term);
    return payments.reduce((total, payment) => total + payment.paidAmount, 0);
  };

  // Get remaining balance for a student and term
  const getRemainingBalance = (studentId: string, term: string) => {
    const feeStructure = getStudentFeeStructure(studentId, term);
    if (!feeStructure) return 0;
    
    const totalPaid = getTotalPaidAmount(studentId, term);
    return Math.max(0, feeStructure.totalAmount - totalPaid);
  };

  // Enhanced payment functions
  const handlePaymentTypeChange = (type: 'full' | 'partial') => {
    setPaymentType(type);
    if (type === 'full' && selectedFeeStructure) {
      setPaymentAmount(selectedFeeStructure.totalAmount);
    } else if (type === 'partial' && selectedStudent && selectedTerm) {
      const remainingBalance = getRemainingBalance(selectedStudent.id, selectedTerm);
      setPaymentAmount(remainingBalance);
    }
  };

  const handleAmountChange = (amount: number) => {
    if (!selectedFeeStructure) return;
    
    const maxAmount = paymentType === 'full' 
      ? selectedFeeStructure.totalAmount 
      : getRemainingBalance(selectedStudent.id, selectedTerm);
    
    if (amount > maxAmount) {
      toast({
        title: "Invalid Amount",
        description: `Amount cannot exceed KES ${maxAmount.toLocaleString()}`,
        variant: "destructive"
      });
      return;
    }
    
    setPaymentAmount(amount);
  };

  const validatePaymentForm = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive"
      });
      return false;
    }
    
    if (!phoneNumber.match(/^(07|01)\d{8}$/)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number (07XXXXXXXX or 01XXXXXXXX)",
        variant: "destructive"
      });
      return false;
    }
    
    if (paymentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // Enhanced M-Pesa simulation
  const simulateMpesaPayment = async () => {
    if (!validatePaymentForm()) return;
    if (!selectedFeeStructure) return;
    
    setMpesaProcessing(true);
    setPaymentMessage("Initiating M-Pesa payment...");
    
    // Step 1: Initiating payment
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPaymentMessage("Sending payment request to M-Pesa...");
    
    // Step 2: M-Pesa processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setPaymentMessage("M-Pesa is processing your payment...");
    
    // Step 3: Payment completion
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful payment (no more random failures)
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentRecord: PaymentHistory = {
      id: `payment-${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      term: selectedTerm,
      year: selectedFeeStructure.year,
      totalAmount: selectedFeeStructure.totalAmount,
      paidAmount: paymentAmount,
      balance: selectedFeeStructure.totalAmount - paymentAmount,
      paymentDate: new Date().toISOString(),
      status: paymentAmount >= selectedFeeStructure.totalAmount ? 'completed' : 'partial',
      paymentMethod: 'mpesa',
      receiptNumber: receiptNumber,
      transactionId: transactionId
    };

    // Update payment history
    setPaymentHistory(prev => [paymentRecord, ...prev]);

    // Generate receipt
    const receipt: PaymentReceipt = {
      id: `receipt-${Date.now()}`,
      receiptNumber: receiptNumber,
      studentName: selectedStudent.name,
      studentClass: selectedStudent.className || selectedStudent.classLevel,
      admissionNumber: selectedStudent.admissionNumber,
      term: selectedTerm,
      year: selectedFeeStructure.year,
      amount: paymentAmount,
      paymentMethod: 'mpesa',
      paymentDate: new Date().toISOString(),
      transactionId: transactionId,
      status: paymentAmount >= selectedFeeStructure.totalAmount ? 'completed' : 'partial',
      breakdown: selectedFeeStructure.breakdown
    };

    setReceipts(prev => [receipt, ...prev]);

    setMpesaProcessing(false);
    setPaymentStatus('success');
    setPaymentMessage("Payment completed successfully!");

    toast({
      title: "Payment Successful",
      description: `Payment of KES ${paymentAmount.toLocaleString()} processed via M-Pesa. Receipt generated.`,
      variant: "default"
    });

    // Auto-close modal after 3 seconds
    setTimeout(() => {
      setPaymentModalOpen(false);
      setPaymentProcessing(false);
      setPaymentStatus('idle');
      setPaymentMessage("");
      setSelectedStudent(null);
      setSelectedFeeStructure(null);
      setSelectedTerm("");
      setPaymentAmount(0);
      setPhoneNumber("");
      setPaymentType('full');
      setShowPaymentForm(false);
      setMpesaProcessing(false);
    }, 3000);
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
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeTab === "payment-history" ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
            onClick={() => setActiveTab("payment-history")}
          >
            <Calendar className="w-6 h-6" /> Payment History
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
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="children">My Children</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="payment-history">Payment History</TabsTrigger>
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
                  <div className="space-y-8">
                    {students.map((student: any) => {
                      const currentTerm = getCurrentTerm();
                      const studentFees = studentFeeStructures[student.id] || {};
                      
                      return (
                        <Card key={student.admissionNumber} className="p-6 border-2 border-blue-100 hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-4 mb-6">
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
                          
                          {/* Term Selection Tabs */}
                          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                            {['Term 1', 'Term 2', 'Term 3'].map((term) => {
                              const isCurrentTerm = term === currentTerm;
                              const hasFeeStructure = studentFees[term];
                              const totalPaid = getTotalPaidAmount(student.id, term);
                              const remainingBalance = getRemainingBalance(student.id, term);
                              const isPartiallyPaid = totalPaid > 0 && remainingBalance > 0;
                              const isFullyPaid = totalPaid > 0 && remainingBalance === 0;
                              
                              return (
                                <button
                                  key={term}
                                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                                    hasFeeStructure 
                                      ? isFullyPaid 
                                        ? 'bg-green-100 text-green-700 shadow-sm' 
                                        : isPartiallyPaid
                                        ? 'bg-yellow-100 text-yellow-700 shadow-sm'
                                        : 'bg-white text-blue-700 shadow-sm'
                                      : 'text-gray-400 bg-gray-50'
                                  } ${isCurrentTerm ? 'ring-2 ring-blue-200' : ''}`}
                                >
                                  <div className="flex items-center justify-center space-x-2">
                                    <span>{term}</span>
                                    {isCurrentTerm && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                    {hasFeeStructure && (
                                      isFullyPaid ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      ) : isPartiallyPaid ? (
                                        <div className="w-4 h-4 text-yellow-500">●</div>
                                      ) : (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      )
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Fee Structures for Each Term */}
                          <div className="space-y-4">
                            {['Term 1', 'Term 2', 'Term 3'].map((term) => {
                              const feeStructure = studentFees[term];
                              const totalPaid = getTotalPaidAmount(student.id, term);
                              const remainingBalance = getRemainingBalance(student.id, term);
                              const isPartiallyPaid = totalPaid > 0 && remainingBalance > 0;
                              const isFullyPaid = totalPaid > 0 && remainingBalance === 0;
                              const isCollapsed = collapsedTerms[student.id]?.[term] || false;
                              
                              return (
                                <div key={term} className="border border-gray-200 rounded-lg">
                                  <div 
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                                    onClick={() => toggleTermCollapse(student.id, term)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <h4 className="font-semibold text-gray-800">{term} {new Date().getFullYear()}</h4>
                                      {feeStructure && (
                                        <Badge variant="outline" className={
                                          isFullyPaid ? "text-green-700 border-green-300" :
                                          isPartiallyPaid ? "text-yellow-700 border-yellow-300" :
                                          "text-green-700 border-green-300"
                                        }>
                                          {isFullyPaid ? "Paid" : isPartiallyPaid ? "Partial" : "Active"}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {feeStructure && (
                                        <div className="text-sm text-gray-600">
                                          {isFullyPaid ? (
                                            <span className="text-green-600">Fully Paid</span>
                                          ) : isPartiallyPaid ? (
                                            <span className="text-yellow-600">Balance: KES {remainingBalance.toLocaleString()}</span>
                                          ) : (
                                            <span className="text-blue-600">KES {feeStructure.totalAmount.toLocaleString()}</span>
                                          )}
                                        </div>
                                      )}
                                      <button className="text-gray-400 hover:text-gray-600">
                                        {isCollapsed ? '▼' : '▲'}
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {!isCollapsed && (
                                    <div className="px-4 pb-4">
                                      {feeStructure ? (
                                        <div className="space-y-3">
                                          <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                              KES {feeStructure.totalAmount?.toLocaleString() || '0'}
                                            </div>
                                            <div className="text-sm text-gray-600">Total Term Fees</div>
                                            {totalPaid > 0 && (
                                              <div className="text-sm text-blue-600 mt-1">
                                                Paid: KES {totalPaid.toLocaleString()}
                                                {remainingBalance > 0 && (
                                                  <span className="text-yellow-600 ml-2">
                                                    Balance: KES {remainingBalance.toLocaleString()}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          
                                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
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
                                          
                                          {/* Payment Buttons */}
                                          <div className="space-y-2">
                                            {isFullyPaid ? (
                                              <div className="text-center py-2">
                                                <Badge variant="outline" className="text-green-700 border-green-300">
                                                  ✓ Payment Complete
                                                </Badge>
                                              </div>
                                            ) : (
                                              <Button
                                                className="w-full"
                                                onClick={() => {
                                                  setSelectedStudent(student);
                                                  setSelectedFeeStructure(feeStructure);
                                                  setSelectedTerm(term);
                                                  setPaymentModalOpen(true);
                                                }}
                                              >
                                                {isPartiallyPaid ? `Pay Balance (KES ${remainingBalance.toLocaleString()})` : `Pay ${term} Fees`}
                                              </Button>
                                            )}
                                          </div>
                                          
                                          {/* Payment History */}
                                          {totalPaid > 0 && (
                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                              <div className="font-semibold text-blue-800 mb-2">Payment History</div>
                                              {getPaymentHistory(student.id, term).map((payment) => (
                                                <div key={payment.id} className="text-sm text-blue-700 mb-1">
                                                  {new Date(payment.paymentDate).toLocaleDateString()}: 
                                                  KES {payment.paidAmount.toLocaleString()} 
                                                  ({payment.status})
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-center py-4">
                                          <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                          <p className="text-orange-600 font-medium">No fee structure available</p>
                                          <p className="text-sm text-gray-500 mt-1">
                                            Fee structure for {term} has not been released yet.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
                          <th className="px-4 py-2 border">Term</th>
                          <th className="px-4 py-2 border">Status</th>
                          <th className="px-4 py-2 border">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipts.map((receipt) => (
                          <tr key={receipt.id}>
                            <td className="px-4 py-2 border">{receipt.studentName}</td>
                            <td className="px-4 py-2 border">{receipt.receiptNumber}</td>
                            <td className="px-4 py-2 border">{new Date(receipt.paymentDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2 border">KES {receipt.amount.toLocaleString()}</td>
                            <td className="px-4 py-2 border">{receipt.paymentMethod.replace('_', ' ').toUpperCase()}</td>
                            <td className="px-4 py-2 border">{receipt.term} {receipt.year}</td>
                            <td className="px-4 py-2 border">
                              <Badge variant="outline" className={
                                receipt.status === 'completed' ? "text-green-700 border-green-300" :
                                receipt.status === 'partial' ? "text-yellow-700 border-yellow-300" :
                                "text-red-700 border-red-300"
                              }>
                                {receipt.status.toUpperCase()}
                              </Badge>
                            </td>
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
                                  onClick={() => generatePDFReceipt(receipt)}
                                  className="flex items-center gap-1"
                                >
                                  <Download className="w-4 h-4" /> PDF
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
                    studentName={selectedReceipt.studentName}
                    studentClass={selectedReceipt.studentClass}
                    admissionNumber={selectedReceipt.admissionNumber}
                    onClose={() => setSelectedReceipt(null)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payment-history">
            <Card className="w-full max-w-6xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-extrabold text-blue-800 mb-6 text-center">Payment History</CardTitle>
              </CardHeader>
              <CardContent className="w-full">
                {paymentHistory.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg">No payment history found.</p>
                    <p className="text-sm text-gray-400 mt-2">Payment history will appear here after making payments.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-green-50 border-green-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {paymentHistory.filter(p => p.status === 'completed').length}
                          </div>
                          <div className="text-sm text-green-700">Completed Payments</div>
                        </div>
                      </Card>
                      <Card className="p-4 bg-yellow-50 border-yellow-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {paymentHistory.filter(p => p.status === 'partial').length}
                          </div>
                          <div className="text-sm text-yellow-700">Partial Payments</div>
                        </div>
                      </Card>
                      <Card className="p-4 bg-red-50 border-red-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {paymentHistory.filter(p => p.status === 'failed').length}
                          </div>
                          <div className="text-sm text-red-700">Failed Payments</div>
                        </div>
                      </Card>
                      <Card className="p-4 bg-blue-50 border-blue-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            KES {paymentHistory.reduce((total, p) => total + p.paidAmount, 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-blue-700">Total Paid</div>
                        </div>
                      </Card>
                    </div>

                    {/* Payment History Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-3 border text-left">Student</th>
                            <th className="px-4 py-3 border text-left">Term</th>
                            <th className="px-4 py-3 border text-left">Date</th>
                            <th className="px-4 py-3 border text-right">Total Amount</th>
                            <th className="px-4 py-3 border text-right">Paid Amount</th>
                            <th className="px-4 py-3 border text-right">Balance</th>
                            <th className="px-4 py-3 border text-center">Status</th>
                            <th className="px-4 py-3 border text-center">Method</th>
                            <th className="px-4 py-3 border text-center">Receipt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistory.map((payment) => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 border">
                                <div>
                                  <div className="font-medium">{payment.studentName}</div>
                                  <div className="text-xs text-gray-500">ID: {payment.studentId}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3 border">
                                <div className="font-medium">{payment.term}</div>
                                <div className="text-xs text-gray-500">{payment.year}</div>
                              </td>
                              <td className="px-4 py-3 border">
                                {new Date(payment.paymentDate).toLocaleDateString()}
                                <div className="text-xs text-gray-500">
                                  {new Date(payment.paymentDate).toLocaleTimeString()}
                                </div>
                              </td>
                              <td className="px-4 py-3 border text-right font-medium">
                                KES {payment.totalAmount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 border text-right font-medium text-green-600">
                                KES {payment.paidAmount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 border text-right">
                                {payment.balance > 0 ? (
                                  <span className="text-yellow-600 font-medium">
                                    KES {payment.balance.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-green-600 font-medium">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 border text-center">
                                <Badge variant="outline" className={
                                  payment.status === 'completed' ? "text-green-700 border-green-300" :
                                  payment.status === 'partial' ? "text-yellow-700 border-yellow-300" :
                                  payment.status === 'failed' ? "text-red-700 border-red-300" :
                                  "text-gray-700 border-gray-300"
                                }>
                                  {payment.status.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 border text-center">
                                <span className="text-sm font-medium">
                                  {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 border text-center">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const receipt = receipts.find(r => r.receiptNumber === payment.receiptNumber);
                                      if (receipt) {
                                        setSelectedReceipt(receipt);
                                      }
                                    }}
                                    className="flex items-center gap-1"
                                  >
                                    <Receipt className="w-3 h-3" /> View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const receipt = receipts.find(r => r.receiptNumber === payment.receiptNumber);
                                      if (receipt) {
                                        generatePDFReceipt(receipt);
                                      }
                                    }}
                                    className="flex items-center gap-1"
                                  >
                                    <Download className="w-3 h-3" /> PDF
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Payment Details Modal */}
                    {selectedReceipt && (
                      <ReceiptView
                        receipt={selectedReceipt}
                        studentName={selectedReceipt.studentName}
                        studentClass={selectedReceipt.studentClass}
                        admissionNumber={selectedReceipt.admissionNumber}
                        onClose={() => setSelectedReceipt(null)}
                      />
                    )}
                  </div>
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

      {/* Enhanced Payment Modal */}
      {selectedStudent && selectedFeeStructure && (
        <AlertDialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
                {mpesaProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">M</span>
                    </div>
                    M-Pesa Payment
                  </>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {mpesaProcessing ? (
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className="text-gray-600 font-medium text-sm">{paymentMessage}</p>
                      <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-700">
                        <strong>Tip:</strong> Check your phone for the M-Pesa prompt and enter your PIN
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Compact Student Info */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Student:</span>
                        <span className="font-medium">{selectedStudent.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-600">Term:</span>
                        <span className="font-medium">{selectedTerm} {selectedFeeStructure.year}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-bold text-blue-600">KES {selectedFeeStructure.totalAmount.toLocaleString()}</span>
                      </div>
                      {getTotalPaidAmount(selectedStudent.id, selectedTerm) > 0 && (
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-600">Balance:</span>
                          <span className="font-bold text-yellow-600">KES {getRemainingBalance(selectedStudent.id, selectedTerm).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Payment Type Selection - Compact */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700">Payment Type</label>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => handlePaymentTypeChange('full')}
                          className={`flex-1 py-2 px-3 rounded-md border text-xs font-medium transition-all ${
                            paymentType === 'full'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          Full Payment
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePaymentTypeChange('partial')}
                          className={`flex-1 py-2 px-3 rounded-md border text-xs font-medium transition-all ${
                            paymentType === 'partial'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          Partial Payment
                        </button>
                      </div>
                    </div>

                    {/* Amount and Phone - Side by Side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">Amount (KES)</label>
                        <Input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => handleAmountChange(Number(e.target.value))}
                          placeholder="0"
                          className="text-sm h-9"
                          min="1"
                          max={paymentType === 'full' ? selectedFeeStructure.totalAmount : getRemainingBalance(selectedStudent.id, selectedTerm)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">Phone Number</label>
                        <Input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="07XXXXXXXX"
                          className="text-sm h-9"
                        />
                      </div>
                    </div>

                    {/* Payment Method Badge */}
                    <div className="flex items-center justify-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">M</span>
                        </div>
                        M-Pesa Payment
                      </div>
                    </div>

                    {/* Simulation Notice - Compact */}
                    <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 text-center">
                      <strong>Simulation Mode:</strong> Test environment - no actual charges
                    </div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              {!mpesaProcessing && (
                <>
                  <AlertDialogCancel 
                    onClick={() => {
                      setPaymentModalOpen(false);
                      setSelectedStudent(null);
                      setSelectedFeeStructure(null);
                      setSelectedTerm("");
                      setPaymentAmount(0);
                      setPhoneNumber("");
                      setPaymentType('full');
                      setShowPaymentForm(false);
                    }}
                    className="text-xs px-3 py-2"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={simulateMpesaPayment}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2"
                    disabled={!phoneNumber.trim() || paymentAmount <= 0}
                  >
                    Pay via M-Pesa
                  </AlertDialogAction>
                </>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export default function ParentDashboardPage() {
  const params = useParams();
  const schoolCode = Array.isArray(params.schoolCode) ? params.schoolCode[0] : params.schoolCode;
  const parentId = Array.isArray(params.parentId) ? params.parentId[0] : params.parentId;
  return <ParentDashboard schoolCode={schoolCode} parentId={parentId} />;
} 