import { NextRequest, NextResponse } from 'next/server'

interface CallbackMetadata {
  Item: Array<{
    Name: string
    Value: string | number
  }>
}

interface StkCallback {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResultCode: number
  ResultDesc: string
  CallbackMetadata?: CallbackMetadata
}

interface MpesaCallbackRequest {
  Body: {
    stkCallback: StkCallback
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    const body: MpesaCallbackRequest = await request.json()
    
    console.log('M-PESA Callback received:', JSON.stringify(body, null, 2))

    const { stkCallback } = body.Body
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback

    // Extract payment details from callback metadata
    let paymentDetails: any = {}
    
    if (CallbackMetadata && CallbackMetadata.Item) {
      CallbackMetadata.Item.forEach(item => {
        switch (item.Name) {
          case 'Amount':
            paymentDetails.amount = item.Value
            break
          case 'MpesaReceiptNumber':
            paymentDetails.mpesaReceiptNumber = item.Value
            break
          case 'TransactionDate':
            paymentDetails.transactionDate = item.Value
            break
          case 'PhoneNumber':
            paymentDetails.phoneNumber = item.Value
            break
          case 'Balance':
            paymentDetails.balance = item.Value
            break
        }
      })
    }

    // Update payment status in database
    const paymentUpdate = {
      checkoutRequestID: CheckoutRequestID,
      merchantRequestID: MerchantRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      status: ResultCode === 0 ? 'completed' : 'failed',
      mpesaReceiptNumber: paymentDetails.mpesaReceiptNumber,
      transactionDate: paymentDetails.transactionDate,
      amount: paymentDetails.amount,
      phoneNumber: paymentDetails.phoneNumber,
      updatedAt: new Date().toISOString()
    }

    // You would update your database here
    console.log('Payment update:', paymentUpdate)

    if (ResultCode === 0) {
      // Payment successful - create payment record and receipt
      console.log(`Payment successful: ${paymentDetails.mpesaReceiptNumber}`)
      
      // Here you would:
      // 1. Update student fee balance
      // 2. Create payment record
      // 3. Generate receipt
      // 4. Send confirmation SMS/email to parent
      // 5. Notify school admin

      // Example payment record structure:
      const paymentRecord = {
        id: paymentDetails.mpesaReceiptNumber,
        schoolCode,
        studentId: 'from_stored_request', // Get from stored payment request
        amount: paymentDetails.amount,
        paymentMethod: 'mpesa_lipa_na_mpesa',
        mpesaReceiptNumber: paymentDetails.mpesaReceiptNumber,
        transactionDate: paymentDetails.transactionDate,
        phoneNumber: paymentDetails.phoneNumber,
        status: 'completed',
        createdAt: new Date().toISOString()
      }

      console.log('Payment record to be created:', paymentRecord)

    } else {
      // Payment failed
      console.log(`Payment failed: ${ResultDesc}`)
    }

    // Always return success to M-PESA
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted"
    })

  } catch (error) {
    console.error('M-PESA callback error:', error)
    
    // Still return success to M-PESA to avoid retries
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted"
    })
  }
}






