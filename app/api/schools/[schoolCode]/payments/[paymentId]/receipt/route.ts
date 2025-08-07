import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; paymentId: string } }
) {
  try {
    // Get payment with all related data
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: {
        student: {
          include: {
            user: true,
            class: {
              include: { grade: true }
            }
          }
        },
        school: true,
        academicYear: true,
        term: true,
        receipt: true,
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Verify school code matches
    if (payment.school.code !== params.schoolCode) {
      return NextResponse.json(
        { error: "School mismatch" },
        { status: 400 }
      );
    }

    // Generate receipt HTML content
    const receiptHtml = generateReceiptHTML(payment);

    // For now, return HTML content
    // In a real implementation, you would convert this to PDF using a library like puppeteer
    return new NextResponse(receiptHtml, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="receipt-${payment.receiptNumber}.html"`,
      },
    });

  } catch (error) {
    console.error("Error generating receipt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateReceiptHTML(payment: any): string {
  const receipt = payment.receipt;
  const student = payment.student;
  const school = payment.school;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${receipt.receiptNumber}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .school-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .receipt-title {
            font-size: 18px;
            opacity: 0.9;
        }
        .receipt-number {
            font-size: 14px;
            opacity: 0.8;
            margin-top: 10px;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .info-label {
            font-weight: 500;
            color: #6b7280;
        }
        .info-value {
            font-weight: 600;
            color: #1f2937;
        }
        .amount-highlight {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
            text-align: center;
            padding: 20px;
            background: #ecfdf5;
            border-radius: 8px;
            margin: 20px 0;
        }
        .balance-summary {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .balance-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .balance-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .balance-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        .balance-amount {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
        }
        .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        .overpayment-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            color: #92400e;
        }
        .carry-forward-notice {
            background: #dbeafe;
            border: 1px solid #3b82f6;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            color: #1e40af;
        }
        @media print {
            body { background: white; }
            .receipt-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <div class="school-name">${school.name}</div>
            <div class="receipt-title">Official Receipt</div>
            <div class="receipt-number">Receipt #${receipt.receiptNumber}</div>
        </div>
        
        <div class="content">
            <div class="section">
                <div class="section-title">Payment Information</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Receipt Number:</span>
                        <span class="info-value">${receipt.receiptNumber}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Payment Date:</span>
                        <span class="info-value">${formatDate(payment.paymentDate)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Payment Method:</span>
                        <span class="info-value">${payment.paymentMethod}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Reference Number:</span>
                        <span class="info-value">${payment.referenceNumber}</span>
                    </div>
                    ${payment.transactionId ? `
                    <div class="info-item">
                        <span class="info-label">Transaction ID:</span>
                        <span class="info-value">${payment.transactionId}</span>
                    </div>
                    ` : ''}
                    ${payment.phoneNumber ? `
                    <div class="info-item">
                        <span class="info-label">Phone Number:</span>
                        <span class="info-value">${payment.phoneNumber}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="section">
                <div class="section-title">Student Information</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Student Name:</span>
                        <span class="info-value">${student.name || student.user?.name || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Admission Number:</span>
                        <span class="info-value">${student.admissionNumber || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Class:</span>
                        <span class="info-value">${student.class?.name || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Academic Year:</span>
                        <span class="info-value">${payment.academicYear?.name || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Term:</span>
                        <span class="info-value">${payment.term?.name || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Fee Type:</span>
                        <span class="info-value">School Fees</span>
                    </div>
                </div>
            </div>

            <div class="amount-highlight">
                Amount Paid: ${formatCurrency(payment.amount)}
            </div>

            ${payment.overpaymentAmount > 0 ? `
            <div class="overpayment-notice">
                <strong>Overpayment Notice:</strong> An overpayment of ${formatCurrency(payment.overpaymentAmount)} 
                has been applied to the next term balance.
            </div>
            ` : ''}

            ${payment.carryForwardAmount > 0 ? `
            <div class="carry-forward-notice">
                <strong>Carry Forward:</strong> ${formatCurrency(payment.carryForwardAmount)} 
                has been carried forward to the next term.
            </div>
            ` : ''}

            <div class="section">
                <div class="section-title">Balance Summary</div>
                <div class="balance-summary">
                    <div class="balance-grid">
                        <div class="balance-item">
                            <div class="balance-label">Term Balance Before</div>
                            <div class="balance-amount">${formatCurrency(receipt.termOutstandingBefore || 0)}</div>
                        </div>
                        <div class="balance-item">
                            <div class="balance-label">Term Balance After</div>
                            <div class="balance-amount">${formatCurrency(receipt.termOutstandingAfter || 0)}</div>
                        </div>
                        <div class="balance-item">
                            <div class="balance-label">Academic Year Before</div>
                            <div class="balance-amount">${formatCurrency(receipt.academicYearOutstandingBefore || 0)}</div>
                        </div>
                        <div class="balance-item">
                            <div class="balance-label">Academic Year After</div>
                            <div class="balance-amount">${formatCurrency(receipt.academicYearOutstandingAfter || 0)}</div>
                        </div>
                    </div>
                </div>
            </div>

            ${receipt.feeBreakdown ? `
            <div class="section">
                <div class="section-title">Fee Breakdown</div>
                <div class="info-grid">
                    ${Array.isArray(receipt.feeBreakdown) ? receipt.feeBreakdown.map((fee: any) => `
                    <div class="info-item">
                        <span class="info-label">${fee.term} ${fee.year}:</span>
                        <span class="info-value">${formatCurrency(fee.totalAmount)}</span>
                    </div>
                    `).join('') : ''}
                </div>
            </div>
            ` : ''}
        </div>

        <div class="footer">
            <p>This is an official receipt from ${school.name}</p>
            <p>Generated on ${formatDate(new Date())}</p>
            <p>For any queries, please contact the school administration</p>
        </div>
    </div>
</body>
</html>
  `;
} 