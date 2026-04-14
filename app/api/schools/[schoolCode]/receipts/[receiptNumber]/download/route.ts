import { NextRequest, NextResponse } from 'next/server'
import { generateEnhancedReceiptPDF } from '@/lib/utils/enhanced-receipt-generator'
import { prisma } from "@/lib/prisma"
import { jsonError } from "@/lib/api-guard"
import { assertStudentFeeAccess, resolvePortalFeeAuth } from '@/lib/portal-fee-auth'
import { verifyEmailDownloadToken } from '@/lib/email-download-token'

// GET - Download receipt by receipt number
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; receiptNumber: string } }
) {
  try {
    const { schoolCode, receiptNumber } = params

    const { searchParams } = new URL(request.url)
    const size = searchParams.get('size') || 'A4' // Default to A4

    const school = await prisma.school.findFirst({
      where: { code: { equals: schoolCode, mode: 'insensitive' } },
    })
    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 })

    const token = searchParams.get('token')
    const tokenPayload = verifyEmailDownloadToken(token)
    const auth = await resolvePortalFeeAuth(request, schoolCode)

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

    const tokenAuthorized =
      tokenPayload &&
      tokenPayload.schoolCode === school.code.toLowerCase() &&
      tokenPayload.studentId === receipt.studentId &&
      tokenPayload.receiptNumber === receipt.receiptNumber

    if (!tokenAuthorized) {
      const access = await assertStudentFeeAccess(auth, school.id, receipt.studentId)
      if (!access.ok) {
        return NextResponse.json({ error: access.message }, { status: access.status })
      }
    }

    // Prepare receipt data for PDF generation
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
      description: receipt.payment?.description || 'Fee Payment',
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
      carryForward: receipt.carryForward
    }

    console.log('Generating PDF with data:', JSON.stringify(receiptData, null, 2))

    // Generate enhanced PDF receipt with specified size (same format as bursar)
    const pdfBuffer = await generateEnhancedReceiptPDF(receiptData, size as 'A3' | 'A4' | 'A5')

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Receipt-${receiptNumber}-${size}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error downloading receipt:', error)
    return jsonError(error)
  }
}
