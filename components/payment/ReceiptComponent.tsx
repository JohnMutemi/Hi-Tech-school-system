"use client";

import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, School, User, Calendar, CreditCard, CheckCircle } from "lucide-react";
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
  parentName: string;
  currency: string;
  termOutstandingBefore: number;
  termOutstandingAfter: number;
  academicYearOutstandingBefore: number;
  academicYearOutstandingAfter: number;
  carryForward?: number;
}

interface ReceiptComponentProps {
  receiptData: ReceiptData;
  onClose?: () => void;
}

const paperSizes = {
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 }
};

export default function ReceiptComponent({ receiptData, onClose }: ReceiptComponentProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const generatePDF = async (format: 'A3' | 'A4' | 'A5') => {
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

  const formatCurrency = (amount: number) => {
    return `${receiptData.currency} ${amount.toLocaleString()}`;
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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Action Buttons */}
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Payment Receipt</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => generatePDF('A3')}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
            >
              <Download className="w-3 h-3" />
              A3
            </Button>
            <Button
              onClick={() => generatePDF('A4')}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
            >
              <Download className="w-3 h-3" />
              A4
            </Button>
            <Button
              onClick={() => generatePDF('A5')}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
            >
              <Download className="w-3 h-3" />
              A5
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="ghost" size="sm" className="text-xs">
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">

        {/* Receipt Content */}
        <div ref={receiptRef} className="p-6 bg-white">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <School className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">{receiptData.schoolName}</h1>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-700 font-medium text-sm">Payment Successful</span>
              </div>
              <h2 className="text-lg font-bold text-green-800">OFFICIAL RECEIPT</h2>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>Receipt No: <strong>{receiptData.receiptNumber}</strong></span>
              <span>Date: <strong>{formatDate(receiptData.issuedAt)}</strong></span>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Student Information */}
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50 pb-2">
                <CardTitle className="flex items-center gap-2 text-blue-800 text-sm">
                  <User className="w-4 h-4" />
                  Student Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 space-y-1">
                <div>
                  <span className="text-xs text-gray-600">Student Name:</span>
                  <p className="font-semibold text-sm">{receiptData.studentName}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Admission Number:</span>
                  <p className="font-semibold text-sm">{receiptData.admissionNumber}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Parent/Guardian:</span>
                  <p className="font-semibold text-sm">{receiptData.parentName}</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card className="border-green-200">
              <CardHeader className="bg-green-50 pb-2">
                <CardTitle className="flex items-center gap-2 text-green-800 text-sm">
                  <CreditCard className="w-4 h-4" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 space-y-1">
                <div>
                  <span className="text-xs text-gray-600">Amount Paid:</span>
                  <p className="font-bold text-base text-green-600">{formatCurrency(receiptData.amount)}</p>
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
                  <p className="font-semibold text-xs break-all">{receiptData.reference}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Academic Information */}
          <Card className="border-purple-200 mb-4">
            <CardHeader className="bg-purple-50 pb-2">
              <CardTitle className="flex items-center gap-2 text-purple-800 text-sm">
                <Calendar className="w-4 h-4" />
                Academic Period
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-2 gap-3">
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
                  <Badge className="bg-green-100 text-green-800 text-xs">{receiptData.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Summary */}
          <Card className="border-orange-200 mb-4">
            <CardHeader className="bg-orange-50 pb-2">
              <CardTitle className="text-orange-800 text-sm">Balance Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                {/* Term Balance */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">{receiptData.term} Balance</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-600">Balance Before:</span>
                      <p className="font-semibold text-sm">{formatCurrency(receiptData.termOutstandingBefore)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Balance After:</span>
                      <p className={`font-semibold text-sm ${receiptData.termOutstandingAfter <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {formatCurrency(receiptData.termOutstandingAfter)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic Year Balance */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">Academic Year Balance</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-600">Balance Before:</span>
                      <p className="font-semibold text-sm">{formatCurrency(receiptData.academicYearOutstandingBefore)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Balance After:</span>
                      <p className={`font-semibold text-sm ${receiptData.academicYearOutstandingAfter <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {formatCurrency(receiptData.academicYearOutstandingAfter)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Carry Forward */}
                {receiptData.carryForward && receiptData.carryForward > 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-1 text-sm">Overpayment Carried Forward</h4>
                    <p className="text-blue-700 font-semibold text-sm">{formatCurrency(receiptData.carryForward)}</p>
                    <p className="text-xs text-blue-600 mt-1">This amount will be applied to your next term fees.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <Separator className="my-4" />
          
          <div className="text-center space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h3 className="text-base font-bold text-green-800 mb-1">Thank You for Your Payment!</h3>
              <p className="text-green-700 text-sm">
                We appreciate your prompt payment. This receipt serves as proof of payment for the above mentioned fees.
              </p>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Received By:</strong> {receiptData.issuedBy}</p>
              <p><strong>Payment ID:</strong> {receiptData.paymentId}</p>
              {receiptData.transactionId && (
                <p><strong>Transaction ID:</strong> {receiptData.transactionId}</p>
              )}
            </div>
            
            <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
              <p>This is a computer-generated receipt and does not require a signature.</p>
              <p>For any queries, please contact the school administration.</p>
              <p>Generated on {formatDate(new Date())}</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

