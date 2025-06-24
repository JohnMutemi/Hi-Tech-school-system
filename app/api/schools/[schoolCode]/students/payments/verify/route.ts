import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/services/payment-service'

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const body = await req.json()
    const { checkoutRequestId } = body

    if (!checkoutRequestId) {
      return NextResponse.json(
        { error: 'Checkout request ID is required' },
        { status: 400 }
      )
    }

    // Verify the payment
    const result = await paymentService.verifyDarajaPayment(checkoutRequestId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
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
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
} 