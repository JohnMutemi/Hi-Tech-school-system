"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, CreditCard, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudentBalance {
  id: string;
  name: string;
  admissionNumber: string;
  email: string;
  gradeName: string;
  className: string;
  totalFeeRequired: number;
  totalPaid: number;
  balance: number;
  feeStructure?: {
    id: string;
    name: string;
    totalAmount: number;
    breakdown: Record<string, number>;
  };
  lastPayment?: {
    amount: number;
    paymentDate: string;
    referenceNumber: string;
  };
}

interface StudentFeeBalanceDisplayProps {
  studentId: string;
  schoolCode: string;
  colorTheme?: string;
  showActions?: boolean;
  academicYear?: string;
  term?: string;
  onPaymentClick?: () => void;
}

export function StudentFeeBalanceDisplay({
  studentId,
  schoolCode,
  colorTheme = "#3b82f6",
  showActions = true,
  academicYear,
  term,
  onPaymentClick
}: StudentFeeBalanceDisplayProps) {
  const [balance, setBalance] = useState<StudentBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (studentId) {
      fetchBalance();
    }
  }, [studentId, academicYear, term]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      
      // Use the existing student fees API
      const url = new URL(`/api/schools/${schoolCode}/students/${studentId}/fees`, window.location.origin);
      if (academicYear) url.searchParams.set('academicYear', academicYear);
      if (term) url.searchParams.set('term', term);
      
      const response = await fetch(url.toString());
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform the API response to match our interface
        if (data.termBalances && data.termBalances.length > 0) {
          const currentTerm = data.termBalances[0]; // Get the first/current term
          
          const transformedBalance: StudentBalance = {
            id: studentId,
            name: data.student?.user?.name || data.student?.name || 'Unknown Student',
            admissionNumber: data.student?.admissionNumber || '',
            email: data.student?.user?.email || data.student?.email || '',
            gradeName: data.student?.class?.grade?.name || 'Unknown Grade',
            className: data.student?.class?.name || 'Unknown Class',
            totalFeeRequired: currentTerm.totalAmount || 0,
            totalPaid: currentTerm.paidAmount || 0,
            balance: currentTerm.balance || 0,
            feeStructure: {
              id: currentTerm.id || '',
              name: `${currentTerm.term} ${currentTerm.year} Fees`,
              totalAmount: currentTerm.totalAmount || 0,
              breakdown: currentTerm.breakdown || {}
            },
            lastPayment: data.student?.payments && data.student.payments.length > 0 ? {
              amount: data.student.payments[0].amount,
              paymentDate: data.student.payments[0].paymentDate,
              referenceNumber: data.student.payments[0].referenceNumber
            } : undefined
          };
          
          setBalance(transformedBalance);
        } else {
          // No fee data available - student may be newly created
          setBalance(null);
        }
      } else {
        throw new Error('Failed to fetch student fee balance');
      }
    } catch (error) {
      console.error('Error fetching student balance:', error);
      toast({
        title: "Error",
        description: "Failed to load student fee balance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    setRefreshing(true);
    await fetchBalance();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getBalanceStatus = (balance: number) => {
    if (balance <= 0) return { status: 'paid', color: 'green', icon: CheckCircle };
    if (balance > 0) return { status: 'outstanding', color: 'red', icon: AlertCircle };
    return { status: 'unknown', color: 'gray', icon: DollarSign };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: colorTheme }}></div>
            <span className="text-sm text-gray-600">Loading fee balance...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card className="border-dashed border-2 border-amber-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <h3 className="font-medium text-amber-800">Fee Structure Not Available</h3>
          <p className="text-sm text-amber-600 mt-1">
            Fee balance will be calculated once fee structures are set up for this student's grade.
          </p>
          {showActions && (
            <Button
              size="sm"
              variant="outline"
              onClick={refreshBalance}
              disabled={refreshing}
              className="mt-3"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Check Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const balanceStatus = getBalanceStatus(balance.balance);
  const StatusIcon = balanceStatus.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" style={{ color: colorTheme }} />
              Fee Balance
            </CardTitle>
            <CardDescription>
              {balance.name} • {balance.admissionNumber} • {balance.className}
            </CardDescription>
          </div>
          {showActions && (
            <Button
              size="sm"
              variant="outline"
              onClick={refreshBalance}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Balance Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(balance.totalFeeRequired)}
            </div>
            <div className="text-xs text-gray-600">Total Required</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(balance.totalPaid)}
            </div>
            <div className="text-xs text-gray-600">Paid</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold text-${balanceStatus.color}-600 flex items-center justify-center gap-1`}>
              <StatusIcon className="h-5 w-5" />
              {formatCurrency(balance.balance)}
            </div>
            <div className="text-xs text-gray-600">
              {balance.balance > 0 ? 'Outstanding' : 'Overpaid'}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge 
            variant={balance.balance <= 0 ? "default" : "destructive"}
            className="text-sm"
          >
            {balance.balance <= 0 ? "Fees Paid" : `Outstanding: ${formatCurrency(balance.balance)}`}
          </Badge>
        </div>

        {/* Fee Breakdown */}
        {balance.feeStructure && Object.keys(balance.feeStructure.breakdown).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Fee Breakdown</h4>
            <div className="space-y-1">
              {Object.entries(balance.feeStructure.breakdown).map(([type, amount]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{type.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium">{formatCurrency(Number(amount))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Payment Info */}
        {balance.lastPayment && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">Last Payment</span>
            </div>
            <div className="text-xs text-green-700 mt-1">
              {formatCurrency(balance.lastPayment.amount)} on {new Date(balance.lastPayment.paymentDate).toLocaleDateString()}
              {balance.lastPayment.referenceNumber && (
                <span className="block">Ref: {balance.lastPayment.referenceNumber}</span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && balance.balance > 0 && onPaymentClick && (
          <div className="pt-2">
            <Button 
              onClick={onPaymentClick}
              className="w-full"
              style={{ backgroundColor: colorTheme }}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Make Payment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



