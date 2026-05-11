'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  DollarSign, 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  History, 
  RefreshCw, 
  Filter, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  School,
  BarChart3,
  Calendar,
  LogOut,
  Settings,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import PaymentHub from '@/components/payment/PaymentHub';
import { PaymentHistoryModal } from './PaymentHistoryModal';
import { BursarSidebar } from './BursarSidebar';
import { portalGlassPanelLight } from '@/components/layout/portal-glass-styles';
import { FeeManagement } from '@/components/school-portal/fee-management';

interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  email: string;
  phone: string;
  gradeName: string;
  className: string;
  academicYear: number;
  parent: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  class: {
    id: string;
    name: string;
    grade: {
      id: string;
      name: string;
    };
  } | null;
  feeStructure: {
    id: string;
    name: string;
    totalAmount: number;
    breakdown: any;
  } | null;
  totalFeeRequired: number;
  totalPaid: number;
  balance: number;
  lastPayment?: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
  } | null;
  paymentHistory?: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
  }>;
}

interface Grade {
  id: string;
  name: string;
  classes: Array<{
    id: string;
    name: string;
  }>;
}

interface BursarDashboardProps {
  schoolCode: string;
  mode?: 'bursar' | 'finance';
}

export function BursarDashboard({ schoolCode, mode = 'bursar' }: BursarDashboardProps) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [term, setTerm] = useState<string>('all');
  
  // Payment Hub state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showPaymentHub, setShowPaymentHub] = useState(false);
  
  // Payment History Modal state
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    fullName: '',
    admissionNumber: '',
    dateOfBirth: '',
    dateAdmitted: '',
    classId: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
  });
  
  // Navigation state
  const [activeTab, setActiveTab] = useState('students');
  const [studentsPage, setStudentsPage] = useState(1);
  const [outstandingPage, setOutstandingPage] = useState(1);
  const PAGE_SIZE = 7;
  
  // School and bursar info
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [bursarInfo, setBursarInfo] = useState<any>(null);
  
  const [summary, setSummary] = useState({
    totalStudents: 0,
    totalOutstanding: 0,
    studentsWithBalance: 0,
    fullyPaid: 0,
  });
  const isFinanceMode = mode === 'finance';
  const themeColor =
    typeof schoolInfo?.colorTheme === 'string' && /^#[0-9A-Fa-f]{6}$/.test(schoolInfo.colorTheme)
      ? schoolInfo.colorTheme
      : '#d97706';
  const balancesEndpoint = isFinanceMode
    ? `/api/finance/${schoolCode}/dashboard`
    : `/api/schools/${schoolCode}/students/balances`;

  useEffect(() => {
    fetchGrades();
    fetchStudents();
    fetchSchoolInfo();
    fetchBursarInfo();
  }, [schoolCode, selectedGrade, selectedClass, academicYear, term]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, selectedGrade, selectedClass]);

  useEffect(() => {
    setStudentsPage(1);
    setOutstandingPage(1);
  }, [searchTerm, selectedGrade, selectedClass, academicYear, term, students.length]);

  const fetchSchoolInfo = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}`);
      if (response.ok) {
        const data = await response.json();
        setSchoolInfo(data);
      }
    } catch (error) {
      console.error('Error fetching school info:', error);
    }
  };

  const fetchBursarInfo = async () => {
    try {
      const response = await fetch(
        isFinanceMode
          ? `/api/schools/${schoolCode}/finance/session`
          : `/api/schools/${schoolCode}/bursar/session`
      );
      if (response.ok) {
        const data = await response.json();
        setBursarInfo(data.bursar || data.user);
      }
    } catch (error) {
      console.error('Error fetching bursar info:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(
        isFinanceMode
          ? `/api/schools/${schoolCode}/finance/logout`
          : `/api/schools/${schoolCode}/bursar/logout`,
        {
        method: 'POST',
        }
      );
      
      if (response.ok) {
        window.location.href = isFinanceMode
          ? `/schools/${schoolCode}/finance/login`
          : `/schools/${schoolCode}/bursar/login`;
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout',
        variant: 'destructive',
      });
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/grades`);
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        academicYear,
      });
      if (term && term !== 'all') {
        params.set('term', term);
      }

      if (selectedGrade && selectedGrade !== 'all') params.append('gradeId', selectedGrade);
      if (selectedClass && selectedClass !== 'all') params.append('classId', selectedClass);

      const response = await fetch(`${balancesEndpoint}?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setSummary(data.summary || {
          totalStudents: 0,
          totalOutstanding: 0,
          studentsWithBalance: 0,
          fullyPaid: 0,
        });
      } else {
        throw new Error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch student data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  const handlePaymentComplete = async (receipt: any) => {
    toast({
      title: 'Payment Successful',
      description: `Payment of KES ${receipt.amount.toLocaleString()} recorded successfully`,
    });
    
    await fetchStudents();
    setShowPaymentHub(false);
    setSelectedStudent(null);
  };

  const availableClasses = (
    selectedGrade !== 'all'
      ? grades.find((grade) => grade.id === selectedGrade)?.classes || []
      : grades.flatMap((grade) => grade.classes || [])
  ).filter(
    (cls): cls is { id: string; name: string } =>
      Boolean(cls && typeof cls.id === 'string' && typeof cls.name === 'string')
  );

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.fullName.trim() || !newStudent.classId || !newStudent.admissionNumber.trim()) {
      toast({
        title: 'Missing Details',
        description: 'Student name, admission number, class, parent name, parent phone, and parent email are required.',
        variant: 'destructive',
      });
      return;
    }
    if (!newStudent.parentName.trim() || !newStudent.parentPhone.trim() || !newStudent.parentEmail.trim()) {
      toast({
        title: 'Missing Parent Details',
        description: 'Parent name, phone, and email are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreatingStudent(true);
      const parsedYearOfBirth = newStudent.dateOfBirth
        ? new Date(newStudent.dateOfBirth).getFullYear()
        : undefined;

      const response = await fetch(`/api/schools/${schoolCode}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStudent.fullName.trim(),
          classId: newStudent.classId,
          admissionNumber: newStudent.admissionNumber.trim(),
          dateOfBirth: newStudent.dateOfBirth || undefined,
          yearOfBirth: parsedYearOfBirth,
          dateAdmitted: newStudent.dateAdmitted || undefined,
          parentName: newStudent.parentName.trim() || undefined,
          parentPhone: newStudent.parentPhone.trim() || undefined,
          parentEmail: newStudent.parentEmail.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Could not add student');
      }

      toast({
        title: 'Student Onboarded',
        description: `${newStudent.fullName.trim()} has been added successfully.`,
      });
      setShowAddStudent(false);
      setNewStudent({
        fullName: '',
        admissionNumber: '',
        dateOfBirth: '',
        dateAdmitted: '',
        classId: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
      });
      await fetchStudents();
    } catch (error) {
      toast({
        title: 'Add Student Failed',
        description: error instanceof Error ? error.message : 'Could not add student',
        variant: 'destructive',
      });
    } finally {
      setCreatingStudent(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const csvData = filteredStudents.map(student => ({
        'Admission Number': student.admissionNumber,
        'Student Name': student.name,
        'Grade': student.gradeName,
        'Class': student.className,
        'Parent Name': student.parent?.name || 'N/A',
        'Parent Phone': student.parent?.phone || 'N/A',
        'Total Fee Required': student.totalFeeRequired,
        'Total Paid': student.totalPaid,
        'Outstanding Balance': student.balance,
        'Last Payment': student.lastPayment ? 
          `KES ${student.lastPayment.amount} on ${new Date(student.lastPayment.paymentDate).toLocaleDateString()}` : 
          'No payments',
      }));

      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bursar-fee-report-${schoolCode}-${academicYear}-${term === 'all' ? 'all-terms' : term}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: 'Student fee data exported to CSV',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export student data',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={
          {
            "--brand": themeColor,
            "--brand-12": `${themeColor}12`,
            "--brand-18": `${themeColor}18`,
            backgroundColor: `${themeColor}12`,
          } as React.CSSProperties
        }
      >
        <div className="text-center">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{ backgroundColor: themeColor }}
            >
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
            <div
              className="absolute inset-0 w-16 h-16 rounded-2xl mx-auto opacity-20 animate-pulse"
              style={{ backgroundColor: themeColor }}
            />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isFinanceMode ? 'Loading Finance Module' : 'Loading Bursar Dashboard'}
          </h2>
          <p className="text-gray-600">Preparing financial management interface...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    const totalStudentsPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
    const studentsPageData = filteredStudents.slice(
      (studentsPage - 1) * PAGE_SIZE,
      studentsPage * PAGE_SIZE
    );
    const outstandingStudents = filteredStudents.filter((s) => s.balance > 0);
    const totalOutstandingPages = Math.max(1, Math.ceil(outstandingStudents.length / PAGE_SIZE));
    const outstandingPageData = outstandingStudents.slice(
      (outstandingPage - 1) * PAGE_SIZE,
      outstandingPage * PAGE_SIZE
    );

    const renderPagination = (
      page: number,
      totalPages: number,
      onPageChange: (value: number) => void
    ) => {
      if (totalPages <= 1) return null;
      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
      return (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: "1px solid var(--brand-18)" }}
        >
          <p className="text-sm" style={{ color: "var(--brand)" }}>
            Page <span className="font-semibold">{page}</span> of{" "}
            <span className="font-semibold">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="hover:bg-transparent"
              style={{ borderColor: "var(--brand-24)", color: "var(--brand)" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pages.map((p) => (
              <Button
                key={p}
                size="sm"
                variant={p === page ? "default" : "outline"}
                onClick={() => onPageChange(p)}
                className={p === page ? "text-white" : "hover:bg-transparent"}
                style={
                  p === page
                    ? { backgroundColor: "var(--brand)" }
                    : { borderColor: "var(--brand-24)", color: "var(--brand)" }
                }
              >
                {p}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="hover:bg-transparent"
              style={{ borderColor: "var(--brand-24)", color: "var(--brand)" }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    };

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-md transition-all duration-300 hover:shadow-lg" style={{ border: "1px solid var(--brand-24)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: "var(--brand)" }}>Total Students</CardTitle>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border" style={{ backgroundColor: "var(--brand)", borderColor: "var(--brand-24)" }}>
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1" style={{ color: "var(--brand)" }}>{summary.totalStudents}</div>
                  <p className="text-xs font-medium text-slate-600">Enrolled students</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-red-50 to-white border-red-200/50 hover:shadow-xl hover:shadow-red-100/50 transition-all duration-300 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-red-800">Total Outstanding</CardTitle>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg border border-red-500/20">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-900 mb-1">
                    {formatCurrency(summary.totalOutstanding)}
                  </div>
                  <p className="text-xs text-red-600 font-medium">Pending payments</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm shadow-md transition-all duration-300 hover:shadow-lg" style={{ border: "1px solid var(--brand-24)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: "var(--brand)" }}>With Balance</CardTitle>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border" style={{ backgroundColor: "var(--brand)", borderColor: "var(--brand-24)" }}>
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1" style={{ color: "var(--brand)" }}>{summary.studentsWithBalance}</div>
                  <p className="text-xs font-medium text-slate-600">Require payment</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200/50 hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-emerald-800">Fully Paid</CardTitle>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg border border-emerald-500/20">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-900 mb-1">{summary.fullyPaid}</div>
                  <p className="text-xs text-emerald-600 font-medium">Completed payments</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );



      case 'outstanding':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Outstanding Fees</h2>
                <p className="text-gray-600">Students with pending fee payments</p>
              </div>
            </div>
            <Card className="bg-white/80 backdrop-blur-sm shadow-md overflow-hidden" style={{ border: "1px solid var(--brand-18)" }}>
              <CardHeader className="border-b bg-white/70" style={{ borderColor: "var(--brand-18)" }}>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ backgroundColor: "var(--brand)", borderColor: "var(--brand-24)" }}>
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-800">Students with Outstanding Balances</span>
                  <Badge variant="secondary" className="text-white border" style={{ backgroundColor: "var(--brand)", borderColor: "var(--brand-24)" }}>
                    {outstandingStudents.length} students
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b" style={{ backgroundColor: "var(--brand-12)", borderColor: "var(--brand-18)" }}>
                        <TableHead className="font-semibold py-4" style={{ color: "var(--brand)" }}>Student</TableHead>
                        <TableHead className="font-semibold" style={{ color: "var(--brand)" }}>Grade & Class</TableHead>
                        <TableHead className="font-semibold text-right" style={{ color: "var(--brand)" }}>Outstanding Amount</TableHead>
                        <TableHead className="font-semibold text-center" style={{ color: "var(--brand)" }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outstandingPageData.map((student) => (
                        <TableRow key={student.id} className="transition-colors duration-200 border-b hover:bg-[color:var(--brand-12)]" style={{ borderColor: "var(--brand-18)" }}>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm border" style={{ backgroundColor: "var(--brand)", borderColor: "var(--brand-24)" }}>
                                {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500 font-mono">{student.admissionNumber}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{student.gradeName}</div>
                              <div className="text-sm text-gray-600">{student.className}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-bold text-red-600">{formatCurrency(student.balance)}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowPaymentHub(true);
                              }}
                              className="text-white"
                              style={{ backgroundColor: "var(--brand)" }}
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              Pay Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {outstandingStudents.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">All Fees Paid!</h3>
                      <p className="text-gray-600">No students have outstanding balances.</p>
                    </div>
                  )}
                </div>
                {renderPagination(outstandingPage, totalOutstandingPages, setOutstandingPage)}
              </CardContent>
            </Card>
          </div>
        );

      case 'fee-structure':
        return (
          <div className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm shadow-sm" style={{ border: "1px solid var(--brand-18)" }}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: "var(--brand)" }}>Fee Structure Actions</h3>
                    <p className="text-sm text-slate-600">
                      Add, update, and delete fee structures from this section.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="text-white"
                      style={{ backgroundColor: "var(--brand)" }}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Fee Structure
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:bg-transparent"
                      style={{ borderColor: "var(--brand-24)", color: "var(--brand)" }}
                      onClick={() =>
                        toast({
                          title: 'Tip',
                          description: 'Open any fee structure row below and click edit to update it.',
                        })
                      }
                    >
                      Update Fee Structure
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:bg-transparent text-red-700"
                      style={{ borderColor: "var(--brand-24)" }}
                      onClick={() =>
                        toast({
                          title: 'Tip',
                          description: 'Use the actions column in the fee structure table to edit or delete.',
                        })
                      }
                    >
                      Delete Fee Structure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <FeeManagement
              schoolCode={schoolCode}
              colorTheme={themeColor}
              onFeeStructureCreated={fetchStudents}
            />
          </div>
        );



      case 'reports':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Financial Reports</h2>
                <p className="text-gray-600">Generate comprehensive fee reports and statements</p>
              </div>
              <Button onClick={exportToExcel} className="text-white" style={{ backgroundColor: "var(--brand)" }}>
                <Download className="w-4 h-4 mr-2" />
                Export Current Data
              </Button>
            </div>
            

            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border" style={{ borderColor: "var(--brand-24)" }} onClick={exportToExcel}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{ color: "var(--brand)" }}>
                    <Download className="w-5 h-5" />
                    Student Fee Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm">Complete student fee summary with balances and payment history</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border" style={{ borderColor: "var(--brand-24)" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{ color: "var(--brand)" }}>
                    <TrendingUp className="w-5 h-5" />
                    Collection Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm">Total collections and outstanding amounts by period</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border" style={{ borderColor: "var(--brand-24)" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{ color: "var(--brand)" }}>
                    <BarChart3 className="w-5 h-5" />
                    Grade-wise Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm">Fee collection analysis by grade and class</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Payment Analytics</h2>
                <p className="text-gray-600">Payment trends and insights</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-md border" style={{ borderColor: "var(--brand-24)" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{ color: "var(--brand)" }}>
                    <TrendingUp className="w-5 h-5" style={{ color: "var(--brand)" }} />
                    Collection Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2" style={{ color: "var(--brand)" }}>
                    {summary.totalStudents > 0 ? Math.round((summary.fullyPaid / summary.totalStudents) * 100) : 0}%
                  </div>
                  <p className="text-gray-600 text-sm">Students with complete fee payment</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-md border" style={{ borderColor: "var(--brand-24)" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3" style={{ color: "var(--brand)" }}>
                    <DollarSign className="w-5 h-5" style={{ color: "var(--brand)" }} />
                    Average Outstanding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2" style={{ color: "var(--brand)" }}>
                    {formatCurrency(summary.studentsWithBalance > 0 ? summary.totalOutstanding / summary.studentsWithBalance : 0)}
                  </div>
                  <p className="text-gray-600 text-sm">Per student with outstanding balance</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );



      case 'students':
      default:
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "var(--brand)" }}>Student Fee Management</h2>
                <p className="text-slate-600">Manage student fee payments and balances</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center sm:space-x-3">
                <Button
                  onClick={() => setShowAddStudent(true)}
                  className="text-white shadow-lg w-full sm:w-auto"
                  style={{ backgroundColor: themeColor }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
                <Button 
                  onClick={exportToExcel} 
                  className="text-white shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                  style={{ backgroundColor: themeColor }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button 
                  onClick={fetchStudents}
                  variant="outline"
                  className="shadow-sm w-full sm:w-auto"
                  style={{ borderColor: themeColor, color: themeColor }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Enhanced Filters Section */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md" style={{ border: "1px solid var(--brand-18)" }}>
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="flex items-center gap-3" style={{ color: "var(--brand)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm" style={{ backgroundColor: "var(--brand)", borderColor: "var(--brand-24)" }}>
                    <Filter className="w-4 h-4 text-white" />
                  </div>
                  Advanced Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-2">
                    <Label htmlFor="search" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Search Students
                    </Label>
                    <Input
                      id="search"
                      placeholder="Name, admission number, or parent..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mt-1 border-gray-300 focus-visible:border-[color:var(--brand)] focus-visible:ring-1 focus-visible:ring-[color:var(--brand)]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="grade" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Grade
                    </Label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger className="mt-1 border-gray-300 focus-visible:border-[color:var(--brand)] focus-visible:ring-1 focus-visible:ring-[color:var(--brand)]">
                        <SelectValue placeholder="All Grades" />
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
                    <Label htmlFor="class" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Class
                    </Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="mt-1 border-gray-300 focus-visible:border-[color:var(--brand)] focus-visible:ring-1 focus-visible:ring-[color:var(--brand)]">
                        <SelectValue placeholder="All Classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {selectedGrade && selectedGrade !== "all" && grades
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
                    <Label htmlFor="academicYear" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Academic Year
                    </Label>
                    <Select value={academicYear} onValueChange={setAcademicYear}>
                      <SelectTrigger className="mt-1 border-gray-300 focus-visible:border-[color:var(--brand)] focus-visible:ring-1 focus-visible:ring-[color:var(--brand)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="term" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Term
                      </Label>
                      <Select value={term} onValueChange={setTerm}>
                        <SelectTrigger className="mt-1 border-gray-300 focus-visible:border-[color:var(--brand)] focus-visible:ring-1 focus-visible:ring-[color:var(--brand)]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All terms</SelectItem>
                          <SelectItem value="Term 1">Term 1</SelectItem>
                          <SelectItem value="Term 2">Term 2</SelectItem>
                          <SelectItem value="Term 3">Term 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedGrade('all');
                          setSelectedClass('all');
                          setTerm('all');
                        }}
                        variant="outline"
                        className="w-full hover:bg-transparent"
                        style={{ borderColor: "var(--brand-24)", color: "var(--brand)" }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm px-3 py-2 rounded-lg w-full border" style={{ color: "var(--brand)", backgroundColor: "var(--brand-12)", borderColor: "var(--brand-18)" }}>
                        Showing <span className="font-semibold">{filteredStudents.length}</span> of {students.length} students
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Students Table */}
            <Card className="bg-white/80 shadow-lg overflow-hidden backdrop-blur-sm" style={{ border: "1px solid var(--brand-18)" }}>
              <CardHeader className="border-b bg-white/70" style={{ borderColor: "var(--brand-18)" }}>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm"
                      style={{ backgroundColor: "var(--brand)", borderColor: "var(--brand-24)" }}
                    >
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold" style={{ color: "var(--brand)" }}>
                      Student Fee Management
                    </span>
                    <Badge variant="secondary" className="text-white border" style={{ backgroundColor: "var(--brand)", borderColor: "var(--brand-24)" }}>
                      {filteredStudents.length} students
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b" style={{ backgroundColor: "var(--brand-12)", borderColor: "var(--brand-18)" }}>
                        <TableHead className="font-semibold py-4" style={{ color: "var(--brand)" }}>Student Information</TableHead>
                        <TableHead className="font-semibold" style={{ color: "var(--brand)" }}>Grade & Class</TableHead>
                        <TableHead className="font-semibold" style={{ color: "var(--brand)" }}>Parent Contact</TableHead>
                        <TableHead className="font-semibold text-right" style={{ color: "var(--brand)" }}>Fee Required</TableHead>
                        <TableHead className="font-semibold text-right" style={{ color: "var(--brand)" }}>Amount Paid</TableHead>
                        <TableHead className="font-semibold text-right" style={{ color: "var(--brand)" }}>Outstanding</TableHead>
                        <TableHead className="font-semibold text-center" style={{ color: "var(--brand)" }}>Status</TableHead>
                        <TableHead className="font-semibold text-center" style={{ color: "var(--brand)" }}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsPageData.map((student) => (
                        <TableRow
                          key={student.id}
                          className="transition-colors duration-200 border-b hover:bg-[color:var(--brand-12)]"
                          style={{
                            borderColor: "var(--brand-18)",
                          }}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm border"
                                style={{ backgroundColor: "var(--brand)", borderColor: "var(--brand-24)" }}
                              >
                                {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500 font-mono">{student.admissionNumber}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{student.gradeName}</div>
                              <div className="text-sm text-gray-600">{student.className}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{student.parent?.name || 'Not Available'}</div>
                              <div className="text-sm text-gray-600 font-mono">{student.parent?.phone || 'No contact'}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-semibold text-gray-900">{formatCurrency(student.totalFeeRequired)}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-semibold text-green-700">{formatCurrency(student.totalPaid)}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`font-bold ${student.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(student.balance)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={student.balance <= 0 ? 'default' : 'destructive'}
                              className={`${
                                student.balance <= 0 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }`}
                            >
                              {student.balance <= 0 ? 'Fully Paid' : 'Outstanding'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowPaymentHub(true);
                                }}
                                className="text-white shadow-sm hover:shadow-md transition-all duration-200"
                                style={{ backgroundColor: "var(--brand)" }}
                              >
                                <CreditCard className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Record Payment</span>
                                <span className="sm:hidden">Pay</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setHistoryStudent(student);
                                  setShowPaymentHistory(true);
                                }}
                                className="shadow-sm hover:bg-transparent"
                                style={{ borderColor: "var(--brand-24)", color: "var(--brand)" }}
                              >
                                <History className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
                      <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
                    </div>
                  )}
                </div>
                {renderPagination(studentsPage, totalStudentsPages, setStudentsPage)}
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div
      className="min-h-screen"
      style={
        {
          "--brand": themeColor,
          "--brand-12": `${themeColor}12`,
          "--brand-18": `${themeColor}18`,
          "--brand-24": `${themeColor}24`,
          backgroundColor: `${themeColor}12`,
        } as React.CSSProperties
      }
    >
      {/* Sidebar Navigation */}
            <BursarSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        bursar={bursarInfo}
        schoolName={schoolInfo?.name}
        schoolCode={schoolCode}
        colorTheme={themeColor}
        summary={summary}
      />

      {/* Main Content */}
      <div className="lg:ml-80">
        {/* Enhanced Top Header - Sticky */}
        <div
          className="sticky-header bg-gradient-to-r from-white/95 to-white/80 px-4 py-4 sm:px-6 sm:py-6 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-white/80"
          style={{ borderBottom: "1px solid var(--brand-18)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: themeColor }}>
                {activeTab === 'dashboard' && 'Financial Dashboard'}
                {activeTab === 'students' && 'Student Fee Management'}
                {activeTab === 'outstanding' && 'Outstanding Fees'}
                {activeTab === 'fee-structure' && 'Fee Structure Management'}
                {activeTab === 'reports' && 'Financial Reports'}
                {activeTab === 'analytics' && 'Payment Analytics'}
              </h1>
              <p className="text-sm mt-2 font-medium" style={{ color: themeColor }}>
                {schoolInfo?.name || (isFinanceMode ? 'Independent Finance Module' : 'Financial Management System')}
              </p>
            </div>
            
            {/* Current Tab Indicator */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>
                  Current Session
                </p>
                <p className="text-xs" style={{ color: "var(--brand)" }}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-12 w-12 rounded-full text-white shadow-lg border border-white/20 flex items-center justify-center"
                    style={{ backgroundColor: themeColor }}
                    aria-label="Profile menu"
                  >
                    <User className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {bursarInfo?.name || 'Bursar Account'}
                  </DropdownMenuLabel>
                  <div className="px-2 pb-2 text-xs text-muted-foreground">
                    {bursarInfo?.email || 'Financial Management'}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-700 focus:text-red-800"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="p-3 pb-20 sm:p-4 lg:p-6 lg:pb-6 min-h-[calc(100vh-8rem)]" style={{ backgroundColor: "var(--brand-12)" }}>
          <div className={`${portalGlassPanelLight} p-3 sm:p-4 lg:p-6 min-h-[320px]`}>{renderTabContent()}</div>
        </div>
      </div>

      {/* Payment Hub Dialog */}
      <Dialog open={showPaymentHub} onOpenChange={setShowPaymentHub}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--brand)" }}>
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Process Payment - {selectedStudent?.name}
              </span>
            </DialogTitle>
            <p className="text-gray-600 mt-2">
              Admission: {selectedStudent?.admissionNumber} • {selectedStudent?.gradeName} - {selectedStudent?.className}
            </p>
          </DialogHeader>
          {selectedStudent && (
            <div className="mt-6">
              <PaymentHub
                studentId={selectedStudent.id}
                schoolCode={schoolCode}
                onPaymentComplete={handlePaymentComplete}
                initialAcademicYear={academicYear}
                initialSelectedTerm={term !== 'all' ? term : undefined}
                paymentRecordedBy="Bursar Office"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment History Modal */}
      {historyStudent && (
        <PaymentHistoryModal
          isOpen={showPaymentHistory}
          onClose={() => {
            setShowPaymentHistory(false);
            setHistoryStudent(null);
          }}
          student={historyStudent}
          schoolCode={schoolCode}
        />
      )}

      {/* Add Student Onboarding Modal */}
      <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Onboard New Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Full Name</Label>
              <Input
                id="studentName"
                value={newStudent.fullName}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter student full name"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="admissionNumber">Admission Number</Label>
                <Input
                  id="admissionNumber"
                  value={newStudent.admissionNumber}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, admissionNumber: e.target.value }))}
                  placeholder="Required (set by bursar)"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={newStudent.dateOfBirth}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateAdmitted">Date Enrolled</Label>
                <Input
                  id="dateAdmitted"
                  type="date"
                  value={newStudent.dateAdmitted}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, dateAdmitted: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentClass">Class</Label>
              <Select
                value={newStudent.classId}
                onValueChange={(value) => setNewStudent((prev) => ({ ...prev, classId: value }))}
              >
                <SelectTrigger id="studentClass">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent/Guardian Name</Label>
                <Input
                  id="parentName"
                  value={newStudent.parentName}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, parentName: e.target.value }))}
                  placeholder="Required"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent Phone</Label>
                <Input
                  id="parentPhone"
                  value={newStudent.parentPhone}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, parentPhone: e.target.value }))}
                  placeholder="Required"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentEmail">Parent Email</Label>
              <Input
                id="parentEmail"
                type="email"
                value={newStudent.parentEmail}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, parentEmail: e.target.value }))}
                placeholder="Required"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddStudent(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingStudent}
                className="text-white"
                style={{ backgroundColor: themeColor }}
              >
                {creatingStudent ? 'Adding...' : 'Add Student'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
