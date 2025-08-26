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
  ChevronDown
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
}

export function BursarDashboard({ schoolCode }: BursarDashboardProps) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [term, setTerm] = useState('Term 1');
  
  // Payment Hub state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showPaymentHub, setShowPaymentHub] = useState(false);
  
  // Payment History Modal state
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  
  // Navigation state
  const [activeTab, setActiveTab] = useState('students');
  
  // School and bursar info
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [bursarInfo, setBursarInfo] = useState<any>(null);
  
  const [summary, setSummary] = useState({
    totalStudents: 0,
    totalOutstanding: 0,
    studentsWithBalance: 0,
    fullyPaid: 0,
  });

  useEffect(() => {
    fetchGrades();
    fetchStudents();
    fetchSchoolInfo();
    fetchBursarInfo();
  }, [schoolCode, selectedGrade, selectedClass, academicYear, term]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, selectedGrade, selectedClass]);

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
      const response = await fetch(`/api/schools/${schoolCode}/bursar/session`);
      if (response.ok) {
        const data = await response.json();
        setBursarInfo(data.bursar);
      }
    } catch (error) {
      console.error('Error fetching bursar info:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/bursar/logout`, {
        method: 'POST',
      });
      
      if (response.ok) {
        window.location.href = `/schools/${schoolCode}/bursar/login`;
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
        term,
      });
      
      if (selectedGrade && selectedGrade !== 'all') params.append('gradeId', selectedGrade);
      if (selectedClass && selectedClass !== 'all') params.append('classId', selectedClass);

      const response = await fetch(`/api/schools/${schoolCode}/students/balances?${params}`);
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
      a.download = `bursar-fee-report-${schoolCode}-${academicYear}-${term}.csv`;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mx-auto opacity-20 animate-pulse"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Bursar Dashboard</h2>
          <p className="text-gray-600">Preparing financial management interface...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-blue-700">Total Students</CardTitle>
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900 mb-1">{summary.totalStudents}</div>
                  <p className="text-xs text-blue-600 font-medium">Enrolled students</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-red-700">Total Outstanding</CardTitle>
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-sm">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-900 mb-1">
                    {formatCurrency(summary.totalOutstanding)}
                  </div>
                  <p className="text-xs text-red-600 font-medium">Pending payments</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-amber-700">With Balance</CardTitle>
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-900 mb-1">{summary.studentsWithBalance}</div>
                  <p className="text-xs text-amber-600 font-medium">Require payment</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-emerald-700">Fully Paid</CardTitle>
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-white" />
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

      case 'payments':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Payment Processing</h2>
                <p className="text-gray-600">Record and process student fee payments</p>
              </div>
            </div>
            <Card className="bg-white shadow-sm border-gray-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Payments</h3>
                <p className="text-gray-600 mb-4">Go to Student Management to record payments for individual students</p>
                <Button onClick={() => setActiveTab('students')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Go to Student Management
                </Button>
              </CardContent>
            </Card>
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
            <Card className="bg-white shadow-sm border-gray-200 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-red-50">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-800">Students with Outstanding Balances</span>
                  <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                    {filteredStudents.filter(s => s.balance > 0).length} students
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-50 border-b border-red-200">
                        <TableHead className="font-semibold text-red-700 py-4">Student</TableHead>
                        <TableHead className="font-semibold text-red-700">Grade & Class</TableHead>
                        <TableHead className="font-semibold text-red-700 text-right">Outstanding Amount</TableHead>
                        <TableHead className="font-semibold text-red-700 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.filter(student => student.balance > 0).map((student) => (
                        <TableRow key={student.id} className="hover:bg-red-50 transition-colors duration-200 border-b border-gray-100">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
                              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              Pay Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredStudents.filter(s => s.balance > 0).length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">All Fees Paid!</h3>
                      <p className="text-gray-600">No students have outstanding balances.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'receipts':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Receipts & Records</h2>
                <p className="text-gray-600">View and manage payment receipts</p>
              </div>
            </div>
            <Card className="bg-white shadow-sm border-gray-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Receipts</h3>
                <p className="text-gray-600 mb-4">View receipts in student payment history from Student Management section</p>
                <Button onClick={() => setActiveTab('students')} variant="outline">
                  Go to Student Management
                </Button>
              </CardContent>
            </Card>
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
              <Button onClick={exportToExcel} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Download className="w-4 h-4 mr-2" />
                Export Current Data
              </Button>
            </div>
            

            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={exportToExcel}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-blue-700">
                    <Download className="w-5 h-5" />
                    Student Fee Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-600 text-sm">Complete student fee summary with balances and payment history</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-green-700">
                    <TrendingUp className="w-5 h-5" />
                    Collection Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-600 text-sm">Total collections and outstanding amounts by period</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-purple-700">
                    <BarChart3 className="w-5 h-5" />
                    Grade-wise Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-600 text-sm">Fee collection analysis by grade and class</p>
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
              <Card className="bg-white shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Collection Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {summary.totalStudents > 0 ? Math.round((summary.fullyPaid / summary.totalStudents) * 100) : 0}%
                  </div>
                  <p className="text-gray-600 text-sm">Students with complete fee payment</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Average Outstanding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">
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
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Student Fee Management</h2>
                <p className="text-gray-600">Manage student fee payments and balances</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={exportToExcel} 
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button 
                  onClick={fetchStudents}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Enhanced Filters Section */}
            <Card className="bg-white shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
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
                      className="mt-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="grade" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Grade
                    </Label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger className="mt-1 border-gray-300 focus:border-indigo-500">
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
                      <SelectTrigger className="mt-1 border-gray-300 focus:border-indigo-500">
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
                      <SelectTrigger className="mt-1 border-gray-300 focus:border-indigo-500">
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
                        <SelectTrigger className="mt-1 border-gray-300 focus:border-indigo-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                        }}
                        variant="outline"
                        className="w-full border-gray-300 hover:bg-gray-50"
                      >
                        Clear Filters
                      </Button>
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg w-full">
                        Showing <span className="font-semibold text-gray-900">{filteredStudents.length}</span> of {students.length} students
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Students Table */}
            <Card className="bg-white shadow-sm border-gray-200 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800">Student Fee Management</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                      {filteredStudents.length} students
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b border-gray-200">
                        <TableHead className="font-semibold text-gray-700 py-4">Student Information</TableHead>
                        <TableHead className="font-semibold text-gray-700">Grade & Class</TableHead>
                        <TableHead className="font-semibold text-gray-700">Parent Contact</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">Fee Required</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">Amount Paid</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">Outstanding</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id} className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <CreditCard className="w-3 h-3 mr-1" />
                                Record Payment
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setHistoryStudent(student);
                                  setShowPaymentHistory(true);
                                }}
                                className="border-gray-300 hover:bg-gray-50 shadow-sm"
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
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar Navigation */}
      <BursarSidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        bursar={bursarInfo}
        schoolName={schoolInfo?.name}
        schoolCode={schoolCode}
        summary={summary}
      />

      {/* Main Content */}
      <div className="lg:ml-80">
        {/* Top Header with Profile Dropdown */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'students' && 'Student Management'}
                {activeTab === 'payments' && 'Payment Processing'}
                {activeTab === 'outstanding' && 'Outstanding Fees'}
                {activeTab === 'receipts' && 'Receipts & Records'}
                {activeTab === 'reports' && 'Financial Reports'}
                {activeTab === 'analytics' && 'Payment Analytics'}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {schoolInfo?.name || 'Financial Management System'}
              </p>
            </div>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-gray-200">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="Bursar" />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold">
                      {bursarInfo?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'B'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {bursarInfo?.name || 'Bursar'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {bursarInfo?.email || 'Financial Officer'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-6 pb-20 lg:pb-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Payment Hub Dialog */}
      <Dialog open={showPaymentHub} onOpenChange={setShowPaymentHub}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
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
    </div>
  );
}
