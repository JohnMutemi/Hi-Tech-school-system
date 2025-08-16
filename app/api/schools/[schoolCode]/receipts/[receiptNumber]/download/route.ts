import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { generateReceiptPDF } from '@/lib/utils/receipt-generator'

const prisma = new PrismaClient()

// GET - Download receipt by receipt number
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
      phoneNumber: receipt.student.parent?.phone,
      transactionId: receipt.payment?.transactionId,
      termOutstandingBefore: receipt.termOutstandingBefore,
      termOutstandingAfter: receipt.termOutstandingAfter,
      academicYearOutstandingBefore: receipt.academicYearOutstandingBefore,
      academicYearOutstandingAfter: receipt.academicYearOutstandingAfter,
      carryForward: receipt.carryForward
    }

    console.log('Generating PDF with data:', JSON.stringify(receiptData, null, 2))

    // Generate PDF receipt
    const pdfBuffer = await generateReceiptPDF(receiptData)

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Receipt-${receiptNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error downloading receipt:', error)
    return NextResponse.json(
      { error: 'Failed to download receipt' },
      { status: 500 }
    )
  }
}
