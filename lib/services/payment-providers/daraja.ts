import { PaymentRequest, PaymentResponse, PaymentStatus, DarajaConfig } from '../../types/payment'

export class DarajaProvider {
  private config: DarajaConfig
  private baseUrl: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config: DarajaConfig) {
    this.config = config
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke'
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64')
    
    const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.errorMessage || 'Failed to get access token')
    }

    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Expire 1 minute early

    return this.accessToken
  }

  async createPaymentRequest(request: Omit<PaymentRequest, 'id' | 'status' | 'createdAt' | 'expiresAt'>): Promise<PaymentResponse> {
    try {
      const accessToken = await this.getAccessToken()
      
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
      const password = Buffer.from(`${this.config.businessShortCode}${this.config.passkey}${timestamp}`).toString('base64')

      const payload = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(request.amount),
        PartyA: request.metadata?.phoneNumber || '254700000000',
        PartyB: this.config.businessShortCode,
        PhoneNumber: request.metadata?.phoneNumber || '254700000000',
        CallBackURL: request.callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/daraja`,
        AccountReference: request.referenceNumber || `PAY-${Date.now()}`,
        TransactionDesc: request.description
      }

      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.errorMessage || 'Failed to create payment request')
      }

      return {
        success: true,
        transactionId: data.CheckoutRequestID,
        referenceNumber: data.MerchantRequestID,
        status: 'pending' as PaymentStatus,
        message: 'STK push sent successfully',
        metadata: {
          checkoutRequestId: data.CheckoutRequestID,
          merchantRequestId: data.MerchantRequestID,
          customerMessage: data.CustomerMessage
        }
      }
    } catch (error) {
      console.error('Daraja payment request error:', error)
      return {
        success: false,
        status: 'failed' as PaymentStatus,
        message: error instanceof Error ? error.message : 'Payment request failed'
      }
    }
  }

  async verifyPayment(checkoutRequestId: string): Promise<PaymentResponse> {
    try {
      const accessToken = await this.getAccessToken()
      
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
      const password = Buffer.from(`${this.config.businessShortCode}${this.config.passkey}${timestamp}`).toString('base64')

      const payload = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      }

      const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.errorMessage || 'Failed to verify payment')
      }

      const status = this.mapDarajaStatus(data.ResultCode)
      
      return {
        success: status === 'completed',
        transactionId: data.CheckoutRequestID,
        referenceNumber: data.MerchantRequestID,
        status,
        message: data.ResultDesc || `Payment ${status}`,
        metadata: {
          checkoutRequestId: data.CheckoutRequestID,
          merchantRequestId: data.MerchantRequestID,
          resultCode: data.ResultCode,
          resultDesc: data.ResultDesc
        }
      }
    } catch (error) {
      console.error('Daraja payment verification error:', error)
      return {
        success: false,
        status: 'failed' as PaymentStatus,
        message: error instanceof Error ? error.message : 'Payment verification failed'
      }
    }
  }

  async processWebhook(payload: any): Promise<PaymentResponse> {
    try {
      const status = this.mapDarajaStatus(payload.Body?.stkCallback?.ResultCode)
      
      return {
        success: status === 'completed',
        transactionId: payload.Body?.stkCallback?.CheckoutRequestID,
        referenceNumber: payload.Body?.stkCallback?.MerchantRequestID,
        status,
        message: `Webhook: Payment ${status}`,
        metadata: {
          checkoutRequestId: payload.Body?.stkCallback?.CheckoutRequestID,
          merchantRequestId: payload.Body?.stkCallback?.MerchantRequestID,
          resultCode: payload.Body?.stkCallback?.ResultCode,
          resultDesc: payload.Body?.stkCallback?.ResultDesc
        }
      }
    } catch (error) {
      console.error('Daraja webhook processing error:', error)
      return {
        success: false,
        status: 'failed' as PaymentStatus,
        message: error instanceof Error ? error.message : 'Webhook processing failed'
      }
    }
  }

  private mapDarajaStatus(resultCode: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      '0': 'completed',
      '1': 'pending',
      '2': 'failed',
      '1032': 'cancelled',
      '1037': 'expired'
    }
    return statusMap[resultCode] || 'pending'
  }

  getSupportedMethods() {
    return [
      {
        id: 'mobile_money',
        name: 'M-Pesa',
        type: 'mobile_money',
        provider: 'daraja',
        isActive: true,
        processingFee: 0,
        processingFeeType: 'fixed'
      }
    ]
  }
} 