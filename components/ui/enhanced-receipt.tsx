"use client";

import React, { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  School, 
  User, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  Receipt,
  FileText,
  Printer,
  X
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

interface EnhancedReceiptProps {
  receiptData: ReceiptData;
  onClose?: () => void;
  showActions?: boolean;
  className?: string;
}

const paperSizes = {
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 }
};

export function EnhancedReceipt({ 
  receiptData, 
  onClose, 
  showActions = true,
  className = ""
}: EnhancedReceiptProps) {
  console.log("🧾 EnhancedReceipt component called with:", { 
    hasReceiptData: !!receiptData, 
    showActions, 
    receiptNumber: receiptData?.receiptNumber 
  });
  
  const receiptRef = useRef<HTMLDivElement>(null);
  
  console.log("🎨 EnhancedReceipt rendering with showActions:", showActions);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${receiptData.currency || 'KES'} 0`;
    }
    return `${receiptData.currency || 'KES'} ${amount.toLocaleString()}`;
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) {
      return 'N/A';
    }
    try {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const convertToWords = (amount: number): string => {
    if (amount === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Million', 'Billion'];

    function convertHundreds(num: number): string {
      let result = '';
      
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        return result;
      }
      
      if (num > 0) {
        result += ones[num] + ' ';
      }
      
      return result;
    }

    let result = '';
    let thousandCounter = 0;
    
    while (amount > 0) {
      if (amount % 1000 !== 0) {
        result = convertHundreds(amount % 1000) + thousands[thousandCounter] + ' ' + result;
      }
      amount = Math.floor(amount / 1000);
      thousandCounter++;
    }
    
    return result.trim();
  };

  const generatePDF = async (format: 'A3' | 'A4' | 'A5' = 'A4') => {
    if (!receiptRef.current) return;

    try {
      // Create a temporary container with the desired format styling
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      tempContainer.style.background = 'white';
      tempContainer.style.padding = '30px';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.fontSize = '14px';
      tempContainer.style.lineHeight = '1.4';
      
      // Set width based on format with proper scaling
      const widthMap = { A3: '900px', A4: '700px', A5: '500px' };
      tempContainer.style.width = widthMap[format];
      tempContainer.style.minHeight = 'auto';
      
      // Clone and prepare the content
      const clonedContent = receiptRef.current.cloneNode(true) as HTMLElement;
      
      // Ensure all content is visible and properly sized
      clonedContent.style.transform = 'none';
      clonedContent.style.maxWidth = '100%';
      clonedContent.style.overflow = 'visible';
      
      tempContainer.appendChild(clonedContent);
      document.body.appendChild(tempContainer);

      // Wait a bit for content to render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate canvas with higher quality settings
      const canvas = await html2canvas(tempContainer, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: tempContainer.scrollHeight,
        width: tempContainer.scrollWidth,
        scrollX: 0,
        scrollY: 0,
        windowWidth: tempContainer.scrollWidth,
        windowHeight: tempContainer.scrollHeight
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Create PDF with proper sizing
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: format.toLowerCase() as any
      });

      const pdfWidth = paperSizes[format].width;
      const pdfHeight = paperSizes[format].height;
      
      // Calculate image dimensions to fit the page with margins
      const margin = 15; // 15mm margin
      const maxWidth = pdfWidth - (margin * 2);
      const maxHeight = pdfHeight - (margin * 2);
      
      const imgAspectRatio = canvas.width / canvas.height;
      let finalWidth = maxWidth;
      let finalHeight = maxWidth / imgAspectRatio;
      
      // If height exceeds page, scale down
      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = maxHeight * imgAspectRatio;
      }
      
      // Center the image on the page
      const x = (pdfWidth - finalWidth) / 2;
      const y = margin;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      
      // Save PDF
      const fileName = `Receipt-${receiptData.receiptNumber}-${format}.pdf`;
      pdf.save(fileName);
      
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
${receiptData.schoolName}
School Code: ${receiptData.schoolCode}
Email: ${receiptData.schoolCode.toLowerCase()}@school.ac.ke

PAYMENT RECEIPT
===============================================

Receipt No: ${receiptData.receiptNumber || 'N/A'}
Date: ${receiptData.issuedAt ? formatDate(receiptData.issuedAt) : new Date().toLocaleDateString()}

Received from:
${receiptData.studentName || 'N/A'}
Admission No: ${receiptData.admissionNumber || 'N/A'}
${receiptData.parentName ? `Parent/Guardian: ${receiptData.parentName}` : ''}

Payment for: ${receiptData.feeType || 'School Fee'}
Academic Year: ${receiptData.academicYear || 'N/A'}
Term: ${receiptData.term || 'N/A'}
Payment Method: ${receiptData.paymentMethod ? receiptData.paymentMethod.replace('_', ' ') : 'N/A'}

Amount: ${formatCurrency(receiptData.amount)}
In words: ${convertToWords(receiptData.amount)} ${receiptData.currency || 'Kenyan Shillings'} Only

${receiptData.reference ? `Reference: ${receiptData.reference}` : ''}
Payment ID: ${receiptData.paymentId || 'N/A'}
${receiptData.transactionId ? `Transaction ID: ${receiptData.transactionId}` : ''}

Issued by: ${receiptData.issuedBy || 'Bursar Office'}
Generated: ${new Date().toLocaleDateString()}

Thank you for your payment!
===============================================
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const ReceiptContent = () => (
    <div 
      ref={receiptRef} 
      className={`bg-white mx-auto max-w-2xl shadow-lg border border-gray-200 ${className}`}
      style={{
        background: 'white',
        fontFamily: 'Arial, sans-serif',
        minHeight: 'auto'
      }}
    >
      {/* Clean Simple Header */}
      <div className="bg-white border-b-2 border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {receiptData.schoolName}
            </h1>
            <p className="text-gray-500 text-sm">{receiptData.schoolCode.toLowerCase()}@school.ac.ke</p>
          </div>
          
          <div className="text-right">
            <div className="mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(receiptData.issuedAt).split(',')[0]}</p>
            </div>
            <div className="bg-orange-100 px-3 py-2 rounded-lg">
              <p className="text-xs text-orange-800 uppercase tracking-wide mb-1">Receipt No</p>
              <p className="text-sm font-bold text-orange-900">{receiptData.receiptNumber}</p>
            </div>
          </div>
        </div>
      </div>
          
      {/* Simple Title */}
      <div className="bg-gray-900 text-white text-center py-3">
        <h2 className="text-xl font-bold">PAYMENT RECEIPT</h2>
      </div>

      {/* Simple Customer Info */}
      <div className="p-6 bg-gray-50 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Received From:</h3>
            <p className="text-lg font-bold text-gray-900">{receiptData.studentName}</p>
            <p className="text-sm text-gray-600">Admission No: {receiptData.admissionNumber}</p>
            {receiptData.parentName && (
              <p className="text-sm text-gray-600">Parent/Guardian: {receiptData.parentName}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Payment For:</h3>
            <p className="text-lg font-bold text-gray-900">{receiptData.feeType}</p>
            <p className="text-sm text-gray-600">{receiptData.academicYear} - {receiptData.term}</p>
          </div>
        </div>
      </div>

      {/* Simple Payment Details */}
      <div className="p-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-sm font-semibold text-gray-700">Description</th>
              <th className="text-center py-2 text-sm font-semibold text-gray-700">Quantity</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3">
                <div className="font-medium text-gray-900">{receiptData.feeType}</div>
                <div className="text-sm text-gray-600">{receiptData.academicYear} - {receiptData.term}</div>
                <div className="text-xs text-gray-500">Payment Method: {receiptData.paymentMethod.replace('_', ' ')}</div>
              </td>
              <td className="text-center py-3 text-gray-700">1</td>
              <td className="text-right py-3 font-semibold text-gray-900">{formatCurrency(receiptData.amount)}</td>
            </tr>
            {/* Balance Information - Only if exists */}
            {(receiptData.termOutstandingBefore !== undefined || receiptData.academicYearOutstandingBefore !== undefined) && (
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="py-3">
                  <div className="font-medium text-gray-900">Account Balance Summary</div>
                  <div className="text-sm text-gray-600">
                    {receiptData.termOutstandingBefore !== undefined && (
                      <div>Term Balance: {formatCurrency(receiptData.termOutstandingBefore)} → {formatCurrency(receiptData.termOutstandingAfter)}</div>
                    )}
                    {receiptData.academicYearOutstandingBefore !== undefined && (
                      <div>Year Balance: {formatCurrency(receiptData.academicYearOutstandingBefore)} → {formatCurrency(receiptData.academicYearOutstandingAfter)}</div>
                    )}
                  </div>
                </td>
                <td className="text-center py-3 text-gray-500">-</td>
                <td className="text-right py-3 text-gray-500">-</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Simple Total Section */}
      <div className="border-t bg-orange-500 text-white p-4">
        <div className="text-center">
          <p className="text-sm uppercase tracking-wide mb-1">Total Amount Paid</p>
          <p className="text-2xl font-bold">{receiptData.currency} {receiptData.amount.toLocaleString()}</p>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="border-t p-4 bg-gray-50">
        <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">Amount in words:</p>
        <p className="text-sm font-semibold text-gray-800 italic">
          {convertToWords(receiptData.amount)} {receiptData.currency || 'Kenyan Shillings'} Only
        </p>
      </div>

      {/* Simple Footer */}
      <div className="border-t p-4 text-center bg-gray-100">
        <p className="text-sm font-semibold text-gray-800 mb-2">Thank you for your payment!</p>
        <p className="text-xs text-gray-600">Issued by: {receiptData.issuedBy} | Generated: {formatDate(new Date())}</p>
      </div>

      {/* Reference IDs - Only if needed */}
      {(receiptData.reference || receiptData.transactionId || receiptData.paymentId) && (
        <div className="border-t p-3 bg-gray-50">
          <div className="text-xs text-gray-600 space-y-1">
            {receiptData.paymentId && (
              <p><span className="font-semibold">Payment ID:</span> {receiptData.paymentId}</p>
            )}
            {receiptData.transactionId && (
              <p><span className="font-semibold">Transaction ID:</span> {receiptData.transactionId}</p>
            )}
            {receiptData.reference && (
              <p><span className="font-semibold">Reference:</span> {receiptData.reference}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (!showActions) {
    console.log("📄 EnhancedReceipt returning ReceiptContent only (no actions)");
    return <ReceiptContent />;
  }

  console.log("🎭 EnhancedReceipt returning full modal with actions");
  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm"
      style={{ pointerEvents: 'auto' }}
      onClick={(e) => {
        // Only close if clicking the backdrop (not the modal content)
        if (e.target === e.currentTarget && onClose) {
          console.log("🎯 Backdrop clicked - closing modal");
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          // Prevent clicks inside modal from bubbling to backdrop
          console.log("🛡️ Modal content clicked - preventing close");
          e.stopPropagation();
        }}
      >
        {/* Action Buttons */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Payment Receipt
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                console.log("🖨️ A3 button clicked!");
                generatePDF('A3');
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800"
            >
              <Download className="w-3 h-3" />
              A3
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                console.log("🖨️ A4 button clicked!");
                generatePDF('A4');
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800"
            >
              <Download className="w-3 h-3" />
              A4
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                console.log("🖨️ A5 button clicked!");
                generatePDF('A5');
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs bg-white hover:bg-purple-50 border-purple-200 text-purple-700 hover:text-purple-800"
            >
              <Download className="w-3 h-3" />
              A5
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                console.log("📄 TXT button clicked!");
                downloadTxtReceipt();
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-800"
            >
              <FileText className="w-3 h-3" />
              TXT
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                console.log("🖨️ Print button clicked!");
                handlePrint();
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs bg-white hover:bg-orange-50 border-orange-200 text-orange-700 hover:text-orange-800"
            >
              <Printer className="w-3 h-3" />
              Print
            </Button>
            {onClose && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("❌ Close button clicked!");
                  onClose();
                }} 
                variant="ghost" 
                size="sm" 
                className="text-xs hover:bg-red-50 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          style={{ pointerEvents: 'auto' }}
        >
          <ReceiptContent />
        </div>
      </div>
    </div>
  );
}
