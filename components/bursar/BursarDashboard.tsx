'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import PromotionsSection from '@/components/school-portal/PromotionsSection';
import { getWorkspaceThemeTokens } from '@/lib/utils/school-theme';
import { BulkImport } from '@/components/ui/bulk-import';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface GradeFeeRollup {
  gradeName: string;
  totalStudents: number;
  totalFeeRequired: number;
  totalPaid: number;
  totalOutstanding: number;
}

interface FeeDashboardSummary {
  totalStudents: number;
  totalOutstanding: number;
  studentsWithBalance: number;
  fullyPaid: number;
  partiallyPaid: number;
  unpaidBillable: number;
  noBillableFee: number;
  totalFeeRequired: number;
  totalPaid: number;
}

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

function normalizeListPayload(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown[] }).data)) {
    return (data as { data: unknown[] }).data;
  }
  return [];
}

export function BursarDashboard({ schoolCode, mode = 'bursar' }: BursarDashboardProps) {
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [now, setNow] = useState(() => new Date());
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
    gradeId: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
  });

  const [showEditStudent, setShowEditStudent] = useState(false);
  const [editStudentRecord, setEditStudentRecord] = useState<Student | null>(null);
  const [updatingStudent, setUpdatingStudent] = useState(false);
  const [editForm, setEditForm] = useState({
    studentId: '',
    fullName: '',
    admissionNumber: '',
    dateOfBirth: '',
    dateAdmitted: '',
    gradeId: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
  });
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState(false);
  
  // Navigation state
  const [activeTab, setActiveTab] = useState('students');
  const [studentsPage, setStudentsPage] = useState(1);
  const [outstandingPage, setOutstandingPage] = useState(1);
  const PAGE_SIZE = 7;
  
  // School and bursar info
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [bursarInfo, setBursarInfo] = useState<any>(null);
  
  const [summary, setSummary] = useState<FeeDashboardSummary>({
    totalStudents: 0,
    totalOutstanding: 0,
    studentsWithBalance: 0,
    fullyPaid: 0,
    partiallyPaid: 0,
    unpaidBillable: 0,
    noBillableFee: 0,
    totalFeeRequired: 0,
    totalPaid: 0,
  });
  const [byGrade, setByGrade] = useState<GradeFeeRollup[]>([]);
  const isFinanceMode = mode === 'finance';
  const themeColor =
    typeof schoolInfo?.colorTheme === 'string' && /^#[0-9A-Fa-f]{6}$/.test(schoolInfo.colorTheme)
      ? schoolInfo.colorTheme
      : '#d97706';
  const balancesEndpoint = isFinanceMode
    ? `/api/finance/${schoolCode}/dashboard`
    : `/api/schools/${schoolCode}/students/balances`;
  const workspaceTheme = getWorkspaceThemeTokens(themeColor);

  /** Grades API returns levels only; classes API has sections. Merge so filters & onboarding work. */
  const fetchGradeClassCatalog = useCallback(async () => {
    try {
      const [gradesRes, classesRes] = await Promise.all([
        fetch(`/api/schools/${schoolCode}/grades`, { credentials: 'include' }),
        fetch(`/api/schools/${schoolCode}/classes`, { credentials: 'include' }),
      ]);

      const gradeRows = normalizeListPayload(gradesRes.ok ? await gradesRes.json() : []) as Array<{ id: string; name: string }>;
      const classRows = normalizeListPayload(classesRes.ok ? await classesRes.json() : []) as Array<{
        id: string;
        name: string;
        grade?: { id: string; name: string };
        gradeId?: string;
      }>;

      const byGradeId = new Map<string, Grade>();

      for (const cls of classRows) {
        const gid = cls.grade?.id || cls.gradeId;
        const gname = cls.grade?.name?.trim() || 'Grade';
        if (!gid || !cls.id || !cls.name?.trim()) continue;
        if (!byGradeId.has(gid)) {
          byGradeId.set(gid, { id: gid, name: gname, classes: [] });
        }
        byGradeId.get(gid)!.classes.push({ id: cls.id, name: cls.name.trim() });
      }

      for (const g of gradeRows) {
        if (g?.id && g?.name && !byGradeId.has(g.id)) {
          byGradeId.set(g.id, { id: g.id, name: g.name.trim(), classes: [] });
        }
      }

      const merged = Array.from(byGradeId.values()).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
      setGrades(merged);
    } catch (error) {
      console.error('Error fetching grades/classes:', error);
      setGrades([]);
    }
  }, [schoolCode]);

  useEffect(() => {
    fetchGradeClassCatalog();
    fetchStudents();
    fetchSchoolInfo();
    fetchBursarInfo();
  }, [schoolCode, selectedGrade, selectedClass, academicYear, term, fetchGradeClassCatalog]);

  useEffect(() => {
    if (showAddStudent) {
      fetchGradeClassCatalog();
    }
  }, [showAddStudent, fetchGradeClassCatalog]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

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
        setSummary({
          totalStudents: 0,
          totalOutstanding: 0,
          studentsWithBalance: 0,
          fullyPaid: 0,
          partiallyPaid: 0,
          unpaidBillable: 0,
          noBillableFee: 0,
          totalFeeRequired: 0,
          totalPaid: 0,
          ...(data.summary || {}),
        });
        setByGrade(Array.isArray(data.byGrade) ? data.byGrade : []);
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

  const handlePaymentComplete = async (
    _receipt: unknown,
    opts?: { undoWindowActive?: boolean }
  ) => {
    await fetchStudents();
    if (!opts?.undoWindowActive) {
      setShowPaymentHub(false);
      setSelectedStudent(null);
    }
  };

  const handlePaymentUndoSettled = async () => {
    await fetchStudents();
    setShowPaymentHub(false);
    setSelectedStudent(null);
  };

  /** One option per grade (backend resolves the single classId when only one class exists under that grade). */
  const onboardGradeOptions = grades
    .filter((g) => (g.classes || []).length > 0)
    .map((g) => ({ id: g.id, label: g.name }));

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.fullName.trim() || !newStudent.gradeId || !newStudent.admissionNumber.trim()) {
      toast({
        title: 'Missing Details',
        description: 'Student name, admission number, grade, parent name, parent phone, and parent email are required.',
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
          gradeId: newStudent.gradeId,
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
        gradeId: '',
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

  const openEditStudent = (student: Student) => {
    setEditStudentRecord(student);
    setEditForm({
      studentId: student.id,
      fullName: student.name,
      admissionNumber: student.admissionNumber,
      dateOfBirth: '',
      dateAdmitted: '',
      gradeId: student.class?.grade?.id || '',
      parentName: student.parent?.name || '',
      parentPhone: student.parent?.phone || '',
      parentEmail: student.parent?.email || '',
    });
    setShowEditStudent(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.studentId || !editStudentRecord) return;
    if (!editForm.fullName.trim() || !editForm.gradeId || !editForm.admissionNumber.trim()) {
      toast({
        title: 'Missing Details',
        description: 'Student name, admission number, and grade are required.',
        variant: 'destructive',
      });
      return;
    }
    if (!editForm.parentName.trim() || !editForm.parentPhone.trim() || !editForm.parentEmail.trim()) {
      toast({
        title: 'Missing Parent Details',
        description: 'Parent name, phone, and email are required.',
        variant: 'destructive',
      });
      return;
    }

    let classId: string | null = null;
    if (editForm.gradeId === editStudentRecord.class?.grade?.id) {
      classId = editStudentRecord.class?.id || null;
    } else {
      const list = grades.find((g) => g.id === editForm.gradeId)?.classes || [];
      if (list.length === 1) classId = list[0].id;
    }
    if (!classId) {
      toast({
        title: 'Class not resolved',
        description:
          'Keep the same grade, or choose a grade that has exactly one class under it (same rule as onboarding).',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpdatingStudent(true);
      const response = await fetch(`/api/schools/${schoolCode}/students`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: editForm.studentId,
          name: editForm.fullName.trim(),
          admissionNumber: editForm.admissionNumber.trim(),
          dateOfBirth: editForm.dateOfBirth || undefined,
          dateAdmitted: editForm.dateAdmitted || undefined,
          classId,
          parentName: editForm.parentName.trim(),
          parentPhone: editForm.parentPhone.trim(),
          parentEmail: editForm.parentEmail.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Could not update student');
      }
      toast({
        title: 'Student updated',
        description: `${editForm.fullName.trim()} was saved successfully.`,
      });
      setShowEditStudent(false);
      setEditStudentRecord(null);
      await fetchStudents();
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update student',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStudent(false);
    }
  };

  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      setDeletingStudent(true);
      const res = await fetch(`/api/schools/${schoolCode}/students`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentToDelete.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not delete student');
      }
      toast({
        title: 'Student removed',
        description: `${studentToDelete.name} and related fee records were deleted.`,
      });
      const removedId = studentToDelete.id;
      setStudentToDelete(null);
      if (selectedStudent?.id === removedId) {
        setSelectedStudent(null);
        setShowPaymentHub(false);
      }
      if (historyStudent?.id === removedId) {
        setShowPaymentHistory(false);
        setHistoryStudent(null);
      }
      await fetchStudents();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Could not delete student',
        variant: 'destructive',
      });
    } finally {
      setDeletingStudent(false);
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

  const fyLabel = `FY ${academicYear}`;
  const termLabel = term === "all" ? "All Terms" : term;

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
      case 'dashboard': {
        const pctOfEnrolled = (n: number) =>
          summary.totalStudents > 0 ? Math.round((n / summary.totalStudents) * 100) : 0;
        const enrolledFullyPct = pctOfEnrolled(summary.fullyPaid);
        const enrolledPartialPct = pctOfEnrolled(summary.partiallyPaid);
        const enrolledUnpaidPct = pctOfEnrolled(summary.unpaidBillable);
        const enrolledNoFeePct = pctOfEnrolled(summary.noBillableFee);
        const feeDen = summary.totalFeeRequired > 0 ? summary.totalFeeRequired : 0;
        const collectionPct =
          feeDen > 0 ? Math.min(100, Math.round((summary.totalPaid / feeDen) * 100)) : summary.totalStudents === 0 ? 0 : 100;

        const gradePaymentChartData = byGrade.map((g) => ({
          name: g.gradeName.length > 14 ? `${g.gradeName.slice(0, 12)}…` : g.gradeName,
          fullName: g.gradeName,
          collected: Math.round(g.totalPaid),
          outstanding: Math.round(g.totalOutstanding),
          students: g.totalStudents,
        }));

        const gradeHeadcountData = byGrade.map((g) => ({
          name: g.gradeName.length > 14 ? `${g.gradeName.slice(0, 12)}…` : g.gradeName,
          fullName: g.gradeName,
          students: g.totalStudents,
        }));

        const paymentsByGradeChartHeight = Math.min(
          420,
          Math.max(260, gradePaymentChartData.length * 44 + 120)
        );

        const currencyTick = (v: number) =>
          new Intl.NumberFormat('en-KE', {
            notation: v >= 1_000_000 ? 'compact' : 'standard',
            compactDisplay: 'short',
            maximumFractionDigits: v >= 1_000_000 ? 1 : 0,
          }).format(v);

        const tooltipMoneyStyle = {
          backgroundColor: 'rgba(255,255,255,0.96)',
          border: '1px solid var(--brand-18)',
          borderRadius: '8px',
          fontSize: '12px',
        };

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="bg-white/80 backdrop-blur-sm shadow-md transition-all duration-300 hover:shadow-lg" style={{ border: "1px solid var(--brand-24)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: "var(--brand)" }}>Total Students</CardTitle>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border" style={{ backgroundColor: "var(--secondary)", borderColor: "var(--secondary-24)" }}>
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1" style={{ color: "var(--brand)" }}>{summary.totalStudents}</div>
                  <p className="text-xs font-medium text-slate-600">Enrolled students in view</p>
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
                  <p className="text-xs text-red-600 font-medium">Pending payments (balance)</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-md transition-all duration-300 hover:shadow-lg" style={{ border: "1px solid var(--brand-24)" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold" style={{ color: "var(--brand)" }}>With Balance</CardTitle>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border" style={{ backgroundColor: "var(--secondary)", borderColor: "var(--secondary-24)" }}>
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
                  <p className="text-xs text-emerald-600 font-medium">Billable fees cleared (no balance)</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/80 backdrop-blur-sm shadow-md" style={{ border: "1px solid var(--brand-24)" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--brand)" }}>
                    <DollarSign className="h-4 w-4" />
                    Total fees (billable)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: "var(--brand)" }}>
                    {formatCurrency(summary.totalFeeRequired)}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Expected fees for students in this view</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm shadow-md" style={{ border: "1px solid var(--brand-24)" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--brand)" }}>
                    <TrendingUp className="h-4 w-4" />
                    Total collected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-700">{formatCurrency(summary.totalPaid)}</div>
                  <p className="text-xs text-slate-600 mt-1">Payments recorded toward those fees</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/90 backdrop-blur-sm shadow-md overflow-hidden" style={{ border: "1px solid var(--brand-18)" }}>
                <CardHeader className="pb-2 border-b border-slate-100">
                  <CardTitle className="text-base font-semibold" style={{ color: "var(--brand)" }}>
                    Students: payment status
                  </CardTitle>
                  <p className="text-xs text-slate-600 mt-1">
                    Fully paid, partially paid, and unpaid (share of enrolled)
                  </p>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex h-10 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
                    {summary.totalStudents === 0 ? (
                      <div className="flex w-full items-center justify-center text-xs text-slate-500">No students in this view</div>
                    ) : (
                      <>
                        <div
                          className="h-full flex items-center justify-center px-2 text-[11px] font-semibold text-white transition-all"
                          style={{
                            width: `${enrolledFullyPct}%`,
                            backgroundColor: '#059669',
                            minWidth: enrolledFullyPct > 0 ? '2.25rem' : 0,
                          }}
                          title={`Fully paid: ${summary.fullyPaid}`}
                        >
                          {enrolledFullyPct > 8 ? `${enrolledFullyPct}%` : ''}
                        </div>
                        <div
                          className="h-full flex items-center justify-center px-2 text-[11px] font-semibold text-white transition-all"
                          style={{
                            width: `${enrolledPartialPct}%`,
                            backgroundColor: '#d97706',
                            minWidth: enrolledPartialPct > 0 ? '2.25rem' : 0,
                          }}
                          title={`Partially paid: ${summary.partiallyPaid}`}
                        >
                          {enrolledPartialPct > 8 ? `${enrolledPartialPct}%` : ''}
                        </div>
                        <div
                          className="h-full flex items-center justify-center px-2 text-[11px] font-semibold text-white transition-all"
                          style={{
                            width: `${enrolledUnpaidPct}%`,
                            backgroundColor: '#ea580c',
                            minWidth: enrolledUnpaidPct > 0 ? '2.25rem' : 0,
                          }}
                          title={`Unpaid (billable): ${summary.unpaidBillable}`}
                        >
                          {enrolledUnpaidPct > 8 ? `${enrolledUnpaidPct}%` : ''}
                        </div>
                        <div
                          className="h-full flex items-center justify-center px-2 text-[11px] font-semibold text-white transition-all"
                          style={{
                            width: `${enrolledNoFeePct}%`,
                            backgroundColor: '#64748b',
                            minWidth: enrolledNoFeePct > 0 ? '2.25rem' : 0,
                          }}
                          title={`No billable fee in view: ${summary.noBillableFee}`}
                        >
                          {enrolledNoFeePct > 8 ? `${enrolledNoFeePct}%` : ''}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      Fully paid: <strong>{summary.fullyPaid}</strong>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-600" />
                      Partially paid: <strong>{summary.partiallyPaid}</strong>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-600" />
                      Unpaid: <strong>{summary.unpaidBillable}</strong>
                    </span>
                    {summary.noBillableFee > 0 ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-slate-500" />
                        No fee set: <strong>{summary.noBillableFee}</strong>
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      With balance (any): <strong>{summary.studentsWithBalance}</strong>
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-2">
                      <span>Fee collection progress</span>
                      <span>{collectionPct}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${collectionPct}%`,
                          backgroundColor: themeColor,
                          maxWidth: '100%',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Collected {formatCurrency(summary.totalPaid)} of {formatCurrency(summary.totalFeeRequired)} billable
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm shadow-md overflow-hidden" style={{ border: "1px solid var(--brand-18)" }}>
                <CardHeader className="pb-2 border-b border-slate-100">
                  <CardTitle className="text-base font-semibold" style={{ color: "var(--brand)" }}>
                    Students per grade
                  </CardTitle>
                  <p className="text-xs text-slate-600 mt-1">Headcount by grade (current filters)</p>
                </CardHeader>
                <CardContent className="h-[280px] pt-4">
                  {gradeHeadcountData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">No grade breakdown yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeHeadcountData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-28} textAnchor="end" height={72} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
                        <Tooltip
                          contentStyle={tooltipMoneyStyle}
                          formatter={(value: number | string, name: string) => [
                            typeof value === 'number' ? value : value,
                            name === 'students' ? 'Students' : name,
                          ]}
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.fullName ? String(payload[0].payload.fullName) : ''
                          }
                        />
                        <Bar dataKey="students" name="Students" fill={themeColor} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/90 backdrop-blur-sm shadow-md overflow-hidden" style={{ border: "1px solid var(--brand-18)" }}>
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-base font-semibold" style={{ color: "var(--brand)" }}>
                  Payments by grade level
                </CardTitle>
                <p className="text-xs text-slate-600 mt-1">
                  Collected first, then outstanding (stacked, KES) — hover a bar for student counts
                </p>
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                {gradePaymentChartData.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                    No grade-level fee data for this view
                  </div>
                ) : (
                  <div className="w-full min-h-[260px]" style={{ height: paymentsByGradeChartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={gradePaymentChartData}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal className="stroke-slate-200" />
                        <XAxis
                          type="number"
                          tickFormatter={(v) => currencyTick(Number(v))}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={tooltipMoneyStyle}
                          formatter={(
                            value: number | string,
                            name: string,
                            item: { dataKey?: string | number }
                          ) => {
                            const dk = String(item?.dataKey ?? '');
                            const label =
                              dk === 'collected' || name === 'Collected'
                                ? 'Collected'
                                : dk === 'outstanding' || name === 'Outstanding'
                                  ? 'Outstanding'
                                  : String(name);
                            return [formatCurrency(Number(value)), label];
                          }}
                          labelFormatter={(_, payload) => {
                            const row = payload?.[0]?.payload;
                            if (!row) return '';
                            return `${row.fullName} · ${row.students} students`;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="collected" name="Collected" stackId="fee" fill="#10b981" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="outstanding" name="Outstanding" stackId="fee" fill="#f97316" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }



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
                  <Badge variant="secondary" className="text-white border" style={{ backgroundColor: "var(--secondary)", borderColor: "var(--secondary-24)" }}>
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
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditStudent(student)}
                                style={{ borderColor: "var(--brand-24)", color: "var(--brand)" }}
                                title="Edit student"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setStudentToDelete(student)}
                                className="text-red-700 hover:bg-red-50"
                                style={{ borderColor: "var(--brand-24)" }}
                                title="Delete student"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
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
                    <h3 className="text-lg font-semibold" style={{ color: "var(--secondary)" }}>Fee Structure Actions</h3>
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



      case 'progression':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--brand)" }}>Learner Progression</h2>
              <p className="text-slate-600">
                Apply progression criteria and advance eligible learners to the next level.
              </p>
            </div>
            <PromotionsSection schoolCode={schoolCode} />
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
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                <Button
                  onClick={() => setShowAddStudent(true)}
                  className="text-white shadow-lg w-full sm:w-auto"
                  style={{ backgroundColor: themeColor }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
                <BulkImport
                  entityType="students"
                  schoolCode={schoolCode}
                  variant="outline"
                  size="default"
                  className="w-full sm:w-auto shadow-sm"
                  onSuccess={() => {
                    fetchGradeClassCatalog();
                    fetchStudents();
                    toast({
                      title: 'Import finished',
                      description: 'Review results in the import dialog if needed, then refresh the list.',
                    });
                  }}
                />
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
                        {selectedGrade && selectedGrade !== 'all'
                          ? (grades.find((g) => g.id === selectedGrade)?.classes || []).map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))
                          : grades.flatMap((g) =>
                              (g.classes || []).map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name}
                                </SelectItem>
                              ))
                            )}
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
                      style={{ backgroundColor: "var(--secondary)", borderColor: "var(--secondary-24)" }}
                    >
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold" style={{ color: "var(--brand)" }}>
                      Student Fee Management
                    </span>
                    <Badge variant="secondary" className="text-white border" style={{ backgroundColor: "var(--secondary)", borderColor: "var(--secondary-24)" }}>
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
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
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
                                title="Payment history"
                              >
                                <History className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditStudent(student)}
                                className="shadow-sm hover:bg-transparent"
                                style={{ borderColor: "var(--brand-24)", color: "var(--brand)" }}
                                title="Edit student"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setStudentToDelete(student)}
                                className="shadow-sm text-red-700 hover:bg-red-50"
                                style={{ borderColor: "var(--brand-24)" }}
                                title="Delete student"
                              >
                                <Trash2 className="w-3 h-3" />
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
          "--brand-12": `${workspaceTheme.primary}12`,
          "--brand-18": `${workspaceTheme.primary}18`,
          "--brand-24": `${workspaceTheme.primary}24`,
          "--secondary": workspaceTheme.secondary,
          "--secondary-24": `${workspaceTheme.secondary}24`,
          "--secondary-12": `${workspaceTheme.secondary}12`,
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
        showProgression={isFinanceMode}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? "lg:ml-28" : "lg:ml-[21rem]"}`}>
        {/* Enhanced Top Header - Sticky */}
        <div
          className="sticky-header mx-2 mt-2 rounded-3xl bg-gradient-to-r from-white/85 to-white/70 px-4 py-4 sm:px-6 sm:py-6 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-white/70"
          style={{ border: "1px solid var(--brand-18)" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: themeColor }}>
                {activeTab === 'dashboard' && 'Financial Dashboard'}
                {activeTab === 'students' && 'Student Fee Management'}
                {activeTab === 'outstanding' && 'Outstanding Fees'}
                {activeTab === 'fee-structure' && 'Fee Structure Management'}
                {activeTab === 'reports' && 'Financial Reports'}
                {activeTab === 'analytics' && 'Payment Analytics'}
                {activeTab === 'progression' && 'Learner Progression'}
              </h1>
              <p className="text-sm mt-2 font-medium" style={{ color: themeColor }}>
                {schoolInfo?.name || (isFinanceMode ? 'Independent Finance Module' : 'Financial Management System')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 md:hidden">
                <Badge
                  variant="secondary"
                  className="border text-white"
                  style={{ backgroundColor: "var(--brand)", borderColor: "var(--brand-24)" }}
                >
                  {fyLabel}
                </Badge>
                <Badge
                  variant="secondary"
                  className="border text-white"
                  style={{ backgroundColor: "var(--brand)", borderColor: "var(--brand-24)" }}
                >
                  {termLabel}
                </Badge>
                <div
                  className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
                  style={{ color: "var(--brand)", borderColor: "var(--brand-18)", backgroundColor: "var(--brand-12)" }}
                >
                  {now.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
            
            {/* Current Tab Indicator */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>
                  {fyLabel} • {termLabel}
                </p>
                <p className="text-xs" style={{ color: "var(--brand)" }}>
                  {now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" })} • {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
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
          <div
            className={`${portalGlassPanelLight} rounded-3xl p-3 sm:p-4 lg:p-6 min-h-[320px]`}
            style={{ border: "1px solid var(--brand-18)", boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)" }}
          >
            {renderTabContent()}
          </div>
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
                onUndoPaymentSettled={handlePaymentUndoSettled}
                bursarUndoWindowSeconds={60}
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
              <Label htmlFor="studentGrade">Grade</Label>
              <p className="text-xs text-muted-foreground">
                Choose the learner&apos;s grade (e.g. Grade 1). If that grade has more than one class/stream,
                add them from Academic Setup by class or merge streams — grade-only enrolment applies when there is exactly one class under the grade.
              </p>
              <Select
                value={newStudent.gradeId || undefined}
                onValueChange={(value) => setNewStudent((prev) => ({ ...prev, gradeId: value }))}
              >
                <SelectTrigger id="studentGrade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {onboardGradeOptions.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {onboardGradeOptions.length === 0 ? (
                <p className="text-xs text-amber-700">
                  No grades with classes loaded. Ensure grades and classes exist (Academic Setup), then click Refresh or reopen this form.
                </p>
              ) : null}
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

      <Dialog
        open={showEditStudent}
        onOpenChange={(open) => {
          setShowEditStudent(open);
          if (!open) setEditStudentRecord(null);
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStudent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editStudentName">Student full name</Label>
              <Input
                id="editStudentName"
                value={editForm.fullName}
                onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="editAdmissionNumber">Admission number</Label>
                <Input
                  id="editAdmissionNumber"
                  value={editForm.admissionNumber}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, admissionNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDateOfBirth">Date of birth</Label>
                <Input
                  id="editDateOfBirth"
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDateAdmitted">Date enrolled</Label>
                <Input
                  id="editDateAdmitted"
                  type="date"
                  value={editForm.dateAdmitted}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, dateAdmitted: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStudentGrade">Grade</Label>
              <p className="text-xs text-muted-foreground">
                To move to another grade, pick a grade with exactly one class (same rule as onboarding). Otherwise keep
                the current grade.
              </p>
              <Select
                value={editForm.gradeId || undefined}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, gradeId: value }))}
              >
                <SelectTrigger id="editStudentGrade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {onboardGradeOptions.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editParentName">Parent/guardian name</Label>
                <Input
                  id="editParentName"
                  value={editForm.parentName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, parentName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editParentPhone">Parent phone</Label>
                <Input
                  id="editParentPhone"
                  value={editForm.parentPhone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, parentPhone: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editParentEmail">Parent email</Label>
              <Input
                id="editParentEmail"
                type="email"
                value={editForm.parentEmail}
                onChange={(e) => setEditForm((prev) => ({ ...prev, parentEmail: e.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditStudent(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatingStudent}
                className="text-white"
                style={{ backgroundColor: themeColor }}
              >
                {updatingStudent ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!studentToDelete}
        onOpenChange={(open) => {
          if (!open && !deletingStudent) setStudentToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this student?</AlertDialogTitle>
            <AlertDialogDescription>
              {studentToDelete
                ? `This will permanently remove ${studentToDelete.name} (${studentToDelete.admissionNumber}), their portal login, fee assignments, and recorded payments for this school. This cannot be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingStudent}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingStudent}
              onClick={() => void handleConfirmDeleteStudent()}
            >
              {deletingStudent ? 'Deleting…' : 'Delete student'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
