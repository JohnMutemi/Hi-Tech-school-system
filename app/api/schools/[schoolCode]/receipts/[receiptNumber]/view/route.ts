import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - View receipt by receipt number
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

    // Prepare receipt data for the enhanced receipt component
    const receiptData = {
      receiptNumber: receipt.receiptNumber,
      paymentId: receipt.paymentId,
      studentId: receipt.student.id,
      schoolCode: school.code,
      amount: receipt.amount,
      paymentMethod: receipt.paymentMethod || 'Manual Payment',
      feeType: receipt.payment?.description || 'School Fees',
      term: receipt.payment?.term?.name || '',
      academicYear: receipt.payment?.academicYear?.name || '',
      reference: receipt.payment?.referenceNumber || '',
      phoneNumber: receipt.student.parent?.phone || '',
      transactionId: receipt.payment?.transactionId || '',
      status: receipt.payment?.status || 'COMPLETED',
      issuedAt: receipt.paymentDate,
      issuedBy: 'Bursar',
      schoolName: school.name,
      studentName: receipt.student.user.name,
      admissionNumber: receipt.student.admissionNumber || '',
      parentName: receipt.student.parent?.user?.name || '',
      currency: 'KES',
      termOutstandingBefore: receipt.termOutstandingBefore || 0,
      termOutstandingAfter: receipt.termOutstandingAfter || 0,
      academicYearOutstandingBefore: receipt.academicYearOutstandingBefore || 0,
      academicYearOutstandingAfter: receipt.academicYearOutstandingAfter || 0,
      carryForward: receipt.carryForward || 0
    }

    // Create HTML page with the enhanced receipt
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${receiptData.schoolName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .receipt-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border: 2px solid #f1f5f9;
            position: relative;
            overflow: hidden;
        }
        .curled-corner {
            position: absolute;
            top: 0;
            right: 0;
            width: 64px;
            height: 64px;
            overflow: hidden;
            pointer-events: none;
        }
        .curled-corner::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 32px;
            height: 32px;
            background: #e2e8f0;
            transform: rotate(45deg);
            transform-origin: bottom left;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
            border-radius: 12px 12px 0 0; 
            margin: -20px -20px 30px -20px;
            position: relative;
        }
        .success-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border: 2px solid #34d399;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .receipt-info {
            background: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            color: #64748b;
        }
        .content { 
            padding: 0 20px 30px 20px; 
        }
        .section {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            margin: 20px 0;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .section-header {
            padding: 15px 20px;
            font-weight: 600;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section-content {
            padding: 20px;
        }
        .student-section { border-left: 4px solid #3b82f6; }
        .student-section .section-header { background: #eff6ff; color: #1e40af; }
        .payment-section { border-left: 4px solid #10b981; }
        .payment-section .section-header { background: #ecfdf5; color: #047857; }
        .academic-section { border-left: 4px solid #8b5cf6; }
        .academic-section .section-header { background: #f3f4f6; color: #6d28d9; }
        .balance-section { border-left: 4px solid #f59e0b; }
        .balance-section .section-header { background: #fffbeb; color: #d97706; }
        .details-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            margin: 15px 0; 
        }
        .detail-item { 
            padding: 12px; 
            background: #f8fafc; 
            border-radius: 8px; 
            border: 1px solid #e2e8f0;
        }
        .detail-label { 
            font-weight: 600; 
            color: #64748b; 
            font-size: 12px; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .detail-value { 
            color: #1e293b; 
            margin-top: 4px; 
            font-weight: 600;
            font-size: 14px;
        }
        .amount-highlight {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-radius: 12px;
            margin: 20px 0;
            border: 2px solid #34d399;
        }
        .action-buttons {
            text-align: center;
            margin: 30px 0;
            padding: 30px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 12px;
            border: 2px solid #0ea5e9;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 5px;
            border-radius: 8px;
            font-weight: bold;
            text-decoration: none;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 14px;
        }
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        .btn-secondary {
            background: white;
            color: #3b82f6;
            border: 2px solid #3b82f6;
        }
        .btn-secondary:hover {
            background: #3b82f6;
            color: white;
        }
        .thank-you-section {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border: 2px solid #10b981;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
            text-align: center;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #64748b; 
            font-size: 12px;
            padding: 20px;
            border-top: 1px solid #e2e8f0;
        }
        @media (max-width: 600px) {
            .receipt-container { margin: 10px; }
            .details-grid { grid-template-columns: 1fr; }
            .header { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="curled-corner"></div>
        
        <div class="header">
            <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 12px; border-radius: 50%; margin-bottom: 15px;">🏫</div>
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${receiptData.schoolName}</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">School Code: ${receiptData.schoolCode}</p>
        </div>
        
        <div class="success-badge">
            <div style="font-size: 24px; margin-bottom: 10px;">✅</div>
            <div style="font-weight: bold; font-size: 18px; color: #047857;">Payment Successful</div>
            <div style="font-size: 20px; font-weight: bold; color: #065f46;">OFFICIAL RECEIPT</div>
        </div>
        
        <div class="receipt-info">
            <span>Receipt No: <strong style="color: #3b82f6;">${receiptData.receiptNumber}</strong></span>
            <span>Date: <strong>${new Date(receiptData.issuedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</strong></span>
        </div>
        
        <div class="content">
            <div class="amount-highlight">
                ${receiptData.currency} ${receiptData.amount.toLocaleString()}
            </div>
            
            <div class="section student-section">
                <div class="section-header">
                    <span style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;">👤</span>
                    Student Details
                </div>
                <div class="section-content">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Student Name</div>
                            <div class="detail-value">${receiptData.studentName}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Admission Number</div>
                            <div class="detail-value">${receiptData.admissionNumber || 'N/A'}</div>
                        </div>
                        ${receiptData.parentName ? `
                        <div class="detail-item">
                            <div class="detail-label">Parent/Guardian</div>
                            <div class="detail-value">${receiptData.parentName}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="section payment-section">
                <div class="section-header">
                    <span style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;">💳</span>
                    Payment Details
                </div>
                <div class="section-content">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Payment Method</div>
                            <div class="detail-value">${receiptData.paymentMethod}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Reference</div>
                            <div class="detail-value">${receiptData.reference || 'N/A'}</div>
                        </div>
                        ${receiptData.phoneNumber ? `
                        <div class="detail-item">
                            <div class="detail-label">Phone Number</div>
                            <div class="detail-value">${receiptData.phoneNumber}</div>
                        </div>
                        ` : ''}
                        ${receiptData.transactionId ? `
                        <div class="detail-item">
                            <div class="detail-label">Transaction ID</div>
                            <div class="detail-value">${receiptData.transactionId}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="section academic-section">
                <div class="section-header">
                    <span style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;">📅</span>
                    Academic Period
                </div>
                <div class="section-content">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Academic Year</div>
                            <div class="detail-value">${receiptData.academicYear || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Term</div>
                            <div class="detail-value">${receiptData.term || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Fee Type</div>
                            <div class="detail-value">${receiptData.feeType || 'School Fees'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Status</div>
                            <div class="detail-value" style="color: #10b981; font-weight: bold;">${receiptData.status}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section balance-section">
                <div class="section-header">
                    <span style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;">📊</span>
                    Balance Summary
                </div>
                <div class="section-content">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Term Balance (Before)</div>
                            <div class="detail-value">${receiptData.currency} ${receiptData.termOutstandingBefore.toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Term Balance (After)</div>
                            <div class="detail-value" style="color: ${receiptData.termOutstandingAfter <= 0 ? '#10b981' : '#f59e0b'};">
                                ${receiptData.currency} ${receiptData.termOutstandingAfter.toLocaleString()}
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Academic Year Balance (Before)</div>
                            <div class="detail-value">${receiptData.currency} ${receiptData.academicYearOutstandingBefore.toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Academic Year Balance (After)</div>
                            <div class="detail-value" style="color: ${receiptData.academicYearOutstandingAfter <= 0 ? '#10b981' : '#f59e0b'};">
                                ${receiptData.currency} ${receiptData.academicYearOutstandingAfter.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="action-buttons">
                <h3 style="margin: 0 0 15px 0; color: #0c4a6e;">Download Options</h3>
                <p style="margin: 0 0 20px 0; color: #0369a1;">Choose your preferred format for this receipt</p>
                <button onclick="downloadPDF('A4')" class="btn btn-primary">
                    📄 Download PDF (A4)
                </button>
                <button onclick="downloadPDF('A5')" class="btn btn-secondary">
                    📄 Download PDF (A5)
                </button>
                <button onclick="downloadText()" class="btn btn-secondary">
                    📝 Download Text
                </button>
                <button onclick="window.print()" class="btn btn-secondary">
                    🖨️ Print Receipt
                </button>
            </div>
            
            <div class="thank-you-section">
                <h3 style="margin: 0 0 10px 0; color: #047857;">Thank You for Your Payment!</h3>
                <p style="margin: 0; color: #065f46;">
                    We appreciate your prompt payment. This receipt serves as proof of payment for the above mentioned fees.
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>${receiptData.schoolName}</strong></p>
            <p><strong>Received By:</strong> ${receiptData.issuedBy}</p>
            <p><strong>Processed through:</strong> Bursar Portal</p>
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p>For any queries, please contact the school administration.</p>
            <p style="margin-top: 15px; font-size: 11px; color: #94a3b8;">
                Generated on ${new Date().toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </p>
        </div>
    </div>

    <script>
        function downloadPDF(format) {
            // Redirect to the PDF download endpoint
            window.open('/api/schools/${schoolCode}/receipts/${receiptNumber}/download?format=' + format, '_blank');
        }
        
        function downloadText() {
            const receiptText = \`
PAYMENT RECEIPT
${receiptData.schoolName}
School Code: ${receiptData.schoolCode}

Receipt Information
Receipt Number: ${receiptData.receiptNumber}
Payment ID: ${receiptData.paymentId}
Date & Time: ${new Date(receiptData.issuedAt).toLocaleDateString()}
Status: ${receiptData.status}

Student Information
Student Name: ${receiptData.studentName}
Admission Number: ${receiptData.admissionNumber || 'N/A'}
Parent Name: ${receiptData.parentName || 'N/A'}

Payment Details
Amount Paid: ${receiptData.currency} ${receiptData.amount.toLocaleString()}
Payment Method: ${receiptData.paymentMethod}
Fee Type: ${receiptData.feeType}
Term: ${receiptData.term}
Academic Year: ${receiptData.academicYear}
Reference: ${receiptData.reference || 'N/A'}

Balance Information
Term Balance (Before): ${receiptData.currency} ${receiptData.termOutstandingBefore.toLocaleString()}
Term Balance (After): ${receiptData.currency} ${receiptData.termOutstandingAfter.toLocaleString()}
Academic Year Balance (Before): ${receiptData.currency} ${receiptData.academicYearOutstandingBefore.toLocaleString()}
Academic Year Balance (After): ${receiptData.currency} ${receiptData.academicYearOutstandingAfter.toLocaleString()}

Issued by: ${receiptData.issuedBy}
Processed through: Bursar Portal
This is a computer-generated receipt and does not require a signature.
            \`;
            
            const blob = new Blob([receiptText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`receipt-\${receiptData.receiptNumber}.txt\`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
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
