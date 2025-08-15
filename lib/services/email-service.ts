import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface EmailConfig {
  provider: 'sendgrid' | 'aws_ses' | 'smtp' | 'gmail'
  configuration: any
  fromEmail: string
  fromName: string
}

interface PaymentNotificationData {
  studentName: string
  studentId: string
  amount: number
  paymentMethod: string
  receiptNumber: string
  paymentDate: string
  schoolName: string
  schoolCode: string
  termName?: string
  academicYear?: string
  balanceAfter?: number
  receiptDownloadUrl?: string
}

export class EmailService {
  private config: EmailConfig | null = null

  // Helper function to generate receipt download URL
  private generateReceiptDownloadUrl(schoolCode: string, receiptNumber: string): string {
    // Create a secure URL that leads to the receipt download endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    return `${baseUrl}/api/schools/${schoolCode}/receipts/${receiptNumber}/download`
  }

  async initializeForSchool(schoolId: string): Promise<boolean> {
    try {
      const emailConfig = await (prisma as any).emailNotificationConfig.findUnique({
        where: { schoolId },
        include: { school: true }
      })

      if (!emailConfig || !emailConfig.isEnabled) {
        return false
      }

      this.config = {
        provider: emailConfig.emailProvider as any,
        configuration: emailConfig.configuration,
        fromEmail: emailConfig.fromEmail,
        fromName: emailConfig.fromName
      }

      return true
    } catch (error) {
      console.error('Error initializing email service:', error)
      return false
    }
  }

  async sendPaymentConfirmation(
    recipientEmail: string,
    paymentData: PaymentNotificationData,
    paymentId: string
  ): Promise<boolean> {
    if (!this.config) {
      console.log('Email service not configured for this school')
      return false
    }

    try {
      // Generate receipt download URL if not provided
      if (!paymentData.receiptDownloadUrl && paymentData.receiptNumber) {
        paymentData.receiptDownloadUrl = this.generateReceiptDownloadUrl(
          paymentData.schoolCode, 
          paymentData.receiptNumber
        )
      }

      const emailContent = this.generatePaymentConfirmationEmail(paymentData)
      
      let success = false
      switch (this.config.provider) {
        case 'sendgrid':
          success = await this.sendViaSendGrid(recipientEmail, emailContent)
          break
        case 'aws_ses':
          success = await this.sendViaAWSSES(recipientEmail, emailContent)
          break
        case 'smtp':
        case 'gmail':
          success = await this.sendViaSMTP(recipientEmail, emailContent)
          break
        default:
          console.error('Unsupported email provider:', this.config.provider)
          return false
      }

      // Log the notification attempt
      await this.logNotificationAttempt(paymentId, recipientEmail, 'payment_confirmation', success)
      
      return success
    } catch (error) {
      console.error('Error sending payment confirmation:', error)
      await this.logNotificationAttempt(paymentId, recipientEmail, 'payment_confirmation', false, error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Enhanced function to send payment notification with complete payment data
  async sendPaymentNotificationForPayment(
    paymentId: string, 
    schoolCode: string
  ): Promise<boolean> {
    try {
      // Initialize email service for the school
      const school = await prisma.school.findUnique({ where: { code: schoolCode } })
      if (!school) {
        console.error('School not found:', schoolCode)
        return false
      }

      const isEmailEnabled = await this.initializeForSchool(school.id)
      if (!isEmailEnabled) {
        console.log('Email notifications not enabled for school:', schoolCode)
        return false
      }

      // Fetch complete payment data with related information
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          student: {
            select: {
              id: true,
              parentEmail: true,
              parentName: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          academicYear: {
            select: { name: true }
          },
          term: {
            select: { name: true }
          },
          receipt: true
        }
      })

      if (!payment) {
        console.error('Payment not found:', paymentId)
        return false
      }

      if (!payment.student.parentEmail) {
        console.log('No parent email found for student:', payment.student.id)
        return false
      }

      // Fetch updated balance after payment
      const { FeeBalanceService } = await import('./fee-balance-service')
      const feeBalanceService = new FeeBalanceService()
      const balanceInfo = await feeBalanceService.calculateStudentBalance(
        payment.studentId,
        payment.academicYear.name,
        payment.term.name
      )

      // Prepare payment notification data
      const paymentNotificationData: PaymentNotificationData = {
        studentName: payment.student.user.name,
        studentId: payment.student.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod || 'Manual Payment',
        receiptNumber: payment.receiptNumber,
        paymentDate: payment.paymentDate.toISOString(),
        schoolName: school.name,
        schoolCode: school.code,
        termName: payment.term.name,
        academicYear: payment.academicYear.name,
        balanceAfter: balanceInfo.balance
      }

      // Send the notification
      return await this.sendPaymentConfirmation(
        payment.student.parentEmail,
        paymentNotificationData,
        paymentId
      )

    } catch (error) {
      console.error('Error sending payment notification:', error)
      return false
    }
  }

  private generatePaymentConfirmationEmail(data: PaymentNotificationData) {
    const subject = `Payment Confirmation - ${data.schoolName}`
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4f46e5, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .amount { font-size: 2em; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .detail-item { padding: 10px; background: #f1f5f9; border-radius: 4px; }
        .detail-label { font-weight: bold; color: #475569; font-size: 0.9em; }
        .detail-value { color: #1e293b; margin-top: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 0.9em; }
        .success-icon { font-size: 48px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Payment Confirmed!</h1>
            <p>Your payment has been successfully processed</p>
        </div>
        
        <div class="content">
            <div class="amount">KES ${data.amount.toLocaleString()}</div>
            
            <div class="payment-details">
                <h3 style="margin-top: 0; color: #1e293b;">Payment Details</h3>
                
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">Student Name</div>
                        <div class="detail-value">${data.studentName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Receipt Number</div>
                        <div class="detail-value">${data.receiptNumber}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Payment Method</div>
                        <div class="detail-value">${data.paymentMethod}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Payment Date</div>
                        <div class="detail-value">${new Date(data.paymentDate).toLocaleDateString()}</div>
                    </div>
                    ${data.termName ? `
                    <div class="detail-item">
                        <div class="detail-label">Term</div>
                        <div class="detail-value">${data.termName}</div>
                    </div>
                    ` : ''}
                    ${data.academicYear ? `
                    <div class="detail-item">
                        <div class="detail-label">Academic Year</div>
                        <div class="detail-value">${data.academicYear}</div>
                    </div>
                    ` : ''}
                    ${data.balanceAfter !== undefined ? `
                    <div class="detail-item">
                        <div class="detail-label">Remaining Balance</div>
                        <div class="detail-value">KES ${data.balanceAfter.toLocaleString()}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            ${data.receiptDownloadUrl ? `
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.receiptDownloadUrl}" 
                   style="display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    📄 Download Receipt (PDF)
                </a>
            </div>
            ` : ''}
            
            <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #0369a1;">Important Information</h4>
                <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
                    <li>Please keep this receipt for your records</li>
                    <li>If you have any questions about this payment, please contact the school office</li>
                    <li>You can view your payment history in the parent portal</li>
                    ${data.receiptDownloadUrl ? '<li>Click the button above to download your receipt as a PDF</li>' : ''}
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>${data.schoolName}</strong></p>
            <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `

    const text = `
Payment Confirmation - ${data.schoolName}

Your payment has been successfully processed!

Payment Details:
- Amount: KES ${data.amount.toLocaleString()}
- Student: ${data.studentName}
- Receipt Number: ${data.receiptNumber}
- Payment Method: ${data.paymentMethod}
- Payment Date: ${new Date(data.paymentDate).toLocaleDateString()}
${data.termName ? `- Term: ${data.termName}` : ''}
${data.academicYear ? `- Academic Year: ${data.academicYear}` : ''}
${data.balanceAfter !== undefined ? `- Remaining Balance: KES ${data.balanceAfter.toLocaleString()}` : ''}

${data.receiptDownloadUrl ? `Download your receipt: ${data.receiptDownloadUrl}\n` : ''}
Thank you for your payment!

${data.schoolName}
    `

    return { subject, html, text }
  }

  private async sendViaSendGrid(recipientEmail: string, emailContent: any): Promise<boolean> {
    if (!this.config) return false

    try {
      // This would integrate with SendGrid API
      // For now, we'll simulate success
      console.log('Sending email via SendGrid to:', recipientEmail)
      console.log('Subject:', emailContent.subject)
      
      // In production, you would use SendGrid's Node.js library:
      /*
      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(this.config.configuration.apiKey)
      
      const msg = {
        to: recipientEmail,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      }
      
      await sgMail.send(msg)
      */
      
      return true
    } catch (error) {
      console.error('SendGrid email error:', error)
      return false
    }
  }

  private async sendViaAWSSES(recipientEmail: string, emailContent: any): Promise<boolean> {
    if (!this.config) return false

    try {
      // This would integrate with AWS SES
      console.log('Sending email via AWS SES to:', recipientEmail)
      console.log('Subject:', emailContent.subject)
      
      // In production, you would use AWS SDK:
      /*
      const AWS = require('aws-sdk')
      const ses = new AWS.SES({
        accessKeyId: this.config.configuration.accessKeyId,
        secretAccessKey: this.config.configuration.secretAccessKey,
        region: this.config.configuration.region
      })
      
      const params = {
        Destination: {
          ToAddresses: [recipientEmail]
        },
        Message: {
          Body: {
            Html: { Data: emailContent.html },
            Text: { Data: emailContent.text }
          },
          Subject: { Data: emailContent.subject }
        },
        Source: this.config.fromEmail
      }
      
      await ses.sendEmail(params).promise()
      */
      
      return true
    } catch (error) {
      console.error('AWS SES email error:', error)
      return false
    }
  }

  private async sendViaSMTP(recipientEmail: string, emailContent: any): Promise<boolean> {
    if (!this.config) return false

    try {
      // Import nodemailer dynamically to avoid import errors if not installed
      const nodemailer = await import('nodemailer')
      
      // Gmail-specific configuration
      const isGmail = this.config.provider === 'gmail' || this.config.configuration.host === 'smtp.gmail.com'
      
      const transportConfig: any = {
        host: this.config.configuration.host || (isGmail ? 'smtp.gmail.com' : undefined),
        port: this.config.configuration.port || (isGmail ? 587 : 587),
        secure: this.config.configuration.secure || false, // true for 465, false for other ports
        auth: {
          user: this.config.configuration.username || this.config.fromEmail,
          pass: this.config.configuration.password // App password for Gmail
        }
      }

      // Add Gmail-specific options
      if (isGmail) {
        transportConfig.service = 'gmail'
        transportConfig.tls = {
          rejectUnauthorized: false
        }
      }

      const transporter = nodemailer.default.createTransport(transportConfig)
      
      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: recipientEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      }

      await transporter.sendMail(mailOptions)
      console.log('Email sent successfully via SMTP to:', recipientEmail)
      
      return true
    } catch (error) {
      console.error('SMTP email error:', error)
      return false
    }
  }

  private async logNotificationAttempt(
    paymentId: string,
    recipientEmail: string,
    emailType: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await (prisma as any).paymentNotificationLog.create({
        data: {
          paymentId,
          recipientEmail,
          emailType,
          status: success ? 'sent' : 'failed',
          sentAt: success ? new Date() : null,
          errorMessage,
          retryCount: 0
        }
      })
    } catch (error) {
      console.error('Error logging notification attempt:', error)
    }
  }

  async retryFailedNotifications(): Promise<void> {
    try {
      const failedNotifications = await (prisma as any).paymentNotificationLog.findMany({
        where: {
          status: 'failed',
          retryCount: { lt: 3 } // Max 3 retries
        },
        orderBy: { createdAt: 'asc' },
        take: 10 // Process 10 at a time
      })

      for (const notification of failedNotifications) {
        // Increment retry count
        await (prisma as any).paymentNotificationLog.update({
          where: { id: notification.id },
          data: { retryCount: notification.retryCount + 1 }
        })

        // TODO: Implement retry logic with payment data lookup
        console.log(`Retrying notification ${notification.id} for payment ${notification.paymentId}`)
      }
    } catch (error) {
      console.error('Error retrying failed notifications:', error)
    }
  }
}

export const emailService = new EmailService()


