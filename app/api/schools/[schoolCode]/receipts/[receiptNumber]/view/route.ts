import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { jsonError } from "@/lib/api-guard"
import { assertStudentFeeAccess, resolvePortalFeeAuth } from '@/lib/portal-fee-auth'
import { verifyEmailDownloadToken } from '@/lib/email-download-token'

// GET - View receipt by receipt number (exactly like bursar dashboard modal)
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; receiptNumber: string } }
) {
  try {
    const { schoolCode, receiptNumber } = params

    const school = await prisma.school.findFirst({
      where: { code: { equals: schoolCode, mode: 'insensitive' } },
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

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const tokenPayload = verifyEmailDownloadToken(token)
    const tokenAuthorized =
      tokenPayload &&
      tokenPayload.schoolCode === school.code.toLowerCase() &&
      tokenPayload.studentId === receipt.studentId &&
      tokenPayload.receiptNumber === receipt.receiptNumber

    if (!tokenAuthorized) {
      const auth = await resolvePortalFeeAuth(request, schoolCode)
      const access = await assertStudentFeeAccess(auth, school.id, receipt.studentId)
      if (!access.ok) {
        return NextResponse.json({ error: access.message }, { status: access.status })
      }
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

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : ''
    const downloadUrls = {
      A3: `${baseUrl}/api/schools/${schoolCode}/receipts/${receiptNumber}/download?size=A3${tokenParam}`,
      A4: `${baseUrl}/api/schools/${schoolCode}/receipts/${receiptNumber}/download?size=A4${tokenParam}`,
      A5: `${baseUrl}/api/schools/${schoolCode}/receipts/${receiptNumber}/download?size=A5${tokenParam}`
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Receipt - ${receiptData.schoolName}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin:0; padding:16px; font-family: Arial, sans-serif; background:#f3f4f6; color:#111827; }
    .wrap { max-width: 980px; margin: 0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 16px 30px rgba(0,0,0,.12); }
    .actions { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-bottom:1px solid #e5e7eb; background:linear-gradient(to right,#f8fafc,#f1f5f9); }
    .title { font-weight:700; font-size:18px; }
    .btns { display:flex; gap:8px; flex-wrap:wrap; }
    .btn { text-decoration:none; padding:7px 10px; font-size:12px; border:1px solid #d1d5db; border-radius:6px; background:#fff; color:#111827; }
    .receipt { max-width:760px; margin:20px auto; border:1px solid #e5e7eb; box-shadow:0 8px 20px rgba(0,0,0,.08); }
    .head { padding:24px; border-bottom:2px solid #e5e7eb; display:flex; justify-content:space-between; }
    .school { font-size:28px; font-weight:800; }
    .meta { font-size:12px; color:#6b7280; margin-top:4px; }
    .pill { margin-top:8px; background:#ffedd5; color:#7c2d12; border-radius:8px; padding:8px 10px; font-size:12px; font-weight:700; }
    .bar { background:#111827; color:#fff; text-align:center; font-weight:800; letter-spacing:.02em; padding:10px 12px; font-size:24px; }
    .section { padding:20px; background:#f9fafb; border-bottom:1px solid #e5e7eb; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .k { font-size:11px; text-transform:uppercase; color:#4b5563; font-weight:700; margin-bottom:6px; }
    .v1 { font-size:30px; font-weight:800; }
    .v2 { font-size:14px; color:#4b5563; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:12px 10px; border-bottom:1px solid #f3f4f6; }
    th { text-align:left; color:#374151; border-bottom:2px solid #e5e7eb; }
    .total { background:#f97316; color:#fff; text-align:center; padding:14px; }
    .total .a { font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
    .total .b { font-size:32px; font-weight:800; }
    .words { padding:14px 18px; background:#f9fafb; border-top:1px solid #e5e7eb; }
    .foot { text-align:center; padding:16px; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280; }
    @media print { body { background:#fff; padding:0; } .actions { display:none; } .wrap,.receipt { box-shadow:none; border:none; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="actions">
      <div class="title">Payment Receipt</div>
      <div class="btns">
        <a class="btn" href="${downloadUrls.A3}" download>A3</a>
        <a class="btn" href="${downloadUrls.A4}" download>A4</a>
        <a class="btn" href="${downloadUrls.A5}" download>A5</a>
        <a class="btn" href="#" onclick="downloadTXT();return false;">TXT</a>
        <a class="btn" href="#" onclick="window.print();return false;">Print</a>
      </div>
    </div>

    <div class="receipt" id="receipt-content">
      <div class="head">
        <div>
          <div class="school">${receiptData.schoolName}</div>
          <div class="meta">${receiptData.schoolCode.toLowerCase()}@school.ac.ke</div>
        </div>
        <div style="text-align:right;">
          <div class="meta">Date</div>
          <div style="font-weight:700;">${new Date(receiptData.paymentDate).toLocaleDateString('en-GB')}</div>
          <div class="pill">RECEIPT NO: ${receiptData.receiptNumber}</div>
        </div>
      </div>

      <div class="bar">PAYMENT RECEIPT</div>

      <div class="section">
        <div>
          <div class="k">Received From</div>
          <div class="v1">${receiptData.studentName}</div>
          <div class="v2">Admission No: ${receiptData.admissionNumber || 'N/A'}</div>
          <div class="v2">Parent/Guardian: ${receiptData.parentName || 'N/A'}</div>
        </div>
        <div>
          <div class="k">Payment For</div>
          <div class="v1">${receiptData.feeType}</div>
          <div class="v2">${receiptData.academicYear} - ${receiptData.term}</div>
        </div>
      </div>

      <div style="padding:20px;">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:center;">Quantity</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight:700;">${receiptData.feeType}</div>
                <div style="font-size:13px;color:#6b7280;">${receiptData.academicYear} - ${receiptData.term}</div>
                <div style="font-size:12px;color:#6b7280;">Payment Method: ${String(receiptData.paymentMethod || '').replace('_', ' ')}</div>
              </td>
              <td style="text-align:center;">1</td>
              <td style="text-align:right;font-weight:700;">KES ${Number(receiptData.amount || 0).toLocaleString()}</td>
            </tr>
            <tr style="background:#f9fafb;">
              <td>
                <div style="font-weight:700;">Account Balance Summary</div>
                <div style="font-size:13px;color:#4b5563;">Term Balance: KES ${Number(receiptData.termOutstandingBefore || 0).toLocaleString()} -> KES ${Number(receiptData.termOutstandingAfter || 0).toLocaleString()}</div>
                <div style="font-size:13px;color:#4b5563;">Year Balance: KES ${Number(receiptData.academicYearOutstandingBefore || 0).toLocaleString()} -> KES ${Number(receiptData.academicYearOutstandingAfter || 0).toLocaleString()}</div>
              </td>
              <td style="text-align:center;color:#9ca3af;">-</td>
              <td style="text-align:right;color:#9ca3af;">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="total">
        <div class="a">Total Amount Paid</div>
        <div class="b">${receiptData.currency} ${Number(receiptData.amount || 0).toLocaleString()}</div>
      </div>
      <div class="words">
        <div style="font-size:11px;text-transform:uppercase;color:#6b7280;margin-bottom:6px;">Amount in words</div>
        <div style="font-size:13px;font-weight:700;font-style:italic;">${receiptData.currency} ${Number(receiptData.amount || 0).toLocaleString()} only</div>
      </div>
      <div class="foot">
        <div style="font-weight:700;color:#111827;margin-bottom:8px;">Thank you for your payment!</div>
        <div>Issued by: ${receiptData.issuedBy} | Generated: ${new Date().toLocaleDateString('en-GB')}</div>
      </div>
    </div>
  </div>

  <script>
    function downloadTXT() {
      const content = \`PAYMENT RECEIPT\\n===============================================\\nReceipt No: ${receiptData.receiptNumber}\\nDate: ${new Date(receiptData.paymentDate).toLocaleDateString('en-GB')}\\nStudent: ${receiptData.studentName}\\nAdmission No: ${receiptData.admissionNumber || 'N/A'}\\nAmount: ${receiptData.currency} ${Number(receiptData.amount || 0).toLocaleString()}\\nMethod: ${String(receiptData.paymentMethod || '').replace('_', ' ')}\\nYear/Term: ${receiptData.academicYear} - ${receiptData.term}\\n\`;
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
</html>`

    // Return HTML page
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (error) {
    console.error('Error viewing receipt:', error)
    return jsonError(error)
  }
}