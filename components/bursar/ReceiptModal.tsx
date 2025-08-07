'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Printer, X } from 'lucide-react';

interface ReceiptData {
  receipt: {
    id: string;
    receiptNumber: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber: string;
    balanceBefore: number;
    balanceAfter: number;
  };
  school: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
  student: {
    name: string;
    admissionNumber: string;
    className?: string;
    gradeName?: string;
  };
  parent?: {
    name: string;
    phone: string;
    email: string;
  };
  payment: {
    amount: number;
    method: string;
    reference: string;
    description: string;
    receivedBy: string;
  };
  academicInfo: {
    academicYear?: string;
    term?: string;
  };
  timestamp: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId: string;
  schoolCode: string;
}

export function ReceiptModal({
  isOpen,
  onClose,
  receiptId,
  schoolCode,
}: ReceiptModalProps) {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const fetchReceiptData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schools/${schoolCode}/bursar/receipts/${receiptId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch receipt data');
      }

      const data = await response.json();
      setReceiptData(data.data);
    } catch (error) {
      console.error('Error fetching receipt:', error);
      toast({
        title: 'Error',
        description: 'Failed to load receipt data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && receiptId) {
      fetchReceiptData();
    }
  }, [isOpen, receiptId, schoolCode]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - ${receiptData?.receipt.receiptNumber}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 20px; 
                  font-size: 12px;
                }
                .receipt { 
                  max-width: 400px; 
                  margin: 0 auto; 
                  border: 1px solid #ccc; 
                  padding: 20px;
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 20px; 
                  border-bottom: 2px solid #333;
                  padding-bottom: 10px;
                }
                .school-name { 
                  font-size: 18px; 
                  font-weight: bold; 
                  margin-bottom: 5px;
                }
                .receipt-title { 
                  font-size: 16px; 
                  font-weight: bold; 
                  margin: 10px 0;
                }
                .row { 
                  display: flex; 
                  justify-content: space-between; 
                  margin: 5px 0;
                }
                .label { 
                  font-weight: bold; 
                }
                .amount { 
                  font-size: 14px; 
                  font-weight: bold;
                }
                .total-row { 
                  border-top: 2px solid #333; 
                  margin-top: 10px; 
                  padding-top: 10px;
                }
                .footer { 
                  text-align: center; 
                  margin-top: 20px; 
                  font-size: 10px;
                  border-top: 1px solid #ccc;
                  padding-top: 10px;
                }
                @media print {
                  body { margin: 0; padding: 10px; }
                  .receipt { border: none; max-width: none; }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    // Create a simple text receipt for download
    if (!receiptData) return;

    const receiptText = `
OFFICIAL RECEIPT
================

${receiptData.school.name}
${receiptData.school.address}
Tel: ${receiptData.school.phone}
Email: ${receiptData.school.email}

Receipt No: ${receiptData.receipt.receiptNumber}
Date: ${formatDate(receiptData.receipt.paymentDate)}

STUDENT INFORMATION
-------------------
Name: ${receiptData.student.name}
Admission No: ${receiptData.student.admissionNumber}
Class: ${receiptData.student.className || receiptData.student.gradeName || 'N/A'}

PAYMENT DETAILS
---------------
Academic Year: ${receiptData.academicInfo.academicYear || 'N/A'}
Term: ${receiptData.academicInfo.term || 'N/A'}
Description: ${receiptData.payment.description}
Payment Method: ${receiptData.payment.method.toUpperCase()}
Reference: ${receiptData.payment.reference}

AMOUNT DETAILS
--------------
Amount Paid: ${formatCurrency(receiptData.receipt.amount)}
Balance Before: ${formatCurrency(receiptData.receipt.balanceBefore || 0)}
Balance After: ${formatCurrency(receiptData.receipt.balanceAfter || 0)}

Received By: ${receiptData.payment.receivedBy}

Thank you for your payment!

Generated: ${formatDate(receiptData.timestamp)}
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.receipt.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading receipt...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!receiptData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load receipt data</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Receipt Details
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Content */}
        <Card>
          <CardContent className="p-6">
            <div ref={printRef} className="receipt">
              {/* School Header */}
              <div className="header">
                {receiptData.school.logo && (
                  <img 
                    src={receiptData.school.logo} 
                    alt="School Logo" 
                    className="mx-auto mb-2 h-12 w-12 object-contain"
                  />
                )}
                <div className="school-name">{receiptData.school.name}</div>
                <div className="text-sm text-gray-600">{receiptData.school.address}</div>
                <div className="text-sm text-gray-600">
                  Tel: {receiptData.school.phone} | Email: {receiptData.school.email}
                </div>
                <div className="receipt-title">OFFICIAL RECEIPT</div>
              </div>

              {/* Receipt Details */}
              <div className="space-y-2">
                <div className="row">
                  <span className="label">Receipt No:</span>
                  <span className="font-mono">{receiptData.receipt.receiptNumber}</span>
                </div>
                <div className="row">
                  <span className="label">Date:</span>
                  <span>{formatDate(receiptData.receipt.paymentDate)}</span>
                </div>
              </div>

              {/* Student Information */}
              <div className="mt-4 pt-4 border-t">
                <div className="font-bold mb-2">STUDENT INFORMATION</div>
                <div className="row">
                  <span className="label">Name:</span>
                  <span>{receiptData.student.name}</span>
                </div>
                <div className="row">
                  <span className="label">Admission No:</span>
                  <span className="font-mono">{receiptData.student.admissionNumber}</span>
                </div>
                <div className="row">
                  <span className="label">Class:</span>
                  <span>{receiptData.student.className || receiptData.student.gradeName || 'N/A'}</span>
                </div>
                {receiptData.parent && (
                  <div className="row">
                    <span className="label">Parent:</span>
                    <span>{receiptData.parent.name}</span>
                  </div>
                )}
              </div>

              {/* Payment Information */}
              <div className="mt-4 pt-4 border-t">
                <div className="font-bold mb-2">PAYMENT DETAILS</div>
                <div className="row">
                  <span className="label">Academic Year:</span>
                  <span>{receiptData.academicInfo.academicYear || 'N/A'}</span>
                </div>
                <div className="row">
                  <span className="label">Term:</span>
                  <span>{receiptData.academicInfo.term || 'N/A'}</span>
                </div>
                <div className="row">
                  <span className="label">Description:</span>
                  <span>{receiptData.payment.description}</span>
                </div>
                <div className="row">
                  <span className="label">Payment Method:</span>
                  <span className="uppercase">{receiptData.payment.method}</span>
                </div>
                <div className="row">
                  <span className="label">Reference:</span>
                  <span className="font-mono">{receiptData.payment.reference}</span>
                </div>
              </div>

              {/* Amount Details */}
              <div className="mt-4 pt-4 border-t">
                <div className="font-bold mb-2">AMOUNT DETAILS</div>
                <div className="row">
                  <span className="label">Balance Before:</span>
                  <span className="amount">{formatCurrency(receiptData.receipt.balanceBefore || 0)}</span>
                </div>
                <div className="row total-row">
                  <span className="label text-lg">Amount Paid:</span>
                  <span className="amount text-lg">{formatCurrency(receiptData.receipt.amount)}</span>
                </div>
                <div className="row">
                  <span className="label">Balance After:</span>
                  <span className="amount">{formatCurrency(receiptData.receipt.balanceAfter || 0)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="footer">
                <div className="row">
                  <span className="label">Received By:</span>
                  <span>{receiptData.payment.receivedBy}</span>
                </div>
                <div className="mt-4 text-center font-bold">Thank you for your payment!</div>
                <div className="mt-2 text-xs text-gray-500">
                  Generated: {formatDate(receiptData.timestamp)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 pt-4">
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

