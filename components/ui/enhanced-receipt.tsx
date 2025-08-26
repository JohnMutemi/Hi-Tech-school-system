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
    a.download = `receipt-${receiptData.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const ReceiptContent = () => (
    <div 
      ref={receiptRef} 
      className={`bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-100 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Curled corner effect */}
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-8 h-8 bg-gray-200 transform rotate-45 origin-bottom-left shadow-lg"></div>
      </div>

      {/* Header with gradient background */}
      <div className="text-center mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl -mx-8 -mt-8 h-32 opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg">
              <School className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{receiptData.schoolName}</h1>
              <p className="text-sm text-gray-600">School Code: {receiptData.schoolCode}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-semibold">Payment Successful</span>
            </div>
            <h2 className="text-xl font-bold text-green-800">OFFICIAL RECEIPT</h2>
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <span>Receipt No: <strong className="text-blue-600">{receiptData.receiptNumber}</strong></span>
            <span>Date: <strong>{formatDate(receiptData.issuedAt)}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Student Information */}
        <Card className="border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-800">Student Details</h3>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-600">Student Name:</span>
                <p className="font-semibold text-sm text-gray-800">{receiptData.studentName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-600">Admission Number:</span>
                <p className="font-semibold text-sm text-gray-800">{receiptData.admissionNumber}</p>
              </div>
              {receiptData.parentName && (
                <div>
                  <span className="text-xs text-gray-600">Parent/Guardian:</span>
                  <p className="font-semibold text-sm text-gray-800">{receiptData.parentName}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CreditCard className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-800">Payment Details</h3>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-600">Amount Paid:</span>
                <p className="font-bold text-lg text-green-600">{formatCurrency(receiptData.amount)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-600">Payment Method:</span>
                <p className="font-semibold text-sm capitalize">{receiptData.paymentMethod.replace('_', ' ')}</p>
              </div>
              {receiptData.phoneNumber && (
                <div>
                  <span className="text-xs text-gray-600">Phone Number:</span>
                  <p className="font-semibold text-sm">{receiptData.phoneNumber}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-600">Reference:</span>
                <p className="font-semibold text-xs break-all text-gray-700">{receiptData.reference}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Information */}
      <Card className="border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-purple-800">Academic Period</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-600">Academic Year:</span>
              <p className="font-semibold text-sm">{receiptData.academicYear}</p>
            </div>
            <div>
              <span className="text-xs text-gray-600">Term:</span>
              <p className="font-semibold text-sm">{receiptData.term}</p>
            </div>
            <div>
              <span className="text-xs text-gray-600">Fee Type:</span>
              <p className="font-semibold text-sm">{receiptData.feeType}</p>
            </div>
            <div>
              <span className="text-xs text-gray-600">Status:</span>
              <Badge className={`text-xs ${
                receiptData.status?.toLowerCase() === 'completed' || receiptData.status?.toLowerCase() === 'successful'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {receiptData.status?.toUpperCase() || 'PENDING'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Summary */}
      {(receiptData.termOutstandingBefore !== undefined || receiptData.academicYearOutstandingBefore !== undefined) && (
        <Card className="border-2 border-orange-200 shadow-md hover:shadow-lg transition-shadow mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Receipt className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="font-semibold text-orange-800">Balance Summary</h3>
            </div>
            <div className="space-y-4">
              {/* Term Balance */}
              {receiptData.termOutstandingBefore !== undefined && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">{receiptData.term} Balance</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Balance Before:</span>
                      <p className="font-semibold text-sm">{formatCurrency(receiptData.termOutstandingBefore)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Balance After:</span>
                      <p className={`font-semibold text-sm ${
                        receiptData.termOutstandingAfter && receiptData.termOutstandingAfter <= 0 
                          ? 'text-green-600' 
                          : 'text-orange-600'
                      }`}>
                        {formatCurrency(receiptData.termOutstandingAfter)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Academic Year Balance */}
              {receiptData.academicYearOutstandingBefore !== undefined && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">Academic Year Balance</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Balance Before:</span>
                      <p className="font-semibold text-sm">{formatCurrency(receiptData.academicYearOutstandingBefore)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Balance After:</span>
                      <p className={`font-semibold text-sm ${
                        receiptData.academicYearOutstandingAfter && receiptData.academicYearOutstandingAfter <= 0 
                          ? 'text-green-600' 
                          : 'text-orange-600'
                      }`}>
                        {formatCurrency(receiptData.academicYearOutstandingAfter)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Carry Forward */}
              {receiptData.carryForward && receiptData.carryForward > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2 text-sm">Overpayment Carried Forward</h4>
                  <p className="text-blue-700 font-semibold text-sm">{formatCurrency(receiptData.carryForward)}</p>
                  <p className="text-xs text-blue-600 mt-1">This amount will be applied to your next term fees.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <Separator className="my-6" />
      
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
          <h3 className="text-lg font-bold text-green-800 mb-2">Thank You for Your Payment!</h3>
          <p className="text-green-700 text-sm">
            We appreciate your prompt payment. This receipt serves as proof of payment for the above mentioned fees.
          </p>
        </div>
        
        <div className="text-xs text-gray-600 space-y-1 bg-gray-50 rounded-lg p-3">
          <p><strong>Received By:</strong> {receiptData.issuedBy}</p>
          <p><strong>Payment ID:</strong> {receiptData.paymentId}</p>
          {receiptData.transactionId && (
            <p><strong>Transaction ID:</strong> {receiptData.transactionId}</p>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
          <p>This is a computer-generated receipt and does not require a signature.</p>
          <p>For any queries, please contact the school administration.</p>
          <p>Generated on {formatDate(new Date())}</p>
        </div>
      </div>
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
