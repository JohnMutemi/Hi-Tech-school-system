"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  DollarSign,
  Users,
  FileText,
  History,
  CheckCircle,
  AlertCircle,
  X,
  ArrowLeft,
  TrendingUp,
  Shield,
  Clock,
  Phone,
  MessageSquare,
  Receipt,
  Calculator,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface Student {
  id: string;
  user: {
    name: string;
    email: string;
  };
  admissionNumber: string;
  class: {
    name: string;
    grade: {
      name: string;
    };
  };
  parent: {
    name: string;
    phone: string;
    email: string;
  };
  feeData?: {
    totalOutstanding: number;
    termBalances: any[];
    academicYearOutstanding: number;
  };
}

interface Grade {
  id: string;
  name: string;
  classes: {
    id: string;
    name: string;
  }[];
}

interface PaymentHistory {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  receiptNumber: string;
  description: string;
  receivedBy: string;
}

interface ManualPaymentForm {
  amount: string;
  paymentMethod: string;
  description: string;
  referenceNumber: string;
  paymentDate: string;
  sendSMS: boolean;
}

export function BursarDashboard({
  schoolCode,
  bursarId,
}: {
  schoolCode: string;
  bursarId?: string;
}) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Manual payment form state
  const [paymentForm, setPaymentForm] = useState<ManualPaymentForm>({
    amount: "",
    paymentMethod: "cash",
    description: "School Fees Payment",
    referenceNumber: "",
    paymentDate: new Date().toISOString().split('T')[0],
    sendSMS: true,
  });

  // Fetch grades and classes
  const fetchGrades = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/grades`);
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
      }
    } catch (error) {
      console.error("Failed to fetch grades:", error);
    }
  };

  // Fetch students by grade/class
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGrade && selectedGrade !== "all") params.append("gradeId", selectedGrade);
      if (selectedClass && selectedClass !== "all") params.append("classId", selectedClass);
      
      const response = await fetch(`/api/schools/${schoolCode}/students?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch student fee data
  const fetchStudentFeeData = async () => {
    if (students.length === 0) return;
    
    const updatedStudents = await Promise.all(
      students.map(async (student) => {
        try {
          const response = await fetch(
            `/api/schools/${schoolCode}/students/${student.id}/fees`,
            { cache: 'no-store' }
          );
          if (response.ok) {
            const feeData = await response.json();
            return { ...student, feeData };
          }
        } catch (error) {
          console.error(`Failed to fetch fee data for ${student.id}:`, error);
        }
        return student;
      })
    );
    
    setStudents(updatedStudents);
  };

  // Fetch payment history for a student
  const fetchPaymentHistory = async (studentId: string) => {
    setLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/schools/${schoolCode}/students/${studentId}/payments`,
        { cache: 'no-store' }
      );
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payment history",
        variant: "destructive",
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle manual payment submission
  const handleManualPayment = async () => {
    if (!selectedStudent) return;
    
    setSubmittingPayment(true);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/payments/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          description: paymentForm.description,
          referenceNumber: paymentForm.referenceNumber,
          paymentDate: paymentForm.paymentDate,
          receivedBy: bursarId || "Bursar",
          sendSMS: paymentForm.sendSMS,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: `Payment of KES ${paymentForm.amount} recorded successfully`,
        });
        
        // Reset form and close modal
        setPaymentForm({
          amount: "",
          paymentMethod: "cash",
          description: "School Fees Payment",
          referenceNumber: "",
          paymentDate: new Date().toISOString().split('T')[0],
          sendSMS: true,
        });
        setPaymentModalOpen(false);
        
        // Refresh student data
        fetchStudents();
        fetchStudentFeeData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to record payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Payment submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit payment",
        variant: "destructive",
      });
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Export to Excel (simplified)
  const exportToExcel = () => {
    const csvContent = [
      ["Admission Number", "Student Name", "Class", "Grade", "Total Outstanding", "Parent Name", "Parent Phone"],
      ...students.map(student => [
        student.admissionNumber,
        student.user.name,
        student.class.name,
        student.class.grade.name,
        student.feeData?.totalOutstanding || 0,
        student.parent.name,
        student.parent.phone,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-fees-${selectedGrade === "all" ? "all" : selectedGrade}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.parent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate summary statistics
  const totalStudents = filteredStudents.length;
  const totalOutstanding = filteredStudents.reduce(
    (sum, student) => sum + (student.feeData?.totalOutstanding || 0),
    0
  );
  const studentsWithBalance = filteredStudents.filter(
    student => (student.feeData?.totalOutstanding || 0) > 0
  ).length;

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedGrade, selectedClass]);

  useEffect(() => {
    if (students.length > 0) {
      fetchStudentFeeData();
    }
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bursar Dashboard</h1>
          <p className="text-muted-foreground">
            Manage student fees and payments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {grades
                    .find(g => g.id === selectedGrade)
                    ?.classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {totalOutstanding.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Balance</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsWithBalance}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fully Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStudents - studentsWithBalance}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            {filteredStudents.length} students found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.admissionNumber}
                    </TableCell>
                    <TableCell>{student.user.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {student.class.name}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.parent.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{student.parent.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${
                          (student.feeData?.totalOutstanding || 0) > 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          KES {(student.feeData?.totalOutstanding || 0).toLocaleString()}
                        </span>
                        {(student.feeData?.totalOutstanding || 0) > 0 && (
                          <Badge variant="destructive">Balance</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student);
                            setPaymentModalOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Payment
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(student);
                            fetchPaymentHistory(student.id);
                            setHistoryModalOpen(true);
                          }}
                        >
                          <History className="w-4 h-4 mr-1" />
                          History
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manual Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manual Payment</DialogTitle>
            <DialogDescription>
              Record a cash payment for {selectedStudent?.user.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select 
                value={paymentForm.paymentMethod} 
                onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
              <Input
                id="referenceNumber"
                value={paymentForm.referenceNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendSMS"
                checked={paymentForm.sendSMS}
                onChange={(e) => setPaymentForm({ ...paymentForm, sendSMS: e.target.checked })}
              />
              <Label htmlFor="sendSMS">Send SMS notification to parent</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleManualPayment}
              disabled={submittingPayment || !paymentForm.amount}
            >
              {submittingPayment ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
            <DialogDescription>
              Payment history for {selectedStudent?.user.name}
            </DialogDescription>
          </DialogHeader>
          
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Received By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      KES {payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.referenceNumber || "-"}</TableCell>
                    <TableCell>{payment.receiptNumber}</TableCell>
                    <TableCell>{payment.receivedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 