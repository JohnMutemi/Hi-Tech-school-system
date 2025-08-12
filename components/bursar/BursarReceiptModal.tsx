import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Printer, X } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptData {
  receiptNumber: string;
  paymentId: string;
  studentId: string;
  schoolCode: string;
  amount: number;
  paymentMethod: string;
  feeType: string;
  term: string;
  academicYear: string;
  reference: string;
  phoneNumber?: string;
  transactionId?: string;
  status: string;
  issuedAt: Date;
  issuedBy: string;
  schoolName: string;
  studentName: string;
  admissionNumber: string;
  parentName?: string;
  currency: string;
  termOutstandingBefore?: number;
  termOutstandingAfter?: number;
  academicYearOutstandingBefore?: number;
  academicYearOutstandingAfter?: number;
  carryForward?: number;
}

interface BursarReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
}

export function BursarReceiptModal({ isOpen, onClose, receiptData }: BursarReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!receiptData) return null;

  const formatCurrency = (amount: number) => {
    return `${receiptData.currency || 'KES'} ${amount ? amount.toLocaleString() : '0'}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generatePDF = async (format: 'A3' | 'A4' | 'A5' = 'A4') => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // PDF dimensions for different formats
      const dimensions = {
        A3: { width: 297, height: 420 },
        A4: { width: 210, height: 297 },
        A5: { width: 148, height: 210 }
      };

      const { width, height } = dimensions[format];
      const pdf = new jsPDF('p', 'mm', [width, height]);
      
      // Calculate aspect ratio to fit image properly
      const imgWidth = width - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`bursar-receipt-${receiptData.receiptNumber}-${format}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the receipt');
      return;
    }

    const receiptHTML = receiptRef.current.innerHTML;
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${receiptData.receiptNumber}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .no-print { display: none !important; }
              .receipt-container { 
                box-shadow: none !important; 
                border: none !important;
                max-width: 100% !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${receiptHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printDocument);
    printWindow.document.close();
  };

  const downloadTxtReceipt = () => {
    const receiptContent = `
PAYMENT RECEIPT
===============================================

Receipt Number: ${receiptData.receiptNumber || 'N/A'}
Payment ID: ${receiptData.paymentId || 'N/A'}
Date: ${receiptData.issuedAt ? formatDate(receiptData.issuedAt) : new Date().toLocaleDateString()}

SCHOOL INFORMATION:
School: ${receiptData.schoolName || 'School Name'}
School Code: ${receiptData.schoolCode || 'N/A'}

STUDENT INFORMATION:
Student Name: ${receiptData.studentName || 'N/A'}
Admission Number: ${receiptData.admissionNumber || 'N/A'}
${receiptData.parentName ? `Parent Name: ${receiptData.parentName}` : ''}

PAYMENT DETAILS:
Amount: ${formatCurrency(receiptData.amount)}
Payment Method: ${receiptData.paymentMethod ? receiptData.paymentMethod.toUpperCase() : 'N/A'}
Fee Type: ${receiptData.feeType || 'School Fee'}
Term: ${receiptData.term || 'N/A'}
Academic Year: ${receiptData.academicYear || 'N/A'}
Reference: ${receiptData.reference || 'N/A'}
${receiptData.phoneNumber ? `Phone Number: ${receiptData.phoneNumber}` : ''}
${receiptData.transactionId ? `Transaction ID: ${receiptData.transactionId}` : ''}

BALANCE INFORMATION:
${receiptData.termOutstandingBefore !== undefined ? 
  `Term Outstanding (Before): ${formatCurrency(receiptData.termOutstandingBefore)}` : ''}
${receiptData.termOutstandingAfter !== undefined ? 
  `Term Outstanding (After): ${formatCurrency(receiptData.termOutstandingAfter)}` : ''}
${receiptData.academicYearOutstandingBefore !== undefined ? 
  `Academic Year Outstanding (Before): ${formatCurrency(receiptData.academicYearOutstandingBefore)}` : ''}
${receiptData.academicYearOutstandingAfter !== undefined ? 
  `Academic Year Outstanding (After): ${formatCurrency(receiptData.academicYearOutstandingAfter)}` : ''}
${receiptData.carryForward ? `Carry Forward: ${formatCurrency(receiptData.carryForward)}` : ''}

Status: ${receiptData.status ? receiptData.status.toUpperCase() : 'PENDING'}
Issued by: ${receiptData.issuedBy || 'Bursar Office'}

===============================================
This is a computer-generated receipt.
Receipt processed by Bursar Portal.
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bursar-receipt-${receiptData.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold">Payment Receipt</span>
            <div className="flex gap-2">
              {/* PDF Downloads */}
              <Button
                onClick={() => generatePDF('A4')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                PDF A4
              </Button>
              <Button
                onClick={() => generatePDF('A5')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                PDF A5
              </Button>
              
              {/* Text Download */}
              <Button
                onClick={downloadTxtReceipt}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                TXT
              </Button>
              
              {/* Print */}
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Printer className="w-3 h-3 mr-1" />
                Print
              </Button>
              
              {/* Close */}
              <Button onClick={onClose} variant="ghost" size="sm" className="text-xs">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          <div ref={receiptRef} className="bg-white p-8">
            {/* Receipt Header */}
            <div className="text-center border-b-2 border-gray-200 pb-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">PAYMENT RECEIPT</h1>
              <div className="text-lg font-semibold text-blue-600">{receiptData.schoolName || 'School Name'}</div>
              <div className="text-sm text-gray-600 mt-1">School Code: {receiptData.schoolCode || 'N/A'}</div>
            </div>

            {/* Receipt Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1">Receipt Information</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Receipt Number:</span> {receiptData.receiptNumber || 'N/A'}</div>
                  <div><span className="font-medium">Payment ID:</span> {receiptData.paymentId || 'N/A'}</div>
                  <div><span className="font-medium">Date & Time:</span> {receiptData.issuedAt ? formatDate(receiptData.issuedAt) : new Date().toLocaleDateString()}</div>
                  <div><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                      receiptData.status && (receiptData.status.toLowerCase() === 'completed' || receiptData.status.toLowerCase() === 'successful')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {receiptData.status ? receiptData.status.toUpperCase() : 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1">Student Information</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Student Name:</span> {receiptData.studentName || 'N/A'}</div>
                  <div><span className="font-medium">Admission Number:</span> {receiptData.admissionNumber || 'N/A'}</div>
                  {receiptData.parentName && (
                    <div><span className="font-medium">Parent Name:</span> {receiptData.parentName}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 text-center">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="mb-2"><span className="font-medium">Amount Paid:</span> 
                    <span className="text-lg font-bold text-green-600 ml-2">{formatCurrency(receiptData.amount)}</span>
                  </div>
                  <div className="mb-2"><span className="font-medium">Payment Method:</span> {receiptData.paymentMethod ? receiptData.paymentMethod.toUpperCase() : 'N/A'}</div>
                  <div className="mb-2"><span className="font-medium">Fee Type:</span> {receiptData.feeType || 'School Fee'}</div>
                </div>
                <div>
                  <div className="mb-2"><span className="font-medium">Term:</span> {receiptData.term || 'N/A'}</div>
                  <div className="mb-2"><span className="font-medium">Academic Year:</span> {receiptData.academicYear || 'N/A'}</div>
                  <div className="mb-2"><span className="font-medium">Reference:</span> {receiptData.reference || 'N/A'}</div>
                </div>
              </div>

              {(receiptData.phoneNumber || receiptData.transactionId) && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {receiptData.phoneNumber && (
                      <div><span className="font-medium">Phone Number:</span> {receiptData.phoneNumber}</div>
                    )}
                    {receiptData.transactionId && (
                      <div><span className="font-medium">Transaction ID:</span> {receiptData.transactionId}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Balance Information */}
            {(receiptData.termOutstandingBefore !== undefined || receiptData.academicYearOutstandingBefore !== undefined) && (
              <div className="border border-blue-200 rounded-lg p-4 mb-6 bg-blue-50">
                <h3 className="font-semibold text-blue-700 mb-3 text-center">Balance Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {receiptData.termOutstandingBefore !== undefined && (
                    <div>
                      <div className="mb-1"><span className="font-medium">Term Balance (Before):</span> {formatCurrency(receiptData.termOutstandingBefore)}</div>
                      {receiptData.termOutstandingAfter !== undefined && (
                        <div><span className="font-medium">Term Balance (After):</span> 
                          <span className={`ml-1 font-bold ${receiptData.termOutstandingAfter <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(receiptData.termOutstandingAfter)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {receiptData.academicYearOutstandingBefore !== undefined && (
                    <div>
                      <div className="mb-1"><span className="font-medium">Academic Year Balance (Before):</span> {formatCurrency(receiptData.academicYearOutstandingBefore)}</div>
                      {receiptData.academicYearOutstandingAfter !== undefined && (
                        <div><span className="font-medium">Academic Year Balance (After):</span> 
                          <span className={`ml-1 font-bold ${receiptData.academicYearOutstandingAfter <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(receiptData.academicYearOutstandingAfter)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {receiptData.carryForward && receiptData.carryForward > 0 && (
                  <div className="border-t border-blue-200 pt-2 mt-2">
                    <div className="text-sm"><span className="font-medium">Carry Forward to Next Term:</span> 
                      <span className="text-green-600 font-bold ml-1">{formatCurrency(receiptData.carryForward)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="border-t-2 border-gray-200 pt-4 mt-6">
              <div className="text-center text-sm text-gray-600">
                <div className="mb-1">Issued by: <span className="font-medium">{receiptData.issuedBy || 'Bursar Office'}</span></div>
                <div className="mb-1">Processed through: <span className="font-medium">Bursar Portal</span></div>
                <div className="text-xs italic">This is a computer-generated receipt and does not require a signature.</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}





