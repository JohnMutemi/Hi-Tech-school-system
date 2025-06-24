export interface PaymentProvider {
  name: string
  type: 'semi_automated' | 'fully_integrated'
  isActive: boolean
  sandboxMode: boolean
  credentials: PaymentCredentials
  supportedMethods: PaymentMethod[]
  createdAt: string
  updatedAt: string
}

export interface PaymentCredentials {
  apiKey?: string
  secretKey?: string
  publicKey?: string
  webhookSecret?: string
  merchantId?: string
  businessShortCode?: string
  passkey?: string
  environment: 'sandbox' | 'production'
}

export interface PaymentMethod {
  id: string
  name: string
  type: 'mobile_money' | 'bank_transfer' | 'card' | 'cash' | 'check'
  provider: string
  isActive: boolean
  processingFee?: number
  processingFeeType?: 'percentage' | 'fixed'
  minAmount?: number
  maxAmount?: number
}

export interface PaymentRequest {
  id?: string
  studentId: string
  schoolCode: string
  amount: number
  currency?: string
  paymentMethod: 'mpesa' | 'manual'
  description?: string
  referenceNumber?: string
  callbackUrl?: string
  metadata?: Record<string, any>
  createdAt?: string
  expiresAt?: string
  status?: PaymentStatus
  // Additional fields for school fees
  feeType: string
  term: string
  academicYear: string
  phoneNumber?: string
  transactionId?: string
}

export interface Payment {
  id: string
  studentId: string
  schoolCode: string
  amount: number
  paymentMethod: 'mpesa' | 'manual'
  status: PaymentStatus
  feeType: string
  term: string
  academicYear: string
  reference: string
  phoneNumber?: string
  transactionId?: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentResponse {
  success: boolean
  paymentId?: string
  reference?: string
  transactionId?: string
  referenceNumber?: string
  status: PaymentStatus
  message: string
  redirectUrl?: string
  qrCode?: string
  checkoutUrl?: string
  metadata?: Record<string, any>
  data?: any
}

export interface PaymentWebhook {
  id: string
  provider: string
  event: string
  data: Record<string, any>
  signature?: string
  processed: boolean
  createdAt: string
}

export interface PaymentTransaction {
  id: string
  paymentRequestId: string
  provider: string
  providerTransactionId: string
  amount: number
  currency: string
  status: PaymentStatus
  paymentMethod: string
  metadata?: Record<string, any>
  processedAt?: string
  createdAt: string
}

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refunded'

export interface IntaSendConfig {
  apiKey: string
  publicKey: string
  environment: 'sandbox' | 'production'
  webhookSecret?: string
}

export interface DarajaConfig {
  consumerKey: string
  consumerSecret: string
  businessShortCode: string
  passkey: string
  environment: 'sandbox' | 'production'
  webhookSecret?: string
}

export interface PaymentProviderConfig {
  intasend?: IntaSendConfig
  daraja?: DarajaConfig
}

export interface SchoolPaymentSettings {
  schoolId: string
  defaultProvider: string
  providers: PaymentProvider[]
  autoConfirmPayments: boolean
  requireApproval: boolean
  notificationSettings: {
    email: boolean
    sms: boolean
    webhook: boolean
  }
  createdAt: string
  updatedAt: string
} 