import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/services/payment-service'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { schoolCode } = params
    const body = await req.json()
    const { 
      studentId, 
      paymentMethod, 
      amount, 
      phoneNumber, 
      feeType, 
      term, 
      academicYear,
      transactionId 
    } = body

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (paymentMethod === 'mpesa' && !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required for M-Pesa payments' },
        { status: 400 }
      )
    }

    if (paymentMethod === 'manual' && !transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required for manual payments' },
        { status: 400 }
      )
    }

    // Create payment using the new unified method
    const result = await paymentService.createPayment({
      studentId,
      schoolCode,
      amount,
      paymentMethod,
      phoneNumber,
      feeType: feeType || 'School Fees',
      term: term || 'Current',
      academicYear: academicYear || new Date().getFullYear().toString(),
      transactionId
    })

    if (result.success) {
      if (term === "Term 3") {
        // Fetch the student and school
        const student = await prisma.student.findUnique({ where: { id: studentId } })
        if (student) {
          // Check if all termly fees are paid for this academic year
          const requiredTerms = ["Term 1", "Term 2", "Term 3"];
          const payments = await prisma.payment.findMany({
            where: {
              studentId,
              // If you add a 'term' field to Payment, use: term: { in: requiredTerms },
              // For now, use description field to match the term
              description: { in: requiredTerms },
              // Optionally, filter by payment status if you add it (e.g., status: 'completed')
              // status: 'completed',
              // Optionally, filter by academicYear if you add it to Payment
              // academicYear: student.academicYear,
            },
          });
          const paidTerms = payments.map(p => p.description).filter(desc => requiredTerms.includes(desc));
          const allTermsPaid = requiredTerms.every(term => paidTerms.includes(term));

          // Fetch class progression for the school, or use default
          let classOrder: string[] = []
          try {
            const classes = await prisma.schoolClass.findMany({
              where: { schoolId: student.schoolId },
              orderBy: { order: 'asc' },
              select: { name: true }
            })
            if (classes.length > 0) {
              classOrder = classes.map(c => c.name)
            } else {
              classOrder = [
                "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Form 1", "Form 2", "Form 3", "Form 4"
              ]
            }
          } catch (e) {
            classOrder = [
              "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Form 1", "Form 2", "Form 3", "Form 4"
            ]
          }
          const currentIndex = classOrder.indexOf(student.classLevel)
          // Only promote if not already at the last class, not already promoted for next year, and all terms paid
          if (currentIndex !== -1 && currentIndex < classOrder.length - 1 && allTermsPaid) {
            const nextClass = classOrder[currentIndex + 1]
            if (parseInt(student.academicYear) <= parseInt(academicYear)) {
              await prisma.student.update({
                where: { id: studentId },
                data: {
                  classLevel: nextClass,
                  academicYear: (parseInt(academicYear) + 1).toString(),
                },
              })
              // TODO: Log the promotion in PromotionLog table if exists
            }
          }
          // Optionally, handle graduation if at last class
          // else if (currentIndex === classOrder.length - 1) { ... }
        }
      }
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
} 