'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  schoolCode: string;
  onPaymentSuccess: (updatedStudent: Student) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  student,
  schoolCode,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [description, setDescription] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [term, setTerm] = useState('FIRST');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive',
      });
      return;
    }

    if (!receivedBy.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter the name of who received the payment',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/schools/${schoolCode}/bursar/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          amount: parseFloat(amount),
          paymentMethod,
          description: description.trim() || `Cash payment for ${term} ${academicYear}`,
          referenceNumber: referenceNumber.trim() || undefined,
          receivedBy: receivedBy.trim(),
          term,
          academicYear,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment failed');
      }

      const result = await response.json();
      
      toast({
        title: 'Payment Successful',
        description: `Payment of ${formatCurrency(parseFloat(amount))} recorded successfully`,
      });

      // Create updated student object
      const updatedStudent: Student = {
        ...student,
        totalPaid: student.totalPaid + parseFloat(amount),
        balance: student.balance - parseFloat(amount),
        lastPayment: {
          id: result.data.payment.id,
          amount: parseFloat(amount),
          paymentDate: result.data.payment.paymentDate,
          paymentMethod: result.data.payment.paymentMethod,
        },
        paymentHistory: [
          {
            id: result.data.payment.id,
            amount: parseFloat(amount),
            paymentDate: result.data.payment.paymentDate,
            paymentMethod: result.data.payment.paymentMethod,
          },
          ...(student.paymentHistory || []),
        ],
      };

      onPaymentSuccess(updatedStudent);
      
      // Reset form
      setAmount('');
      setDescription('');
      setReferenceNumber('');
      setReceivedBy('');
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'An error occurred while processing the payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNewBalance = () => {
    const paymentAmount = parseFloat(amount) || 0;
    return student.balance - paymentAmount;
  };

  const getBalanceStatus = (balance: number) => {
    if (balance === 0) return { text: 'Fully Paid', variant: 'default' as const, color: 'text-green-600' };
    if (balance > 0) return { text: 'Outstanding', variant: 'destructive' as const, color: 'text-red-600' };
    return { text: 'Overpaid', variant: 'secondary' as const, color: 'text-blue-600' };
  };

  const newBalance = calculateNewBalance();
  const balanceStatus = getBalanceStatus(newBalance);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Cash Payment</DialogTitle>
        </DialogHeader>

        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Student Information</CardTitle>
          </CardHeader>
          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Student Name</Label>
                    <p className="font-medium">{student.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Admission Number</Label>
                    <p className="font-mono">{student.admissionNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Class</Label>
                    <p>{student.className} ({student.gradeName})</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Parent</Label>
                    <p>{student.parent ? student.parent.name : 'Not assigned'}</p>
                  </div>
                </div>
          </CardContent>
        </Card>

        {/* Fee Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Required</Label>
                <p className="text-lg font-bold">{formatCurrency(student.totalFeeRequired)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Paid</Label>
                <p className="text-lg font-bold text-green-600">{formatCurrency(student.totalPaid)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Current Balance</Label>
                <p className="text-lg font-bold text-red-600">{formatCurrency(Math.abs(student.balance))}</p>
                <Badge variant={getBalanceStatus(student.balance).variant} className="mt-1">
                  {getBalanceStatus(student.balance).text}
                </Badge>
              </div>
            </div>

            {student.feeStructure && (
              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-500">Fee Structure: {student.feeStructure.name}</Label>
                <div className="mt-2 space-y-1">
                  {student.feeStructure.breakdown && typeof student.feeStructure.breakdown === 'object' && (
                    Object.entries(student.feeStructure.breakdown).map(([key, value], index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                        <span className="font-mono">{formatCurrency(Number(value))}</span>
                      </div>
                    ))
                  )}
                  {(!student.feeStructure.breakdown || typeof student.feeStructure.breakdown !== 'object') && (
                    <div className="flex justify-between text-sm">
                      <span>Total Fees</span>
                      <span className="font-mono">{formatCurrency(student.feeStructure.totalAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="term">Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRST">First Term</SelectItem>
                  <SelectItem value="SECOND">Second Term</SelectItem>
                  <SelectItem value="THIRD">Third Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Payment Amount (KES) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="receivedBy">Received By (Bursar Name) *</Label>
            <Input
              id="receivedBy"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
            <Input
              id="referenceNumber"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter reference number if applicable"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional payment details"
              rows={3}
            />
          </div>

          {/* Payment Preview */}
          {amount && parseFloat(amount) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Payment Amount</Label>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(parseFloat(amount))}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">New Balance</Label>
                    <p className={`text-lg font-bold ${balanceStatus.color}`}>
                      {formatCurrency(Math.abs(newBalance))}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status After Payment</Label>
                    <Badge variant={balanceStatus.variant} className="mt-1">
                      {balanceStatus.text}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount || parseFloat(amount) <= 0 || !receivedBy.trim()}>
              {loading ? 'Processing...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
