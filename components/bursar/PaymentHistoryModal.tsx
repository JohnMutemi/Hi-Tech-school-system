'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw, X } from 'lucide-react';

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

interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  receivedBy: string;
  receiptNumber: string;
  referenceNumber?: string;
  description: string;
  academicYear?: string;
  term?: string;
  receipt?: any;
}

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  schoolCode: string;
}

export function PaymentHistoryModal({
  isOpen,
  onClose,
  student,
  schoolCode,
}: PaymentHistoryModalProps) {
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [currentBalance, setCurrentBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchPaymentHistory = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const currentYear = new Date().getFullYear().toString();
      const response = await fetch(
        `/api/schools/${schoolCode}/bursar/payments/history?studentId=${student.id}&academicYear=${currentYear}&term=FIRST`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      setPaymentHistory(data.data.paymentHistory);
      setCurrentBalance(data.data.currentBalance);

      if (showRefreshIndicator) {
        toast({
          title: 'Success',
          description: 'Payment history refreshed successfully',
        });
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payment history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen && student) {
      fetchPaymentHistory();
    }
  }, [isOpen, student.id, schoolCode]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadHistory = () => {
    const csvContent = [
      ['Date', 'Amount', 'Method', 'Receipt No.', 'Reference', 'Description', 'Received By'],
      ...paymentHistory.map(payment => [
        formatDate(payment.paymentDate),
        payment.amount.toString(),
        payment.paymentMethod,
        payment.receiptNumber,
        payment.referenceNumber || '',
        payment.description,
        payment.receivedBy,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${student.admissionNumber}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payment History - {student.name}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchPaymentHistory(true)}
                disabled={loading || refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadHistory}
                disabled={loading || paymentHistory.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Student Name</span>
                  <p className="font-medium">{student.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Admission No.</span>
                  <p className="font-mono">{student.admissionNumber}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Class</span>
                  <p>{student.className} ({student.gradeName})</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Total Payments</span>
                  <p className="font-medium">{paymentHistory.length} payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Balance */}
          {currentBalance && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Balance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Total Required</span>
                    <p className="text-lg font-bold">{formatCurrency(currentBalance.totalRequired)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Total Paid</span>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(currentBalance.totalPaid)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Outstanding Balance</span>
                    <p className={`text-lg font-bold ${currentBalance.balance > 0 ? 'text-red-600' : currentBalance.balance < 0 ? 'text-blue-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(currentBalance.balance))}
                    </p>
                    <Badge variant={currentBalance.balance === 0 ? 'default' : currentBalance.balance > 0 ? 'destructive' : 'secondary'}>
                      {currentBalance.balance === 0 ? 'Paid' : currentBalance.balance > 0 ? 'Outstanding' : 'Overpaid'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading payment history...</p>
                  </div>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No payments recorded for this student.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Receipt No.</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Received By</TableHead>
                        <TableHead>Term/Year</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(payment.paymentDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-medium text-green-600">
                              {formatCurrency(payment.amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.paymentMethod.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{payment.receiptNumber}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{payment.referenceNumber || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={payment.description}>
                              {payment.description}
                            </div>
                          </TableCell>
                          <TableCell>{payment.receivedBy}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {payment.term} {payment.academicYear}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
