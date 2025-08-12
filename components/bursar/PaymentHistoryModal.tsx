'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Download, Receipt, Loader2, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BursarReceiptModal } from '@/components/bursar/BursarReceiptModal';

interface PaymentHistoryItem {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  term: string;
  academicYear: string;
  status: string;
  reference: string;
  description?: string;
  receivedBy?: string;
}

interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  email: string;
  phone: string;
  gradeName: string;
  className: string;
  parent: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
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
  const { toast } = useToast();
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  useEffect(() => {
    if (isOpen && student) {
      fetchPaymentHistory();
    }
  }, [isOpen, student]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schools/${schoolCode}/students/${student.id}/payment-history`);
      if (response.ok) {
        const data = await response.json();
        const payments = Array.isArray(data) ? data : (data?.payments || []);
        setPaymentHistory(payments);
      } else {
        throw new Error('Failed to fetch payment history');
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
    }
  };

  const convertPaymentToReceipt = async (payment: PaymentHistoryItem) => {
    // Fetch additional details if needed
    let schoolName = "";
    let parentName = "";
    let admissionNumber = "";
    let studentName = "";
    let termOutstandingBefore = 0;
    let termOutstandingAfter = 0;
    let academicYearOutstandingBefore = 0;
    let academicYearOutstandingAfter = 0;
    let carryForward = 0;
    
    try {
      // Get student details
      studentName = student.name;
      admissionNumber = student.admissionNumber;
      parentName = student.parent?.name || "Parent/Guardian";

      // Get school details
      const schoolResponse = await fetch(`/api/schools/${schoolCode}`);
      if (schoolResponse.ok) {
        const schoolData = await schoolResponse.json();
        schoolName = schoolData.name || "School";
      }

      // Try to get receipt details with balance information
      const receiptResponse = await fetch(`/api/schools/${schoolCode}/payments/${payment.id}/receipt`);
      if (receiptResponse.ok) {
        const receiptData = await receiptResponse.json();
        termOutstandingBefore = receiptData.termOutstandingBefore || 0;
        termOutstandingAfter = receiptData.termOutstandingAfter || 0;
        academicYearOutstandingBefore = receiptData.academicYearOutstandingBefore || 0;
        academicYearOutstandingAfter = receiptData.academicYearOutstandingAfter || 0;
        carryForward = receiptData.carryForwardAmount || 0;
      }
    } catch (error) {
      console.error("Error fetching additional details:", error);
    }

    return {
      receiptNumber: payment.receiptNumber,
      paymentId: payment.id,
      studentId: student.id,
      schoolCode: schoolCode,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      feeType: "School Fees",
      term: payment.term,
      academicYear: payment.academicYear,
      reference: payment.reference,
      phoneNumber: (payment as any).phoneNumber,
      transactionId: (payment as any).transactionId,
      status: payment.status,
      issuedAt: payment.paymentDate,
      issuedBy: payment.receivedBy || "Bursar",
      schoolName: schoolName,
      studentName: studentName,
      admissionNumber: admissionNumber,
      parentName: parentName,
      currency: "KES",
      termOutstandingBefore: termOutstandingBefore,
      termOutstandingAfter: termOutstandingAfter,
      academicYearOutstandingBefore: academicYearOutstandingBefore,
      academicYearOutstandingAfter: academicYearOutstandingAfter,
      carryForward: carryForward,
    };
  };

  const handleViewReceipt = async (payment: PaymentHistoryItem) => {
    try {
      const receiptData = await convertPaymentToReceipt(payment);
      setSelectedReceipt(receiptData);
      setShowReceipt(true);
    } catch (error) {
      console.error("Error preparing receipt:", error);
      toast({
        title: "Error",
        description: "Failed to prepare receipt for download",
        variant: "destructive",
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Payment History - {student.name}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-6">
            {/* Enhanced Student Info */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                    <p className="text-blue-600 font-mono">{student.admissionNumber}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Student Details</div>
                    <div className="font-semibold text-gray-900 mt-1">{student.name}</div>
                    <div className="text-sm text-gray-600 font-mono">{student.admissionNumber}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Academic Info</div>
                    <div className="font-semibold text-gray-900 mt-1">{student.gradeName}</div>
                    <div className="text-sm text-gray-600">{student.className}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Parent Contact</div>
                    <div className="font-semibold text-gray-900 mt-1">{student.parent?.name || 'Not Available'}</div>
                    <div className="text-sm text-gray-600 font-mono">{student.parent?.phone || 'No contact'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading payment history...</span>
              </div>
            ) : paymentHistory.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Receipt className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No payment history found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Payment Records</h3>
                  <Badge variant="secondary">
                    {paymentHistory.length} payments
                  </Badge>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Term/Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.receiptNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-semibold text-green-600">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(payment.amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.term}</div>
                            <div className="text-sm text-gray-500">{payment.academicYear}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReceipt(payment)}
                            className="flex items-center gap-2 min-w-[100px] bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <Download className="w-4 h-4" />
                            Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <BursarReceiptModal
        isOpen={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          setSelectedReceipt(null);
        }}
        receiptData={selectedReceipt}
      />
    </>
  );
}

