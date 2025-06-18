"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Printer, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Utility function to convert numbers to words
const convertAmountToWords = (amount: number): string => {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const numToWords = (num: number): string => {
    if (num === 0) return "";
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + units[num % 10] : "");
    if (num < 1000) return units[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " " + numToWords(num % 100) : "");
    if (num < 100000) return numToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + numToWords(num % 1000) : "");
    if (num < 10000000) return numToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + numToWords(num % 100000) : "");
    return numToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 !== 0 ? " " + numToWords(num % 10000000) : "");
  };

  const [integerPart, decimalPart] = amount.toFixed(2).split('.');
  let words = numToWords(parseInt(integerPart));

  if (words) {
    words += " Shillings";
  }

  if (decimalPart && parseInt(decimalPart) > 0) {
    words += ` and ${numToWords(parseInt(decimalPart))} Cents`;
  }

  return words.trim() + " Only";
};

interface ReceiptData {
  id: string
  receiptNumber: string
  amount: number
  paymentDate: string
  paymentMethod: string
  referenceNumber: string
  studentName: string
  studentId: string
  schoolName: string
  schoolCode: string
  generatedAt: string
}

interface ReceiptGeneratorProps {
  receipt: ReceiptData
  onClose?: () => void
}

const PAPER_SIZES = {
  A3: { width: '297mm', height: '420mm' },
  A4: { width: '210mm', height: '297mm' },
  A5: { width: '148mm', height: '210mm' }
}

export function ReceiptGenerator({ receipt, onClose }: ReceiptGeneratorProps) {
  const [selectedSize, setSelectedSize] = useState<'A3' | 'A4' | 'A5'>('A4')
  const { toast } = useToast()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const generateReceiptHTML = () => {
    const size = PAPER_SIZES[selectedSize]
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt ${receipt.receiptNumber}</title>
          <style>
            @page {
              size: ${selectedSize};
              margin: 20mm;
            }
            body {
              font-family: 'Inter', sans-serif';
              margin: 0;
              padding: 0;
              width: ${size.width};
              height: ${size.height};
              box-sizing: border-box;
              color: #333;
            }
            .receipt-container {
              width: 100%;
              height: 100%;
              border: 1px solid #eee;
              padding: 30px;
              box-sizing: border-box;
              background-color: #ffffff;
              box-shadow: 0 0 15px rgba(0,0,0,0.05);
            }
            .header {
              text-align: center;
              padding-bottom: 25px;
              margin-bottom: 30px;
            }
            .school-logo {
              margin-bottom: 15px;
            }
            .school-name {
              font-family: 'Playfair Display', serif;
              font-size: ${selectedSize === 'A3' ? '38px' : selectedSize === 'A4' ? '30px' : '24px'};
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 8px;
            }
            .school-details {
              font-size: ${selectedSize === 'A3' ? '16px' : selectedSize === 'A4' ? '13px' : '11px'};
              color: #7f8c8d;
              line-height: 1.6;
            }
            .receipt-title {
              font-size: ${selectedSize === 'A3' ? '32px' : selectedSize === 'A4' ? '24px' : '18px'};
              font-weight: bold;
              margin: 25px 0;
              text-align: center;
              color: #2c3e50;
              border-bottom: 2px solid #ddd;
              padding-bottom: 15px;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 25px;
              margin-top: 30px;
              padding: 15px 0;
              border-bottom: 1px dashed #ccc;
              border-top: 1px dashed #ccc;
            }
            .detail-item {
              margin-bottom: 10px;
            }
            .detail-label {
              font-weight: 600;
              font-size: ${selectedSize === 'A3' ? '17px' : selectedSize === 'A4' ? '14px' : '12px'};
              color: #555;
              margin-bottom: 3px;
            }
            .detail-value {
              font-size: ${selectedSize === 'A3' ? '18px' : selectedSize === 'A4' ? '15px' : '13px'};
              color: #333;
            }
            .amount-summary {
              background-color: #f8f9fa;
              padding: 25px 20px;
              margin: 30px 0;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #e0e0e0;
            }
            .amount-label-main {
              font-size: ${selectedSize === 'A3' ? '24px' : selectedSize === 'A4' ? '18px' : '16px'};
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 10px;
            }
            .amount-value-main {
              font-size: ${selectedSize === 'A3' ? '48px' : selectedSize === 'A4' ? '38px' : '30px'};
              font-weight: bold;
              color: #28a745;
              margin-bottom: 15px;
            }
            .amount-in-words {
              font-size: ${selectedSize === 'A3' ? '20px' : selectedSize === 'A4' ? '16px' : '14px'};
              font-style: italic;
              color: #555;
            }
            .balance-section {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px dashed #ccc;
              display: flex;
              justify-content: space-around;
              text-align: center;
            }
            .balance-item {
              flex: 1;
              padding: 10px;
            }
            .balance-label {
              font-size: ${selectedSize === 'A3' ? '16px' : selectedSize === 'A4' ? '13px' : '11px'};
              font-weight: 600;
              color: #555;
            }
            .balance-value {
              font-size: ${selectedSize === 'A3' ? '22px' : selectedSize === 'A4' ? '18px' : '16px'};
              font-weight: bold;
              color: #d9534f;
              margin-top: 5px;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-around;
              text-align: center;
            }
            .signature-box {
              width: 45%;
              padding-top: 20px;
            }
            .signature-line {
              border-top: 1px solid #aaa;
              margin-top: 40px;
              padding-top: 10px;
              font-size: ${selectedSize === 'A3' ? '15px' : selectedSize === 'A4' ? '12px' : '10px'};
              color: #666;
            }
            .footer {
              margin-top: 60px;
              text-align: center;
              font-size: ${selectedSize === 'A3' ? '13px' : selectedSize === 'A4' ? '10px' : '9px'};
              color: #888;
              line-height: 1.5;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .receipt-container { box-shadow: none; border: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="school-logo">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="#2c3e50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 2V22" stroke="#2c3e50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M17 7L7 17" stroke="#2c3e50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 7L17 17" stroke="#2c3e50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="school-name">${receipt.schoolName}</div>
              <div class="school-details">
                P.O. BOX 70420-00400, NAIROBI<br/>
                CELL: 0723675441<br/>
                www.your-school-website.com
              </div>
            </div>
            
            <div class="receipt-title">OFFICIAL FEE RECEIPT</div>
            
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Receipt No:</div>
                <div class="detail-value">${receipt.receiptNumber}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Date:</div>
                <div class="detail-value">${formatDate(receipt.paymentDate)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Student Name:</div>
                <div class="detail-value">${receipt.studentName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Student ID:</div>
                <div class="detail-value">${receipt.studentId}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Payment Method:</div>
                <div class="detail-value">${receipt.paymentMethod.toUpperCase()}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Reference No:</div>
                <div class="detail-value">${receipt.referenceNumber}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Class/Grade:</div>
                <div class="detail-value">N/A</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Term/Year:</div>
                <div class="detail-value">N/A</div>
              </div>
            </div>
            
            <div class="amount-summary">
              <div class="amount-label-main">TOTAL AMOUNT PAID</div>
              <div class="amount-value-main">${formatCurrency(receipt.amount)}</div>
              <div class="amount-in-words">${convertAmountToWords(receipt.amount)}</div>
            </div>

            <div class="balance-section">
              <div class="balance-item">
                <div class="balance-label">Previous Balance:</div>
                <div class="balance-value">KShs 0.00</div>
              </div>
              <div class="balance-item">
                <div class="balance-label">Current Balance:</div>
                <div class="balance-value">KShs 0.00</div>
              </div>
            </div>

            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line">Parent/Guardian Signature</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">Authorized Signatory</div>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your payment. This is an official receipt from ${receipt.schoolName}.</p>
              <p>For any inquiries, please contact us at 0723675441 or visit www.your-school-website.com.</p>
              <p>Generated on ${formatDate(new Date().toISOString())} | Receipt ID: ${receipt.id}</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const downloadReceipt = (format: 'pdf' | 'html') => {
    const html = generateReceiptHTML()
    
    if (format === 'html') {
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${receipt.receiptNumber}-${selectedSize}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Receipt Downloaded",
        description: `Receipt ${receipt.receiptNumber} downloaded in ${selectedSize} format`,
      })
    } else {
      // For PDF, we'll use browser print functionality
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const copyReceiptNumber = () => {
    navigator.clipboard.writeText(receipt.receiptNumber)
    toast({
      title: "Copied!",
      description: "Receipt number copied to clipboard",
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Receipt Generator</span>
          </div>
          <Badge variant="outline" className="font-mono">
            {receipt.receiptNumber}
          </Badge>
        </CardTitle>
        <CardDescription>
          Generate and download receipts in different formats and sizes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Receipt Preview */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-3">Receipt Preview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Student:</span> {receipt.studentName}
            </div>
            <div>
              <span className="font-medium">Amount:</span> {formatCurrency(receipt.amount)}
            </div>
            <div>
              <span className="font-medium">Payment Method:</span> {receipt.paymentMethod}
            </div>
            <div>
              <span className="font-medium">Date:</span> {formatDate(receipt.paymentDate)}
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Paper Size:</span>
            <Select value={selectedSize} onValueChange={(value: 'A3' | 'A4' | 'A5') => setSelectedSize(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A3">A3</SelectItem>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="A5">A5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copyReceiptNumber}
            className="flex items-center space-x-1"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Receipt #</span>
          </Button>
        </div>

        {/* Download Options */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => downloadReceipt('html')}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download HTML ({selectedSize})</span>
          </Button>
          
          <Button
            onClick={() => downloadReceipt('pdf')}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print/Save PDF ({selectedSize})</span>
          </Button>
        </div>

        {/* Size Information */}
        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
          <p><strong>Paper Size Information:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><strong>A3:</strong> 297mm × 420mm - Large format, suitable for detailed receipts</li>
            <li><strong>A4:</strong> 210mm × 297mm - Standard size, most commonly used</li>
            <li><strong>A5:</strong> 148mm × 210mm - Compact size, saves paper</li>
          </ul>
        </div>

        {onClose && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 