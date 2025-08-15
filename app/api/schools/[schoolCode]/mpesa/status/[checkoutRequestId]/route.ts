import { NextRequest, NextResponse } from 'next/server'
import { darajaService } from '@/lib/services/daraja-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; checkoutRequestId: string } }
) {
  try {
    const { schoolCode, checkoutRequestId } = params

    // Get payment method configuration from database
    // In a real implementation, you'd get the payment method used for this request
    // For now, we'll assume the first Lipa Na M-PESA method
    const paymentMethodsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/schools/${schoolCode}/payment-methods`)
    
    if (!paymentMethodsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get payment configuration' },
        { status: 500 }
      )
    }

    // Query M-PESA API for status using global credentials
    const statusResult = await darajaService.querySTKPushStatus({
      checkoutRequestID: checkoutRequestId
    })

    // Process the status response
    let paymentDetails: any = {}
    if (statusResult.CallbackMetadata && statusResult.CallbackMetadata.Item) {
      statusResult.CallbackMetadata.Item.forEach((item: any) => {
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
        }
      })
    }

    const response = {
      checkoutRequestID: checkoutRequestId,
      resultCode: statusResult.ResultCode,
      resultDesc: statusResult.ResultDesc,
      status: statusResult.ResultCode === '0' ? 'completed' : 
              statusResult.ResultCode === '1032' ? 'cancelled' :
              statusResult.ResultCode === '1037' ? 'timeout' :
              statusResult.ResultCode === '1' ? 'insufficient_funds' :
              'failed',
      ...paymentDetails
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Payment status query error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check payment status' },
      { status: 500 }
    )
  }
}
