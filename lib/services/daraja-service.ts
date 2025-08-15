// Note: Using fetch instead of axios for better compatibility
// import axios from 'axios'

interface DarajaConfig {
  consumerKey: string
  consumerSecret: string
  environment: 'sandbox' | 'production'
}

interface SchoolMpesaConfig {
  businessShortCode: string
  passkey: string
  displayName?: string
  accountType?: 'paybill' | 'till' | 'buygoods'
  instructions?: string
}

interface MpesaPaymentConfig {
  phoneNumber: string
  amount: number
  accountReference: string
  transactionDesc: string
  callbackUrl: string
  paymentType?: 'paybill' | 'till' | 'buygoods'
}

interface STKPushRequest {
  BusinessShortCode: string
  Password: string
  Timestamp: string
  TransactionType: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline'
  Amount: number
  PartyA: string // Phone number
  PartyB: string // Business short code
  PhoneNumber: string
  CallBackURL: string
  AccountReference: string
  TransactionDesc: string
}

interface STKPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

class DarajaService {
  private config: DarajaConfig
  private baseURL: string

  constructor() {
    this.config = {
      consumerKey: process.env.DARAJA_CONSUMER_KEY!,
      consumerSecret: process.env.DARAJA_CONSUMER_SECRET!,
      environment: (process.env.DARAJA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    }
    
    this.baseURL = this.config.environment === 'sandbox' 
      ? 'https://sandbox.safaricom.co.ke' 
      : 'https://api.safaricom.co.ke'

    if (!this.config.consumerKey || !this.config.consumerSecret) {
      throw new Error('Daraja API credentials not configured. Please check DARAJA_CONSUMER_KEY and DARAJA_CONSUMER_SECRET environment variables.')
    }
  }

  /**
   * Get OAuth access token for Daraja API
   */
  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64')
      
      const response = await fetch(`${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`)
      }

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('Error getting Daraja access token:', error)
      throw new Error('Failed to authenticate with M-PESA API')
    }
  }

  /**
   * Generate password for STK Push
   */
  private generatePassword(businessShortCode: string, passkey: string, timestamp: string): string {
    const data = businessShortCode + passkey + timestamp
    return Buffer.from(data).toString('base64')
  }

  /**
   * Generate timestamp for API requests
   */
  private generateTimestamp(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    const second = String(now.getSeconds()).padStart(2, '0')
    
    return `${year}${month}${day}${hour}${minute}${second}`
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any spaces, dashes, or plus signs
    let formatted = phoneNumber.replace(/[\s\-\+]/g, '')
    
    // If it starts with 0, replace with 254
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1)
    }
    
    // If it doesn't start with 254, add it
    if (!formatted.startsWith('254')) {
      formatted = '254' + formatted
    }
    
    return formatted
  }

  /**
   * Initiate STK Push payment using school-specific credentials
   */
  async initiateSTKPush(params: {
    schoolConfig: SchoolMpesaConfig
    paymentConfig: MpesaPaymentConfig
  }): Promise<STKPushResponse> {
    try {
      const accessToken = await this.getAccessToken()
      const timestamp = this.generateTimestamp()
      const password = this.generatePassword(params.schoolConfig.businessShortCode, params.schoolConfig.passkey, timestamp)
      const formattedPhone = this.formatPhoneNumber(params.paymentConfig.phoneNumber)

      // Determine transaction type based on account type
      const transactionType = params.schoolConfig.accountType === 'till' || params.schoolConfig.accountType === 'buygoods' 
        ? 'CustomerBuyGoodsOnline' 
        : 'CustomerPayBillOnline'

      const requestData: STKPushRequest = {
        BusinessShortCode: params.schoolConfig.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: transactionType,
        Amount: params.paymentConfig.amount,
        PartyA: formattedPhone,
        PartyB: params.schoolConfig.businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: params.paymentConfig.callbackUrl,
        AccountReference: params.paymentConfig.accountReference,
        TransactionDesc: params.paymentConfig.transactionDesc
      }

      const response = await fetch(`${this.baseURL}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errorMessage || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error: any) {
      console.error('STK Push error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate M-PESA payment')
    }
  }

  /**
   * Query STK Push status using school-specific credentials
   */
  async querySTKPushStatus(params: {
    schoolConfig: SchoolMpesaConfig
    checkoutRequestID: string
  }): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()
      const timestamp = this.generateTimestamp()
      const password = this.generatePassword(params.schoolConfig.businessShortCode, params.schoolConfig.passkey, timestamp)

      const requestData = {
        BusinessShortCode: params.schoolConfig.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: params.checkoutRequestID
      }

      const response = await fetch(`${this.baseURL}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errorMessage || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error: any) {
      console.error('STK Push query error:', error.response?.data || error.message)
      throw new Error('Failed to query payment status')
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): { isValid: boolean; message?: string } {
    const formatted = this.formatPhoneNumber(phoneNumber)
    
    if (!/^254\d{9}$/.test(formatted)) {
      return {
        isValid: false,
        message: 'Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)'
      }
    }
    
    return { isValid: true }
  }

  /**
   * Initiate card payment through M-Pesa Global
   */
  async initiateCardPayment(params: {
    amount: number
    phoneNumber: string
    currency?: string
    reference: string
    description: string
    callbackUrl: string
  }): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()
      const formattedPhone = this.formatPhoneNumber(params.phoneNumber)

      const requestData = {
        Amount: params.amount,
        Currency: params.currency || 'KES',
        PhoneNumber: formattedPhone,
        Reference: params.reference,
        Description: params.description,
        CallBackURL: params.callbackUrl
      }

      const response = await fetch(`${this.baseURL}/mpesa/global/payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errorMessage || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error: any) {
      console.error('M-Pesa Global card payment error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate card payment')
    }
  }

  /**
   * Get available payment methods for a school
   */
  getPaymentMethods(schoolConfigs: SchoolMpesaConfig[]): Array<{
    id: string
    name: string
    type: string
    config: SchoolMpesaConfig
  }> {
    return schoolConfigs.map((config, index) => ({
      id: `mpesa_${index}`,
      name: config.displayName || `M-Pesa ${config.accountType || 'PayBill'}`,
      type: config.accountType || 'paybill',
      config
    }))
  }

  /**
   * Validate M-Pesa configuration
   */
  validateMpesaConfig(config: SchoolMpesaConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.businessShortCode || config.businessShortCode.trim() === '') {
      errors.push('Business short code is required')
    }

    if (!config.passkey || config.passkey.trim() === '') {
      errors.push('Passkey is required')
    }

    if (config.accountType === 'paybill' && !/^\d{5,7}$/.test(config.businessShortCode)) {
      errors.push('PayBill number should be 5-7 digits')
    }

    if (config.accountType === 'till' && !/^\d{5,7}$/.test(config.businessShortCode)) {
      errors.push('Till number should be 5-7 digits')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export const darajaService = new DarajaService()
export type { STKPushRequest, STKPushResponse, SchoolMpesaConfig, MpesaPaymentConfig }
