import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/services/payment-service'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    
    console.log('Daraja webhook received:', payload)

    // Process the webhook
    const result = await paymentService.processDarajaWebhook(payload)

    if (result.success) {
      console.log('Webhook processed successfully:', result)
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook processed successfully' 
      })
    } else {
      console.error('Webhook processing failed:', result)
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle GET requests for webhook verification (if needed)
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Daraja webhook endpoint is active' 
  })
} 