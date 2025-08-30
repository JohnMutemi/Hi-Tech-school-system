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

  const handleDownloadPDF = async () => {
    if (!statementData) return;

    try {
      setLoading(true);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('FEE STATEMENT', pageWidth / 2, 20, { align: 'center' });
      
      // School and student info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Student: ${statementData.student?.name || 'Student'}`, 20, 35);
      doc.text(`Admission No: ${statementData.student?.admissionNumber || 'N/A'}`, 20, 42);
      doc.text(`Class: ${statementData.student?.gradeName || 'N/A'} - ${statementData.student?.className || 'N/A'}`, 20, 49);
      doc.text(`Academic Year: ${statementData.academicYear || 'Academic Year'}`, 20, 56);
      if (statementData.student?.parentName) {
        doc.text(`Parent: ${statementData.student.parentName}`, 20, 63);
      }
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 70);
      
      // Statement table
      autoTable(doc, {
        startY: 80,
        head: [
          ['No.', 'Ref', 'Date', 'Description', 'Debit (KES)', 'Credit (KES)', 'Balance (KES)']
        ],
        body: (statementData.statement || []).map((item, index) => [
          (item.no || index + 1).toString(),
          item.ref || '-',
          item.date ? new Date(item.date).toLocaleDateString() : '-',
          item.description || '-',
          item.debit ? Number(item.debit).toLocaleString() : '-',
          item.credit ? Number(item.credit).toLocaleString() : '-',
          Number(item.balance || 0).toLocaleString()
        ]),
        theme: 'grid',
        headStyles: { 
          fillColor: [44, 62, 80],
          textColor: 255,
          fontSize: 10
        },
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 50 },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 25, halign: 'right' }
        }
      });
      
      // Summary section
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY:', 20, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Charges: KES ${(statementData.summary?.totalDebit || 0).toLocaleString()}`, 20, finalY + 10);
      doc.text(`Total Payments: KES ${(statementData.summary?.totalCredit || 0).toLocaleString()}`, 20, finalY + 17);
      doc.text(`Outstanding Balance: KES ${(statementData.summary?.finalBalance || 0).toLocaleString()}`, 20, finalY + 24);
      
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('This is a computer-generated statement. Please contact the school for any discrepancies.', pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Save the PDF
      const fileName = `Fee_Statement_${studentName.replace(/\s+/g, '_')}_${(statementData.academicYear || 'Academic_Year').replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: 'Success',
        description: 'Fee statement downloaded successfully',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          Fee Statement Download
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Student Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="font-medium">{studentName}</span>
            </div>
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">{gradeName} - {className}</span>
            </div>
            <div className="text-sm text-gray-500 font-mono">{admissionNumber}</div>
          </div>
          <div className="space-y-2">
            {parentName && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Parent: {parentName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {academicYears.find(y => y.id === selectedAcademicYear)?.name || 'Select Academic Year'}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Year Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Select Academic Year</label>
          <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear} disabled={loadingYears}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  <div className="flex items-center gap-2">
                    <span>{year.name}</span>
                    {year.isCurrent && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Total Charges</span>
                  </div>
                  <div className="text-xl font-bold text-blue-900">
                    {formatCurrency(statementData.summary?.totalDebit || 0)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Total Payments</span>
                  </div>
                  <div className="text-xl font-bold text-green-900">
                    {formatCurrency(statementData.summary?.totalCredit || 0)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">Outstanding</span>
                  </div>
                  <div className="text-xl font-bold text-amber-900">
                    {formatCurrency(statementData.summary?.finalBalance || 0)}
                  </div>
                  <Badge className={`mt-1 ${getBalanceStatus(statementData.summary?.finalBalance || 0).color}`}>
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
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-50 border-b-2 border-blue-200">
                        <th className="py-3 px-2 text-left font-semibold text-blue-800">No.</th>
                        <th className="py-3 px-2 text-left font-semibold text-blue-800">Ref</th>
                        <th className="py-3 px-2 text-left font-semibold text-blue-800">Date</th>
                        <th className="py-3 px-2 text-left font-semibold text-blue-800">Description</th>
                        <th className="py-3 px-2 text-right font-semibold text-blue-800">Debit</th>
                        <th className="py-3 px-2 text-right font-semibold text-blue-800">Credit</th>
                        <th className="py-3 px-2 text-right font-semibold text-blue-800">Term Bal.</th>
                        <th className="py-3 px-2 text-right font-semibold text-blue-800">Year Bal.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementData.statement && statementData.statement.length > 0 ? (
                        <>
                          {statementData.statement.slice(0, 5).map((item, index) => {
                            // Handle special row types with different styling
                            if (item.type === 'term-header') {
                              return (
                                <tr key={index} className="bg-blue-100 border-b border-blue-200">
                                  <td colSpan={8} className="py-3 px-2 text-center font-bold text-blue-800">
                                    {item.description}
                                  </td>
                                </tr>
                              );
                            } else if (item.type === 'term-closing') {
                              return (
                                <tr key={index} className="bg-yellow-100 border-b border-yellow-200">
                                  <td className="py-2 px-2"></td>
                                  <td className="py-2 px-2"></td>
                                  <td className="py-2 px-2"></td>
                                  <td className="py-2 px-2 font-bold text-yellow-800">{item.description}</td>
                                  <td className="py-2 px-2"></td>
                                  <td className="py-2 px-2"></td>
                                  <td className="py-2 px-2 text-right font-bold text-yellow-800">
                                    {formatCurrency(Number(item.termBalance) || 0)}
                                  </td>
                                  <td className="py-2 px-2 text-right font-bold text-yellow-800">
                                    {formatCurrency(Number(item.academicYearBalance) || 0)}
                                  </td>
                                </tr>
                              );
                            } else if (item.type === 'brought-forward') {
                              return (
                                <tr key={index} className="bg-red-100 border-b border-red-200">
                                  <td className="py-2 px-2 font-bold text-red-800">{item.no || ''}</td>
                                  <td className="py-2 px-2 font-mono text-xs font-bold text-red-800">{item.ref || '-'}</td>
                                  <td className="py-2 px-2 font-bold text-red-800">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                                  <td className="py-2 px-2 font-bold text-red-800">{item.description || '-'}</td>
                                  <td className="py-2 px-2 text-right font-bold text-red-800">{item.debit ? formatCurrency(Number(item.debit)) : '-'}</td>
                                  <td className="py-2 px-2 text-right font-bold text-red-800">{item.credit ? formatCurrency(Number(item.credit)) : '-'}</td>
                                  <td className="py-2 px-2 text-right font-bold text-red-800">
                                    {item.termBalance ? formatCurrency(Number(item.termBalance)) : '-'}
                                  </td>
                                  <td className="py-2 px-2 text-right font-bold text-red-800">
                                    {item.academicYearBalance ? formatCurrency(Number(item.academicYearBalance)) : '-'}
                                  </td>
                                </tr>
                              );
                            } else {
                              return (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-2 px-2">{item.no || ''}</td>
                                  <td className="py-2 px-2 font-mono text-xs">{item.ref || '-'}</td>
                                  <td className="py-2 px-2">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                                  <td className="py-2 px-2">{item.description || '-'}</td>
                                  <td className="py-2 px-2 text-right">{item.debit ? formatCurrency(Number(item.debit)) : '-'}</td>
                                  <td className="py-2 px-2 text-right">{item.credit ? formatCurrency(Number(item.credit)) : '-'}</td>
                                  <td className="py-2 px-2 text-right font-medium">
                                    {item.termBalance ? formatCurrency(Number(item.termBalance)) : '-'}
                                  </td>
                                  <td className="py-2 px-2 text-right font-medium">
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

        {/* Download Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleDownloadPDF}
            disabled={loading || !statementData || !selectedAcademicYear}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating PDF...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Fee Statement (PDF)
              </div>
            )}
          </Button>
        </div>

        {/* Info Note */}
        <div className="text-center text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Important Information</span>
          </div>
          <p>
            This fee statement includes all charges and payments for the selected academic year. 
            The PDF will contain a complete breakdown of all transactions and current balance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
