import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to convert numbers to words
function convertAmountToWords(amount: number): string {
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
}

// GET - View receipt by receipt number
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; receiptNumber: string } }
) {
  try {
    const { schoolCode, receiptNumber } = params

    // Get school first
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    })

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    // Get receipt with related data
    const receipt = await prisma.receipt.findUnique({
      where: { receiptNumber },
      include: {
        student: {
          include: {
            user: true,
            parent: {
              include: {
                user: true
              }
            }
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

    // Create HTML page with the unified receipt
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${receiptData.schoolName}</title>
    <style>
        body { 
            font-family: Inter, system-ui, sans-serif; 
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .receipt-container { 
            max-width: 700px; 
            margin: 0 auto; 
            background: white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border: 2px solid #e5e7eb;
            font-family: Inter, system-ui, sans-serif;
            min-height: 800px;
        }
        .header { 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 5px 0;
        }
        .header p {
            font-size: 12px;
            color: #dbeafe;
            margin: 2px 0;
        }
        .receipt-header {
            padding: 30px;
            border-bottom: 1px solid #e5e7eb;
        }
        .receipt-header h2 {
            font-size: 20px;
            font-weight: bold;
            color: #374151;
            margin: 0 0 10px 0;
        }
        .receipt-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            color: #6b7280;
            margin-top: 15px;
        }
        .status-badge {
            background: #dcfce7;
            color: #166534;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .content { 
            padding: 30px; 
        }
        .section {
            margin-bottom: 30px;
        }
        .section h3 {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin: 0 0 10px 0;
        }
        .section-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .amount-box {
            background: #f0fdf4;
            border: 2px solid #bbf7d0;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .amount-value {
            font-size: 28px;
            font-weight: bold;
            color: #166534;
        }
        .details-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            font-size: 14px;
        }
        .detail-item span {
            color: #6b7280;
            font-size: 12px;
        }
        .detail-item p {
            color: #374151;
            font-weight: 600;
            margin: 2px 0 0 0;
        }
        .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: end;
            padding-top: 40px;
        }
        .signature-area {
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #6b7280;
            width: 120px;
            margin: 0 auto 10px auto;
        }
        .footer { 
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            padding: 20px;
            text-align: center; 
            color: #6b7280; 
            font-size: 12px;
        }
        @media (max-width: 600px) {
            .receipt-container { margin: 10px; }
            .details-grid { grid-template-columns: 1fr; }
            .header { padding: 30px 20px; }
        }
        @media print {
            body { margin: 0; padding: 15px; background: white; }
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
        <div class="header">
            <h1>${receiptData.schoolName}</h1>
            <p>School Code: ${receiptData.schoolCode}</p>
            <p>📧 ${receiptData.schoolCode.toLowerCase()}@school.ac.ke | 📞 +254-XXX-XXXXXX</p>
        </div>
        
        <div class="receipt-header">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2>MONEY RECEIPT</h2>
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Receipt No: <strong style="color: #2563eb;">${receiptData.receiptNumber}</strong></p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Date: <strong>${new Date(receiptData.issuedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</strong></p>
                    <div style="margin-top: 10px;">
                        <span class="status-badge">✓ ${receiptData.status || 'PAID'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="content">
            <!-- Received From -->
            <div class="section">
                <h3>Received with thanks from:</h3>
                <div class="section-box">
                    <p style="font-size: 18px; font-weight: bold; color: #374151; margin: 0 0 5px 0;">${receiptData.studentName}</p>
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Admission No: ${receiptData.admissionNumber}</p>
                    ${receiptData.parentName ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Parent/Guardian: ${receiptData.parentName}</p>` : ''}

                </div>
            </div>

            <!-- Amount -->
            <div class="section">
                <h3>Amount:</h3>
                <div class="amount-box">
                    <div class="amount-value">${receiptData.currency} ${receiptData.amount.toLocaleString()}</div>
                </div>
            </div>

            <!-- In Words -->
            <div class="section">
                <h3>In words:</h3>
                <div class="section-box">
                    <p style="margin: 0; font-style: italic; color: #374151;">${convertAmountToWords(receiptData.amount)} ${receiptData.currency || 'Kenyan Shillings'} Only</p>
                </div>
            </div>

            <!-- For -->
            <div class="section">
                <h3>For:</h3>
                <div class="section-box">
                    <div class="details-grid">
                        <div class="detail-item">
                            <span>Fee Type:</span>
                            <p>${receiptData.feeType || 'School Fees'}</p>
                        </div>
                        <div class="detail-item">
                            <span>Academic Year:</span>
                            <p>${receiptData.academicYear || 'N/A'}</p>
                        </div>
                        <div class="detail-item">
                            <span>Term:</span>
                            <p>${receiptData.term || 'N/A'}</p>
                        </div>
                        <div class="detail-item">
                            <span>Payment Method:</span>
                            <p style="text-transform: capitalize;">${receiptData.paymentMethod.replace('_', ' ')}</p>
                        </div>
                    </div>
                    ${receiptData.reference ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                        <span style="color: #6b7280; font-size: 12px;">Reference:</span>
                        <p style="margin: 2px 0 0 0; font-family: monospace; font-size: 12px; word-break: break-all;">${receiptData.reference}</p>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Balance Information -->
            ${(receiptData.termOutstandingBefore !== undefined || receiptData.academicYearOutstandingBefore !== undefined) ? `
            <div class="section">
                <h3>Account Balance:</h3>
                <div class="section-box">
                    <div class="details-grid">
                        ${receiptData.termOutstandingBefore !== undefined ? `
                        <div class="detail-item">
                            <span>Term Balance Before:</span>
                            <p>${receiptData.currency} ${receiptData.termOutstandingBefore.toLocaleString()}</p>
                        </div>
                        <div class="detail-item">
                            <span>Term Balance After:</span>
                            <p style="color: ${receiptData.termOutstandingAfter <= 0 ? '#059669' : '#d97706'};">${receiptData.currency} ${receiptData.termOutstandingAfter?.toLocaleString() || '0'}</p>
                        </div>
                        ` : ''}
                        ${receiptData.academicYearOutstandingBefore !== undefined ? `
                        <div class="detail-item">
                            <span>Year Balance Before:</span>
                            <p>${receiptData.currency} ${receiptData.academicYearOutstandingBefore.toLocaleString()}</p>
                        </div>
                        <div class="detail-item">
                            <span>Year Balance After:</span>
                            <p style="color: ${receiptData.academicYearOutstandingAfter <= 0 ? '#059669' : '#d97706'};">${receiptData.currency} ${receiptData.academicYearOutstandingAfter?.toLocaleString() || '0'}</p>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${receiptData.carryForward && receiptData.carryForward > 0 ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; background: #eff6ff; padding: 15px; border-radius: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #1d4ed8; font-weight: 600; font-size: 14px;">Overpayment Carried Forward:</span>
                            <span style="color: #1d4ed8; font-weight: bold;">${receiptData.currency} ${receiptData.carryForward.toLocaleString()}</span>
                        </div>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #3b82f6;">Applied to next term fees</p>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            <!-- Bottom Section -->
            <div class="bottom-section">
                <div>
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Payment ID: <span style="font-family: monospace;">${receiptData.paymentId}</span></p>
                    ${receiptData.transactionId ? `<p style="margin: 0; font-size: 14px; color: #6b7280;">Transaction ID: <span style="font-family: monospace; font-size: 12px;">${receiptData.transactionId}</span></p>` : ''}
                </div>
                <div class="signature-area">
                    <div class="signature-line"></div>
                    <p style="margin: 0; font-size: 14px; font-weight: 600;">Money Receiver Sign</p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">${receiptData.issuedBy}</p>
                </div>
            </div>

            <!-- Download Section -->
            <div class="no-print" style="text-align: center; margin: 40px 0; padding: 20px; background: #f0f9ff; border-radius: 8px; border: 2px solid #0ea5e9;">
                <h3 style="margin: 0 0 15px; color: #0369a1;">📄 Download Options</h3>
                <a href="/api/schools/${receiptData.schoolCode}/receipts/${receiptData.receiptNumber}/download" style="display: inline-block; padding: 10px 20px; margin: 5px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Download PDF</a>
                <button onclick="window.print()" style="display: inline-block; padding: 10px 20px; margin: 5px; background: white; color: #2563eb; border: 2px solid #2563eb; border-radius: 6px; font-weight: 600; cursor: pointer;">Print Receipt</button>
            </div>
        </div>
        
        <div class="footer">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p>For queries, contact the school administration | Generated: ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
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

