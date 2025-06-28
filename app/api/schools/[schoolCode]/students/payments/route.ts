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
      // Payment successful - no automatic promotion logic here
      // Promotions are now handled through the dedicated promotion system
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