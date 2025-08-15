import { PrismaClient } from '@prisma/client'
import { feeBalanceService } from './fee-balance-service'
import { EmailService } from './email-service'

const prisma = new PrismaClient()

interface CreatePaymentParams {
  studentId: string
  schoolCode: string
  amount: number
  paymentMethod: string
  phoneNumber?: string
  feeType: string
  term: string
  academicYear: string
  transactionId?: string
}

interface PaymentResult {
  success: boolean
  message: string
  paymentId?: string
  receiptNumber?: string
  transactionId?: string
  referenceNumber?: string
  status?: string
  metadata?: any
}

class PaymentService {
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    try {
      const {
        studentId,
        schoolCode,
        amount,
        paymentMethod,
        phoneNumber,
        feeType,
        term,
        academicYear,
        transactionId
      } = params

      // Get school
      const school = await prisma.school.findUnique({
        where: { code: schoolCode.toLowerCase() }
      })

      if (!school) {
        return {
          success: false,
          message: 'School not found'
        }
      }

      // Get student
      const student = await prisma.student.findFirst({
        where: {
          id: studentId,
          schoolId: school.id,
          isActive: true
        }
      })

      if (!student) {
        return {
          success: false,
          message: 'Student not found'
        }
      }

      // Process payment using fee balance service
      const result = await feeBalanceService.recordPayment(
        studentId,
        amount,
        academicYear,
        term,
        paymentMethod,
        'System',
        `${feeType} payment`,
        transactionId
      )

      // Send email notification if parent email exists
      try {
        const emailService = new EmailService();
        await emailService.sendPaymentNotificationForPayment(
          result.payment.id,
          schoolCode
        );
        console.log('Email notification sent for payment:', result.payment.id);
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the payment if email fails
      }

      return {
        success: true,
        message: 'Payment processed successfully',
        paymentId: result.payment.id,
        receiptNumber: result.receipt.receiptNumber,
        referenceNumber: result.payment.referenceNumber
      }
    } catch (error) {
      console.error('Payment creation error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Payment processing failed'
      }
    }
  }

  async verifyDarajaPayment(checkoutRequestId: string): Promise<PaymentResult> {
    try {
      // This is a mock implementation for development
      // In production, you would call the actual Daraja API to verify the payment
      
      // For now, we'll simulate a successful verification
      const transactionId = `TXN${Date.now()}`
      const referenceNumber = `REF${Date.now()}`

      return {
        success: true,
        message: 'Payment verified successfully',
        transactionId,
        referenceNumber,
        status: 'COMPLETED',
        metadata: {
          checkoutRequestId,
          verifiedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      return {
        success: false,
        message: 'Payment verification failed'
      }
    }
  }

  async processDarajaWebhook(payload: any): Promise<PaymentResult> {
    try {
      console.log('Processing Daraja webhook:', payload)

      // This is a mock implementation for development
      // In production, you would process the actual webhook payload
      
      // For now, we'll simulate successful webhook processing
      return {
        success: true,
        message: 'Webhook processed successfully',
        metadata: {
          payload,
          processedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Webhook processing error:', error)
      return {
        success: false,
        message: 'Webhook processing failed'
      }
    }
  }
}

export const paymentService = new PaymentService()
export default paymentService
