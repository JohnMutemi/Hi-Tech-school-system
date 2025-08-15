import { NextRequest, NextResponse } from 'next/server'
import { darajaService } from '@/lib/services/daraja-service'

interface InitiateMpesaRequest {
  paymentMethodId: string
  studentId: string
  amount: number
  phoneNumber: string
  description?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    const body: InitiateMpesaRequest = await request.json()
    
    const { paymentMethodId, studentId, amount, phoneNumber, description } = body

    // Validate required fields
    if (!paymentMethodId || !studentId || !amount || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate phone number
    const phoneValidation = darajaService.validatePhoneNumber(phoneNumber)
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { error: phoneValidation.message },
        { status: 400 }
      )
    }

    // Get payment method configuration from database
    const paymentMethodResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/schools/${schoolCode}/payment-methods/${paymentMethodId}`)
    
    if (!paymentMethodResponse.ok) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    const paymentMethod = await paymentMethodResponse.json()

    // Verify this is a M-PESA STK Push method
    if (paymentMethod.methodType !== 'mpesa_stk_push') {
      return NextResponse.json(
        { error: 'Invalid payment method type for STK Push' },
        { status: 400 }
      )
    }

    // Validate school has configured M-PESA credentials
    if (!paymentMethod.configuration.businessShortCode || !paymentMethod.configuration.passkey) {
      return NextResponse.json(
        { error: 'School has not configured M-PESA credentials. Please contact the school administrator.' },
        { status: 400 }
      )
    }

    // Get student information for account reference
    const studentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/schools/${schoolCode}/students/${studentId}`)
    let accountReference = studentId
    
    if (studentResponse.ok) {
      const student = await studentResponse.json()
      accountReference = student.admissionNumber || studentId
    }
    
    // Add school prefix if configured
    if (paymentMethod.configuration.accountReference) {
      accountReference = `${paymentMethod.configuration.accountReference}_${accountReference}`
    }

    // Generate callback URL
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/schools/${schoolCode}/mpesa/callback`

    // Initiate STK Push using school-specific credentials
    const stkPushResult = await darajaService.initiateSTKPush({
      schoolConfig: {
        businessShortCode: paymentMethod.configuration.businessShortCode,
        passkey: paymentMethod.configuration.passkey
      },
      amount: Math.round(amount), // Ensure amount is a whole number
      phoneNumber: phoneNumber,
      accountReference: accountReference,
      transactionDesc: description || `School fees payment for ${accountReference}`,
      callbackUrl: callbackUrl
    })

    // Store the payment request in database for tracking
    const paymentRequest = {
      id: stkPushResult.CheckoutRequestID,
      merchantRequestID: stkPushResult.MerchantRequestID,
      schoolCode,
      studentId,
      paymentMethodId,
      amount,
      phoneNumber,
      accountReference,
      status: 'pending',
      description,
      createdAt: new Date().toISOString()
    }

    // You would save this to your database here
    console.log('Payment request created:', paymentRequest)

    return NextResponse.json({
      success: true,
      checkoutRequestID: stkPushResult.CheckoutRequestID,
      merchantRequestID: stkPushResult.MerchantRequestID,
      customerMessage: stkPushResult.CustomerMessage,
      responseCode: stkPushResult.ResponseCode
    })

  } catch (error: any) {
    console.error('M-PESA initiation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate M-PESA payment' },
      { status: 500 }
    )
  }
}
