import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - View receipt by receipt number (exactly like bursar dashboard modal)
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; receiptNumber: string } }
) {
  try {
    const { schoolCode, receiptNumber } = params

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    })

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    // Find the receipt
    const receipt = await prisma.receipt.findFirst({
      where: {
        receiptNumber,
        student: {
          schoolId: school.id
        }
      },
      include: {
        student: {
          include: {
            user: true,
            parent: true
          }
        },
        payment: {
          include: {
            academicYear: true,
            term: true
          }
        }
      }
    })

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      )
    }

    // Prepare receipt data
    const receiptData = {
      receiptNumber: receipt.receiptNumber,
      studentName: receipt.student.user.name,
      studentId: receipt.student.id,
      amount: receipt.amount,
      paymentDate: receipt.paymentDate,
      paymentMethod: receipt.paymentMethod || 'Manual Payment',
      academicYear: receipt.payment?.academicYear?.name || '',
      term: receipt.payment?.term?.name || '',
      schoolName: school.name,
      schoolCode: school.code,
      balanceBefore: receipt.academicYearOutstandingBefore || 0,
      balanceAfter: receipt.academicYearOutstandingAfter || 0,
      feeType: receipt.payment?.description || 'Fee Payment',
      admissionNumber: receipt.student.admissionNumber,
      parentName: receipt.student.parent?.user?.name,
      currency: 'KES',
      status: receipt.payment?.status || 'COMPLETED',
      issuedBy: 'Bursar',
      reference: receipt.payment?.referenceNumber,
      transactionId: receipt.payment?.transactionId,
      termOutstandingBefore: receipt.termOutstandingBefore,
      termOutstandingAfter: receipt.termOutstandingAfter,
      academicYearOutstandingBefore: receipt.academicYearOutstandingBefore,
      academicYearOutstandingAfter: receipt.academicYearOutstandingAfter,
      carryForward: receipt.carryForward || 0,
      paymentId: receipt.payment?.id || receipt.id,
      issuedAt: receipt.createdAt
    }

    // Get download URLs for different formats
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yoursite.com'
    const downloadUrls = {
      A3: `${baseUrl}/api/schools/${schoolCode}/receipts/${receiptNumber}/download?size=A3`,
      A4: `${baseUrl}/api/schools/${schoolCode}/receipts/${receiptNumber}/download?size=A4`,
      A5: `${baseUrl}/api/schools/${schoolCode}/receipts/${receiptNumber}/download?size=A5`
    }

    // Create HTML page that exactly replicates the bursar dashboard modal experience
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt - ${receiptData.schoolName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: rgba(0, 0, 0, 0.5);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .modal-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .modal-header {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-bottom: 1px solid #e2e8f0;
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .download-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .download-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 500;
            border: 1px solid;
            border-radius: 6px;
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .btn-a3 {
            background: white;
            border-color: #3b82f6;
            color: #1d4ed8;
        }
        
        .btn-a3:hover {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .btn-a4 {
            background: white;
            border-color: #10b981;
            color: #047857;
        }
        
        .btn-a4:hover {
            background: #d1fae5;
            color: #065f46;
        }
        
        .btn-a5 {
            background: white;
            border-color: #8b5cf6;
            color: #7c3aed;
        }
        
        .btn-a5:hover {
            background: #ede9fe;
            color: #6d28d9;
        }
        
        .btn-txt {
            background: white;
            border-color: #6b7280;
            color: #4b5563;
        }
        
        .btn-txt:hover {
            background: #f9fafb;
            color: #374151;
        }
        
        .btn-print {
            background: white;
            border-color: #f59e0b;
            color: #d97706;
        }
        
        .btn-print:hover {
            background: #fef3c7;
            color: #b45309;
        }
        
        .modal-content {
            flex: 1;
            overflow-y: auto;
            padding: 0;
        }
        
        .receipt-container {
            background: white;
            padding: 40px;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .receipt-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 8px;
        }
        
        .receipt-title {
            font-size: 18px;
            font-weight: 600;
            color: #059669;
            margin-bottom: 8px;
        }
        
        .receipt-number {
            font-size: 14px;
            color: #64748b;
        }
        
        .receipt-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .info-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .info-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 12px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .info-label {
            font-weight: 500;
            color: #64748b;
        }
        
        .info-value {
            font-weight: 500;
            color: #1e293b;
        }
        
        .amount-section {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        
        .amount-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 4px;
        }
        
        .amount-value {
            font-size: 28px;
            font-weight: bold;
        }
        
        .balance-section {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            margin: 20px 0;
        }
        
        .balance-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .balance-row:last-child {
            margin-bottom: 0;
            padding-top: 8px;
            border-top: 1px solid #cbd5e1;
            font-weight: 600;
        }
        
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
        }
        
        @media (max-width: 768px) {
            .modal-container {
                margin: 10px;
                max-height: 95vh;
            }
            
            .download-actions {
                justify-content: center;
            }
            
            .receipt-info {
                grid-template-columns: 1fr;
            }
            
            .receipt-container {
                padding: 20px;
            }
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .modal-container {
                box-shadow: none;
                max-width: none;
                max-height: none;
            }
            
            .modal-header {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="modal-container">
        <!-- Header with download buttons (exactly like bursar dashboard) -->
        <div class="modal-header">
            <div class="modal-title">
                🧾 Payment Receipt
            </div>
            <div class="download-actions">
                <a href="${downloadUrls.A3}" class="download-btn btn-a3" download>
                    📄 A3
                </a>
                <a href="${downloadUrls.A4}" class="download-btn btn-a4" download>
                    📄 A4
                </a>
                <a href="${downloadUrls.A5}" class="download-btn btn-a5" download>
                    📄 A5
                </a>
                <a href="#" class="download-btn btn-txt" onclick="downloadTXT(); return false;">
                    📄 TXT
                </a>
                <a href="#" class="download-btn btn-print" onclick="window.print(); return false;">
                    🖨️ Print
                </a>
            </div>
        </div>
        
        <!-- Receipt content (exactly like bursar dashboard) -->
        <div class="modal-content">
            <div class="receipt-container" id="receipt-content">
                <div class="receipt-header">
                    <div class="school-name">${receiptData.schoolName}</div>
                    <div class="receipt-title">PAYMENT RECEIPT</div>
                    <div class="receipt-number">Receipt #: ${receiptData.receiptNumber}</div>
                </div>
                
                <div class="receipt-info">
                    <div class="info-section">
                        <div class="info-title">Student Information</div>
                        <div class="info-row">
                            <span class="info-label">Name:</span>
                            <span class="info-value">${receiptData.studentName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Admission No:</span>
                            <span class="info-value">${receiptData.admissionNumber || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Parent/Guardian:</span>
                            <span class="info-value">${receiptData.parentName || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-title">Payment Details</div>
                        <div class="info-row">
                            <span class="info-label">Date:</span>
                            <span class="info-value">${new Date(receiptData.paymentDate).toLocaleDateString()}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Method:</span>
                            <span class="info-value">${receiptData.paymentMethod}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Reference:</span>
                            <span class="info-value">${receiptData.reference || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="amount-section">
                    <div class="amount-label">Amount Paid</div>
                    <div class="amount-value">${receiptData.currency} ${receiptData.amount.toLocaleString()}</div>
                </div>
                
                <div class="receipt-info">
                    <div class="info-section">
                        <div class="info-title">Academic Information</div>
                        <div class="info-row">
                            <span class="info-label">Academic Year:</span>
                            <span class="info-value">${receiptData.academicYear}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Term:</span>
                            <span class="info-value">${receiptData.term}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Fee Type:</span>
                            <span class="info-value">${receiptData.feeType}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-title">Transaction Details</div>
                        <div class="info-row">
                            <span class="info-label">Status:</span>
                            <span class="info-value" style="color: #059669; font-weight: 600;">${receiptData.status}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Issued By:</span>
                            <span class="info-value">${receiptData.issuedBy}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Transaction ID:</span>
                            <span class="info-value">${receiptData.transactionId || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="balance-section">
                    <div class="info-title" style="margin-bottom: 12px;">Balance Information</div>
                    <div class="balance-row">
                        <span>Outstanding Before Payment:</span>
                        <span>${receiptData.currency} ${(receiptData.academicYearOutstandingBefore || 0).toLocaleString()}</span>
                    </div>
                    <div class="balance-row">
                        <span>Amount Paid:</span>
                        <span>${receiptData.currency} ${receiptData.amount.toLocaleString()}</span>
                    </div>
                    <div class="balance-row">
                        <span>Outstanding After Payment:</span>
                        <span>${receiptData.currency} ${(receiptData.academicYearOutstandingAfter || 0).toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <p>This is a computer-generated receipt and does not require a signature.</p>
                    <p>Generated on: ${new Date().toLocaleDateString()} | ${receiptData.schoolName}</p>
                    <p>For queries, contact the school administration.</p>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function downloadTXT() {
            const content = \`
PAYMENT RECEIPT
===============

School: ${receiptData.schoolName}
Receipt Number: ${receiptData.receiptNumber}

STUDENT INFORMATION
-------------------
Name: ${receiptData.studentName}
Admission Number: ${receiptData.admissionNumber || 'N/A'}
Parent/Guardian: ${receiptData.parentName || 'N/A'}

PAYMENT DETAILS
---------------
Date: ${new Date(receiptData.paymentDate).toLocaleDateString()}
Amount: ${receiptData.currency} ${receiptData.amount.toLocaleString()}
Method: ${receiptData.paymentMethod}
Reference: ${receiptData.reference || 'N/A'}

ACADEMIC INFORMATION
--------------------
Academic Year: ${receiptData.academicYear}
Term: ${receiptData.term}
Fee Type: ${receiptData.feeType}

TRANSACTION DETAILS
-------------------
Status: ${receiptData.status}
Issued By: ${receiptData.issuedBy}
Transaction ID: ${receiptData.transactionId || 'N/A'}

BALANCE INFORMATION
-------------------
Outstanding Before: ${receiptData.currency} ${(receiptData.academicYearOutstandingBefore || 0).toLocaleString()}
Amount Paid: ${receiptData.currency} ${receiptData.amount.toLocaleString()}
Outstanding After: ${receiptData.currency} ${(receiptData.academicYearOutstandingAfter || 0).toLocaleString()}

Generated on: ${new Date().toLocaleDateString()}
${receiptData.schoolName}
This is a computer-generated receipt.
            \`;
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Receipt-${receiptData.receiptNumber}.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>
    `

    // Return HTML page
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (error) {
    console.error('Error viewing receipt:', error)
    return NextResponse.json(
      { error: 'Failed to view receipt' },
      { status: 500 }
    )
  }
}