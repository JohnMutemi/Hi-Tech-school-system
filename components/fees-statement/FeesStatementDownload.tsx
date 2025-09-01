'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Calendar, User, School, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FeesStatementDownloadProps {
  schoolCode: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  gradeName: string;
  className: string;
  parentName?: string;
  isBursar?: boolean;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface FeeStatementData {
  student: {
    name: string;
    admissionNumber: string;
    gradeName: string;
    className: string;
    parentName?: string;
  };
  academicYear: string;
  statement: Array<{
    no: number;
    ref: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    type?: string;
    termBalance?: number;
    academicYearBalance?: number;
  }>;
  summary: {
    totalDebit: number;
    totalCredit: number;
    finalBalance: number;
    totalPayments: number;
    totalCharges: number;
  };
}

export function FeesStatementDownload({
  schoolCode,
  studentId,
  studentName,
  admissionNumber,
  gradeName,
  className,
  parentName,
  isBursar = false
}: FeesStatementDownloadProps) {
  const { toast } = useToast();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingYears, setLoadingYears] = useState(true);
  const [statementData, setStatementData] = useState<FeeStatementData | null>(null);

  useEffect(() => {
    fetchAcademicYears();
  }, [schoolCode]);

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchFeeStatement();
    }
  }, [selectedAcademicYear, studentId]);

  const fetchAcademicYears = async () => {
    try {
      setLoadingYears(true);
      const response = await fetch(`/api/schools/${schoolCode}/academic-years`);
      if (response.ok) {
        const data = await response.json();
        setAcademicYears(data);
        // Set current academic year as default
        const currentYear = data.find((year: AcademicYear) => year.isCurrent);
        if (currentYear) {
          setSelectedAcademicYear(currentYear.id);
        } else if (data.length > 0) {
          setSelectedAcademicYear(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch academic years',
        variant: 'destructive',
      });
    } finally {
      setLoadingYears(false);
    }
  };

  const fetchFeeStatement = async () => {
    if (!selectedAcademicYear) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/schools/${schoolCode}/students/${studentId}/fee-statement?academicYearId=${selectedAcademicYear}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setStatementData(data);
      } else {
        throw new Error('Failed to fetch fee statement');
      }
    } catch (error) {
      console.error('Error fetching fee statement:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch fee statement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (format: 'A3' | 'A4' | 'A5' = 'A4') => {
    if (!selectedAcademicYear) return;

    try {
      setLoading(true);
      
      // Use the direct download endpoint with format parameter
      const response = await fetch(
        `/api/schools/${schoolCode}/students/${studentId}/fee-statement/download?academicYearId=${selectedAcademicYear}&size=${format}`
      );
      
      if (response.ok) {
        // Get the PDF blob from the response
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Extract filename from response headers or create default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `Fee_Statement_${studentName.replace(/\s+/g, '_')}_${format}.pdf`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: `Fee statement (${format}) downloaded successfully`,
      });
      } else {
        throw new Error('Failed to download fee statement');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to download fee statement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTXT = () => {
    if (!statementData) return;

    try {
      setLoading(true);

      // Create text version of fee statement
      const textContent = `
${schoolCode.toUpperCase()} SCHOOL
FEE STATEMENT
===============================================

Student Name: ${studentName}
Admission Number: ${admissionNumber}
Grade: ${gradeName}
Class: ${className}
${parentName ? `Parent/Guardian: ${parentName}` : ''}
Academic Year: ${academicYears.find(y => y.id === selectedAcademicYear)?.name || 'Academic Year'}
Generated: ${new Date().toLocaleDateString()}

FINANCIAL SUMMARY
===============================================
Total Charges: ${formatCurrency(statementData.summary?.totalDebit || 0)}
Total Payments: ${formatCurrency(statementData.summary?.totalCredit || 0)}
Outstanding Balance: ${formatCurrency(statementData.summary?.finalBalance || 0)}

TRANSACTION DETAILS
===============================================
${statementData.statement?.map((item, index) => {
  if (item.type === 'term-header') {
    return `\n--- ${item.description} ---`;
  } else if (item.type === 'term-closing') {
    return `TERM BALANCE: ${item.description}`;
  } else if (item.type === 'carry-forward') {
    return `→ ${item.description}`;
  } else {
    return `${item.no || index + 1}. ${item.date ? new Date(item.date).toLocaleDateString() : ''} | ${item.description} | Debit: ${item.debit ? formatCurrency(Number(item.debit)) : '-'} | Credit: ${item.credit ? formatCurrency(Number(item.credit)) : '-'} | Balance: ${item.academicYearBalance ? formatCurrency(Number(item.academicYearBalance)) : '-'}`;
  }
}).join('\n')}

===============================================
This is a computer-generated statement.
      `.trim();

      // Create and download file
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fee-statement-${studentName.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Fee statement (TXT) downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading TXT:', error);
      toast({
        title: 'Error',
        description: 'Failed to download text file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getBalanceStatus = (balance: number) => {
    if (balance <= 0) {
      return { status: 'Fully Paid', color: 'bg-green-100 text-green-800 border-green-200' };
    } else if (balance < 10000) {
      return { status: 'Low Balance', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    } else {
      return { status: 'Outstanding', color: 'bg-red-100 text-red-800 border-red-200' };
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-0 shadow-2xl bg-gradient-to-br from-white via-green-50 to-emerald-50">
      <CardHeader className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-white/20 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold">📊 Fee Statement Portal</span>
            <div className="text-sm font-normal opacity-90 mt-1">Professional Academic Financial Report</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Student Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-xl border-l-4 border-green-500 shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <span className="font-bold text-green-900 text-lg">{studentName}</span>
                <div className="text-sm text-green-600 font-mono">{admissionNumber}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <School className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <span className="font-medium text-green-800">{gradeName}</span>
                <span className="text-green-600 mx-2">•</span>
                <span className="text-green-700">{className}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {parentName && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <User className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <div className="text-sm text-emerald-600 font-medium">Parent/Guardian</div>
                  <span className="font-medium text-emerald-800">{parentName}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calendar className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="text-sm text-emerald-600 font-medium">Academic Year</div>
                <span className="font-medium text-emerald-800">
                  {academicYears.find(y => y.id === selectedAcademicYear)?.name || 'Select Academic Year'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Year Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-green-800 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Select Academic Year
          </label>
          <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear} disabled={loadingYears}>
            <SelectTrigger className="w-full border-2 border-green-200 focus:border-green-500 bg-white hover:bg-green-50 transition-colors">
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent className="border-green-200">
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id} className="hover:bg-green-50 focus:bg-green-100">
                  <div className="flex items-center gap-2">
                    <span>{year.name}</span>
                    {year.isCurrent && (
                      <Badge className="text-xs bg-green-500 text-white">Current</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statement Summary */}
        {statementData && statementData.summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 min-h-[120px] flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-emerald-500 text-white rounded-lg">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-emerald-800">Total Charges</span>
                      <div className="text-xs text-emerald-600">School Fees Invoiced</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-emerald-900">
                    {formatCurrency(statementData.summary?.totalDebit || 0)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 min-h-[120px] flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-500 text-white rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-green-800">Total Payments</span>
                      <div className="text-xs text-green-600">Amount Received</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-green-900">
                    {formatCurrency(statementData.summary?.totalCredit || 0)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 min-h-[120px] flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-500 text-white rounded-lg">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-amber-800">Outstanding Balance</span>
                      <div className="text-xs text-amber-600">Amount Due</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-amber-900 mb-2">
                    {formatCurrency(statementData.summary?.finalBalance || 0)}
                  </div>
                  <Badge className={`text-xs font-bold px-3 py-1 ${getBalanceStatus(statementData.summary?.finalBalance || 0).color}`}>
                    {getBalanceStatus(statementData.summary?.finalBalance || 0).status}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Statement Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statement Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-green-500 to-green-600 border-b-2 border-green-300">
                        <th className="py-3 sm:py-4 px-1 sm:px-2 text-left font-bold text-white min-w-[30px]">No.</th>
                        <th className="py-3 sm:py-4 px-1 sm:px-2 text-left font-bold text-white min-w-[50px] hidden sm:table-cell">Ref</th>
                        <th className="py-3 sm:py-4 px-1 sm:px-2 text-left font-bold text-white min-w-[60px]">Date</th>
                        <th className="py-3 sm:py-4 px-1 sm:px-2 text-left font-bold text-white min-w-[100px]">Description</th>
                        <th className="py-3 sm:py-4 px-1 sm:px-2 text-right font-bold text-white min-w-[60px]">Debit</th>
                        <th className="py-3 sm:py-4 px-1 sm:px-2 text-right font-bold text-white min-w-[60px]">Credit</th>
                        <th className="py-3 sm:py-4 px-1 sm:px-2 text-right font-bold text-white min-w-[60px] hidden lg:table-cell">T.Bal.</th>
                        <th className="py-3 sm:py-4 px-1 sm:px-2 text-right font-bold text-white min-w-[60px]">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementData.statement && statementData.statement.length > 0 ? (
                        <>
                          {statementData.statement.slice(0, 5).map((item, index) => {
                            // Handle special row types with different styling
                            if (item.type === 'term-header') {
                              return (
                                <tr key={index} className="bg-gradient-to-r from-green-500 to-green-600 border-b border-green-300 text-white shadow-md">
                                  <td colSpan={8} className="py-4 px-2 text-center font-bold text-lg">
                                    🏫 {item.description}
                                  </td>
                                </tr>
                              );
                            } else if (item.type === 'term-closing') {
                              const termBalance = Number(item.termBalance) || 0;
                              const isOverpaid = termBalance < 0;
                              const isPaid = termBalance === 0;
                              
                              let balanceColor, statusIcon, statusText, statusBadgeColor;
                              if (isOverpaid) {
                                balanceColor = 'text-green-800 bg-green-100 border-green-300';
                                statusIcon = '💚';
                                statusText = 'OVERPAID';
                                statusBadgeColor = 'bg-green-500 text-white';
                              } else if (isPaid) {
                                balanceColor = 'text-green-800 bg-green-50 border-green-300';
                                statusIcon = '✅';
                                statusText = 'PAID';
                                statusBadgeColor = 'bg-green-600 text-white';
                              } else {
                                balanceColor = 'text-yellow-800 bg-yellow-100 border-yellow-300';
                                statusIcon = '⚠️';
                                statusText = 'OUTSTANDING';
                                statusBadgeColor = 'bg-yellow-500 text-white';
                              }
                              
                              return (
                                <tr key={index} className={`${balanceColor} border-b-2 border-l-6 border-l-green-500 font-bold shadow-sm`}>
                                  <td className="py-3 px-2 text-center font-bold text-xl">{statusIcon}</td>
                                  <td className="py-3 px-2 hidden sm:table-cell"></td>
                                  <td className="py-3 px-2"></td>
                                  <td className="py-3 px-2 font-bold text-base flex items-center gap-2">
                                    {item.description}
                                    <Badge className={`text-xs font-bold px-2 py-1 ${statusBadgeColor}`}>
                                      {statusText}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-2 text-right font-bold">
                                    {item.debit ? formatCurrency(Number(item.debit)) : '-'}
                                  </td>
                                  <td className="py-3 px-2 text-right font-bold">
                                    {item.credit ? formatCurrency(Number(item.credit)) : '-'}
                                  </td>
                                  <td className="py-3 px-2 text-right font-bold text-lg hidden lg:table-cell">
                                    {formatCurrency(Math.abs(termBalance))}
                                  </td>
                                  <td className="py-3 px-2 text-right font-bold text-lg">
                                    {formatCurrency(Number(item.academicYearBalance) || 0)}
                                  </td>
                                </tr>
                              );
                            } else if (item.type === 'brought-forward') {
                              const isOverpayment = (item as any).isOverpayment;
                              const bgColor = isOverpayment ? 'bg-green-100 border-green-200' : 'bg-yellow-100 border-yellow-200';
                              const textColor = isOverpayment ? 'text-green-800' : 'text-yellow-800';
                              const icon = isOverpayment ? '💚' : '📋';
                              
                              return (
                                <tr key={index} className={`${bgColor} border-b border-l-6 border-l-green-500 font-bold shadow-sm`}>
                                  <td className="py-3 px-2 text-center font-bold text-lg">{icon}</td>
                                  <td className="py-3 px-2 font-mono text-xs font-bold hidden sm:table-cell">{item.ref || '-'}</td>
                                  <td className="py-3 px-2 font-bold">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                                  <td className="py-3 px-2 font-bold">{item.description || '-'}</td>
                                  <td className="py-3 px-2 text-right font-bold">{item.debit ? formatCurrency(Number(item.debit)) : '-'}</td>
                                  <td className="py-3 px-2 text-right font-bold">{item.credit ? formatCurrency(Number(item.credit)) : '-'}</td>
                                  <td className="py-3 px-2 text-right font-bold hidden lg:table-cell">
                                    {item.termBalance ? formatCurrency(Number(item.termBalance)) : '-'}
                                  </td>
                                  <td className="py-3 px-2 text-right font-bold">
                                    {item.academicYearBalance ? formatCurrency(Number(item.academicYearBalance)) : '-'}
                                  </td>
                                </tr>
                              );
                            } else if (item.type === 'carry-forward') {
                              const carryForwardAmount = Number(item.termBalance) || 0;
                              const isOverpayment = carryForwardAmount < 0;
                              const bgColor = isOverpayment ? 'bg-green-100 border-green-200' : 'bg-yellow-100 border-yellow-200';
                              const borderColor = 'border-l-green-500';
                              const statusText = isOverpayment ? 'CREDIT' : 'OUTSTANDING';
                              const icon = isOverpayment ? '🔄💚' : '🔄⚠️';
                              const statusBadgeColor = isOverpayment ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white';
                              
                              return (
                                <tr key={index} className={`${bgColor} border-b-2 border-l-6 ${borderColor} font-bold shadow-sm`}>
                                  <td className="py-3 px-2 text-center font-bold text-green-600 text-base">{icon}</td>
                                  <td className="py-3 px-2 font-mono text-xs font-bold text-green-600 hidden sm:table-cell">{item.ref || '-'}</td>
                                  <td className="py-3 px-2 font-bold text-green-600">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                                  <td className="py-3 px-2 font-bold text-green-600 flex items-center gap-2">
                                    {item.description || '-'}
                                    <Badge className={`text-xs font-bold px-2 py-1 ${statusBadgeColor}`}>
                                      {statusText}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-2 text-right font-bold text-green-600">{item.debit ? formatCurrency(Number(item.debit)) : '-'}</td>
                                  <td className="py-3 px-2 text-right font-bold text-green-600">{item.credit ? formatCurrency(Number(item.credit)) : '-'}</td>
                                  <td className="py-3 px-2 text-right font-bold text-green-600 hidden lg:table-cell">
                                    {formatCurrency(Math.abs(carryForwardAmount))}
                                  </td>
                                  <td className="py-3 px-2 text-right font-bold text-green-600">
                                    {item.academicYearBalance ? formatCurrency(Number(item.academicYearBalance)) : '-'}
                                  </td>
                                </tr>
                              );
                            } else {
                              return (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-1 sm:py-2 px-1 sm:px-2 text-xs sm:text-sm">{item.no || ''}</td>
                                  <td className="py-1 sm:py-2 px-1 sm:px-2 font-mono text-xs hidden sm:table-cell">{item.ref || '-'}</td>
                                  <td className="py-1 sm:py-2 px-1 sm:px-2 text-xs sm:text-sm">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                                  <td className="py-1 sm:py-2 px-1 sm:px-2 text-xs sm:text-sm truncate max-w-[100px]">{item.description || '-'}</td>
                                  <td className="py-1 sm:py-2 px-1 sm:px-2 text-right text-xs sm:text-sm">{item.debit ? formatCurrency(Number(item.debit)) : '-'}</td>
                                  <td className="py-1 sm:py-2 px-1 sm:px-2 text-right text-xs sm:text-sm">{item.credit ? formatCurrency(Number(item.credit)) : '-'}</td>
                                  <td className="py-1 sm:py-2 px-1 sm:px-2 text-right font-medium text-xs sm:text-sm hidden lg:table-cell">
                                    {item.termBalance ? formatCurrency(Number(item.termBalance)) : '-'}
                                  </td>
                                  <td className="py-1 sm:py-2 px-1 sm:px-2 text-right font-medium text-xs sm:text-sm">
                                    {item.academicYearBalance ? formatCurrency(Number(item.academicYearBalance)) : '-'}
                                  </td>
                                </tr>
                              );
                            }
                          })}
                          {statementData.statement.length > 5 && (
                            <tr>
                              <td colSpan={8} className="py-2 px-2 text-center text-gray-500 text-sm">
                                ... and {statementData.statement.length - 5} more entries
                              </td>
                            </tr>
                          )}
                        </>
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-4 px-2 text-center text-gray-500">
                            No transactions found for this academic year
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Download Actions */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Fee Statement
              </h3>
              <p className="text-sm text-green-600">Choose your preferred format and size</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={() => handleDownloadPDF('A3')}
              disabled={loading || !statementData || !selectedAcademicYear}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            >
              <Download className="w-4 h-4 mr-2" />
              A3 PDF
            </Button>
            
            <Button
              onClick={() => handleDownloadPDF('A4')}
              disabled={loading || !statementData || !selectedAcademicYear}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            >
              <Download className="w-4 h-4 mr-2" />
              A4 PDF
            </Button>
            
            <Button
              onClick={() => handleDownloadPDF('A5')}
              disabled={loading || !statementData || !selectedAcademicYear}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            >
              <Download className="w-4 h-4 mr-2" />
              A5 PDF
            </Button>
            
            <Button
              onClick={handleDownloadTXT}
              disabled={loading || !statementData || !selectedAcademicYear}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            >
              <FileText className="w-4 h-4 mr-2" />
              TXT File
            </Button>
          </div>
          
          {loading && (
            <div className="flex items-center justify-center gap-2 mt-4 text-green-700">
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              Generating fee statement...
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="text-center text-sm text-gray-600 bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-800">Enhanced Fee Statement</span>
          </div>
          <p className="text-green-700">
            🎯 This statement includes advanced overpayment tracking and carry-forward balances. 
            📊 Enhanced visual indicators show payment status and term-specific balance management.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
