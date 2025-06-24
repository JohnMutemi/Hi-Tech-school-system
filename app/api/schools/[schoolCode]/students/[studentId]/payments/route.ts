import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/services/payment-service'

export async function POST(
  req: NextRequest,
  { params }: { params: { schoolCode: string; studentId: string } }
) {
  try {
    const { schoolCode, studentId } = params
    const body = await req.json()
    const { paymentType, amount, phoneNumber, description, paymentMethod, receivedBy } = body

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (paymentType === 'daraja' && !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required for M-Pesa payments' },
        { status: 400 }
      )
    }

    let result

    if (paymentType === 'daraja') {
      // Daraja API payment
      result = await paymentService.createDarajaPayment(
        schoolCode,
        studentId,
        {
          amount,
          phoneNumber,
          description,
          callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/daraja`
        }
      )

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Payment request created successfully',
          data: {
            transactionId: result.transactionId,
            referenceNumber: result.referenceNumber,
            status: result.status,
            message: result.message,
            metadata: result.metadata
          }
        })
      } else {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        )
      }
    } else {
      // Semi-automated payment
      result = await paymentService.createSemiAutomatedPayment(
        schoolCode,
        studentId,
        {
          amount,
          paymentMethod: paymentMethod || 'cash',
          description,
          receivedBy: receivedBy || 'Admin'
        }
      )

      return NextResponse.json({
        success: true,
        message: 'Payment recorded successfully',
        data: result
      })
    }
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolCode: string; studentId: string } }
) {
  try {
    const { studentId } = params

    // Get payment history
    const payments = await paymentService.getPaymentHistory(studentId)
    const pendingRequests = await paymentService.getPendingPaymentRequests(studentId)

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pendingRequests
      }
    })
  } catch (error) {
    console.error('Payment history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    )
  }
} 