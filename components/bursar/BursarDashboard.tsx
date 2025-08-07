'use client';

import React, { useState, useEffect } from 'react';
import { Search, Users, DollarSign, FileText, Download, Eye, Plus, History, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { PaymentHistoryModal } from './PaymentHistoryModal';

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

interface BursarDashboardProps {
  schoolCode: string;
}

export function BursarDashboard({ schoolCode }: BursarDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    totalFeesRequired: 0,
    totalFeesCollected: 0,
    totalOutstanding: 0,
    studentsWithOutstanding: 0,
  });
  const { toast } = useToast();

  const fetchStudents = async (gradeId?: string, showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const currentYear = new Date().getFullYear().toString();
      const url = gradeId 
        ? `/api/schools/${schoolCode}/bursar/students?academicYear=${currentYear}&term=FIRST&gradeId=${gradeId}`
        : `/api/schools/${schoolCode}/bursar/students?academicYear=${currentYear}&term=FIRST`;
      
      const response = await fetch(url, {
        // Add cache busting for real-time data
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data.data.students);
      setFilteredStudents(data.data.students);
      setSummary(data.data.summary);
      
      if (showRefreshIndicator) {
        toast({
          title: 'Success',
          description: 'Student data refreshed successfully',
        });
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
      setRefreshing(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/bursar/grades`);
      if (response.ok) {
        const data = await response.json();
        setGrades(data.data);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchGrades();
  }, [schoolCode]);

  useEffect(() => {
    let filtered = students;

    // Filter by search term only (grade filtering is done via API)
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm]);

  const handlePaymentSuccess = (updatedStudent: Student) => {
    setStudents(prev => 
      prev.map(s => s.id === updatedStudent.id ? updatedStudent : s)
    );
    setShowPaymentModal(false);
    setSelectedStudent(null);
    
    // Refresh all data to get real-time balances
    fetchStudents(selectedClass === 'all' ? undefined : selectedClass, true);
    
    toast({
      title: 'Payment Successful',
      description: 'Payment has been recorded successfully',
    });
  };

  const openPaymentHistory = (student: Student) => {
    setSelectedStudentForHistory(student);
    setShowPaymentHistory(true);
  };

  const openPaymentModal = (student: Student) => {
    setSelectedStudent(student);
    setShowPaymentModal(true);
  };

  const openReceiptModal = (receiptId: string) => {
    setSelectedReceipt(receiptId);
    setShowReceiptModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const getBalanceStatus = (balance: number) => {
    if (balance === 0) return { text: 'Paid', variant: 'default' as const };
    if (balance > 0) return { text: 'Outstanding', variant: 'destructive' as const };
    return { text: 'Overpaid', variant: 'secondary' as const };
  };

  const handleGradeFilter = (gradeId: string) => {
    setSelectedClass(gradeId);
    if (gradeId === 'all') {
      fetchStudents();
    } else {
      fetchStudents(gradeId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Bursar Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => fetchStudents(selectedClass === 'all' ? undefined : selectedClass, true)} 
            disabled={loading || refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Required</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalFeesRequired)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalFeesCollected)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalOutstanding)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Outstanding</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.studentsWithOutstanding}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by student name, admission number, or parent name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="grade">Grade Level</Label>
              <Select value={selectedClass} onValueChange={handleGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map(grade => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name} ({grade.totalStudents} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students Fee Management ({filteredStudents.length} students)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const balanceStatus = getBalanceStatus(student.balance);
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{student.admissionNumber}</TableCell>
                    <TableCell>{student.className} ({student.gradeName})</TableCell>
                    <TableCell>
                      {student.parent ? (
                        <div>
                          <div className="font-medium">{student.parent.name}</div>
                          <div className="text-sm text-gray-500">{student.parent.phone}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No parent</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{formatCurrency(student.totalFeeRequired)}</TableCell>
                    <TableCell className="font-mono text-green-600">{formatCurrency(student.totalPaid)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(Math.abs(student.balance))}</TableCell>
                    <TableCell>
                      <Badge variant={balanceStatus.variant}>{balanceStatus.text}</Badge>
                    </TableCell>
                    <TableCell>
                      {student.lastPayment ? (
                        <div className="text-sm">
                          <div>{formatCurrency(student.lastPayment.amount)}</div>
                          <div className="text-gray-500">
                            {new Date(student.lastPayment.paymentDate).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No payments</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openPaymentModal(student)}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Pay
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPaymentHistory(student)}
                          className="flex items-center gap-1"
                        >
                          <History className="h-3 w-3" />
                          History
                        </Button>
                        {student.lastPayment && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Assuming the receipt ID is available - you might need to fetch this
                              // For now, using payment ID as a placeholder
                              openReceiptModal(student.lastPayment!.id);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Receipt
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No students found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          schoolCode={schoolCode}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceipt(null);
          }}
          receiptId={selectedReceipt}
          schoolCode={schoolCode}
        />
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && selectedStudentForHistory && (
        <PaymentHistoryModal
          isOpen={showPaymentHistory}
          onClose={() => {
            setShowPaymentHistory(false);
            setSelectedStudentForHistory(null);
          }}
          student={selectedStudentForHistory}
          schoolCode={schoolCode}
        />
      )}
    </div>
  );
}
