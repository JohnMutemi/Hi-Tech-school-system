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
  balanceBefore?: number
  receiptDownloadUrl?: string
  admissionNumber?: string
  parentName?: string
  currency?: string
  status?: string
  issuedBy?: string
  reference?: string
  phoneNumber?: string
  transactionId?: string
  feeType?: string
  termOutstandingBefore?: number
  termOutstandingAfter?: number
  academicYearOutstandingBefore?: number
  academicYearOutstandingAfter?: number
  carryForward?: number
}

export class EmailService {
  private config: EmailConfig | null = null

  // Helper function to generate receipt view URL
  private generateReceiptViewUrl(schoolCode: string, receiptNumber: string): string {
    // Create a secure URL that leads to the receipt view endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    return `${baseUrl}/api/schools/${schoolCode}/receipts/${receiptNumber}/view`
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
      // Generate receipt view URL if not provided
      if (!paymentData.receiptDownloadUrl && paymentData.receiptNumber) {
        paymentData.receiptDownloadUrl = this.generateReceiptViewUrl(
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
            include: {
              user: true,
              parent: true
            }
          },
          academicYear: true,
          term: true,
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
        balanceAfter: balanceInfo.balance,
        balanceBefore: balanceInfo.balance + payment.amount, // Calculate balance before payment
        admissionNumber: payment.student.admissionNumber || undefined,
        parentName: payment.student.parentName || undefined,
        currency: 'KES',
        status: 'COMPLETED',
        issuedBy: 'Bursar',
        reference: payment.referenceNumber || undefined,
        phoneNumber: payment.student.parent?.phone || undefined,
        transactionId: undefined, // Not available in current schema
        feeType: payment.description || 'School Fees',
        termOutstandingBefore: balanceInfo.balance + payment.amount, // Use academic year balance as fallback
        termOutstandingAfter: balanceInfo.balance,
        academicYearOutstandingBefore: balanceInfo.balance + payment.amount,
        academicYearOutstandingAfter: balanceInfo.balance,
        carryForward: 0
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
    <title>Payment Confirmation - ${data.schoolName}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border: 2px solid #f1f5f9;
            position: relative;
            overflow: hidden;
        }
        .curled-corner {
            position: absolute;
            top: 0;
            right: 0;
            width: 64px;
            height: 64px;
            overflow: hidden;
            pointer-events: none;
        }
        .curled-corner::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 32px;
            height: 32px;
            background: #e2e8f0;
            transform: rotate(45deg);
            transform-origin: bottom left;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
            border-radius: 12px 12px 0 0; 
            margin: -20px -20px 30px -20px;
            position: relative;
        }
        .header::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            opacity: 0.1;
            border-radius: 12px 12px 0 0;
        }
        .school-logo {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 12px;
            border-radius: 50%;
            margin-bottom: 15px;
        }
        .success-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border: 2px solid #34d399;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .receipt-info {
            background: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            color: #64748b;
        }
        .content { 
            padding: 0 20px 30px 20px; 
        }
        .section {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            margin: 20px 0;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .section-header {
            padding: 15px 20px;
            font-weight: 600;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section-content {
            padding: 20px;
        }
        .student-section { border-left: 4px solid #3b82f6; }
        .student-section .section-header { background: #eff6ff; color: #1e40af; }
        .payment-section { border-left: 4px solid #10b981; }
        .payment-section .section-header { background: #ecfdf5; color: #047857; }
        .academic-section { border-left: 4px solid #8b5cf6; }
        .academic-section .section-header { background: #f3f4f6; color: #6d28d9; }
        .balance-section { border-left: 4px solid #f59e0b; }
        .balance-section .section-header { background: #fffbeb; color: #d97706; }
        .details-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            margin: 15px 0; 
        }
        .detail-item { 
            padding: 12px; 
            background: #f8fafc; 
            border-radius: 8px; 
            border: 1px solid #e2e8f0;
        }
        .detail-label { 
            font-weight: 600; 
            color: #64748b; 
            font-size: 12px; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .detail-value { 
            color: #1e293b; 
            margin-top: 4px; 
            font-weight: 600;
            font-size: 14px;
        }
        .amount-highlight {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-radius: 12px;
            margin: 20px 0;
            border: 2px solid #34d399;
        }
        .download-section {
            text-align: center;
            margin: 30px 0;
            padding: 30px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 12px;
            border: 2px solid #0ea5e9;
        }
        .download-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
        }
        .download-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        .thank-you-section {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border: 2px solid #10b981;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
            text-align: center;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #64748b; 
            font-size: 12px;
            padding: 20px;
            border-top: 1px solid #e2e8f0;
        }
        .icon {
            width: 20px;
            height: 20px;
            display: inline-block;
            vertical-align: middle;
            margin-right: 8px;
        }
        @media (max-width: 600px) {
            .container { margin: 10px; padding: 15px; }
            .details-grid { grid-template-columns: 1fr; }
            .header { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="curled-corner"></div>
        
        <div class="header">
            <div class="school-logo">🏫</div>
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${data.schoolName}</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">School Code: ${data.schoolCode || 'N/A'}</p>
        </div>
        
        <div class="success-badge">
            <div style="font-size: 24px; margin-bottom: 10px;">✅</div>
            <div style="font-weight: bold; font-size: 18px; color: #047857;">Payment Successful</div>
            <div style="font-size: 20px; font-weight: bold; color: #065f46;">OFFICIAL RECEIPT</div>
        </div>
        
        <div class="receipt-info">
            <span>Receipt No: <strong style="color: #3b82f6;">${data.receiptNumber}</strong></span>
            <span>Date: <strong>${new Date(data.paymentDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</strong></span>
        </div>
        
        <div class="content">
            <div class="amount-highlight">
                KES ${data.amount.toLocaleString()}
            </div>
            
            <div class="section student-section">
                <div class="section-header">
                    <span class="icon">👤</span>
                    Student Details
                </div>
                <div class="section-content">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Student Name</div>
                            <div class="detail-value">${data.studentName}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Admission Number</div>
                            <div class="detail-value">${data.admissionNumber || 'N/A'}</div>
                        </div>
                        ${data.parentName ? `
                        <div class="detail-item">
                            <div class="detail-label">Parent/Guardian</div>
                            <div class="detail-value">${data.parentName}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="section payment-section">
                <div class="section-header">
                    <span class="icon">💳</span>
                    Payment Details
                </div>
                <div class="section-content">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Payment Method</div>
                            <div class="detail-value">${data.paymentMethod}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Reference</div>
                            <div class="detail-value">${data.reference || 'N/A'}</div>
                        </div>
                        ${data.phoneNumber ? `
                        <div class="detail-item">
                            <div class="detail-label">Phone Number</div>
                            <div class="detail-value">${data.phoneNumber}</div>
                        </div>
                        ` : ''}
                        ${data.transactionId ? `
                        <div class="detail-item">
                            <div class="detail-label">Transaction ID</div>
                            <div class="detail-value">${data.transactionId}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="section academic-section">
                <div class="section-header">
                    <span class="icon">📅</span>
                    Academic Period
                </div>
                <div class="section-content">
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Academic Year</div>
                            <div class="detail-value">${data.academicYear || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Term</div>
                            <div class="detail-value">${data.termName || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Fee Type</div>
                            <div class="detail-value">${data.feeType || 'School Fees'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Status</div>
                            <div class="detail-value" style="color: #10b981; font-weight: bold;">${data.status || 'COMPLETED'}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${data.balanceAfter !== undefined || data.balanceBefore !== undefined ? `
            <div class="section balance-section">
                <div class="section-header">
                    <span class="icon">📊</span>
                    Balance Summary
                </div>
                <div class="section-content">
                    <div class="details-grid">
                        ${data.balanceBefore !== undefined ? `
                        <div class="detail-item">
                            <div class="detail-label">Balance Before</div>
                            <div class="detail-value">KES ${data.balanceBefore.toLocaleString()}</div>
                        </div>
                        ` : ''}
                        ${data.balanceAfter !== undefined ? `
                        <div class="detail-item">
                            <div class="detail-label">Balance After</div>
                            <div class="detail-value" style="color: ${data.balanceAfter <= 0 ? '#10b981' : '#f59e0b'};">
                                KES ${data.balanceAfter.toLocaleString()}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${data.receiptDownloadUrl ? `
            <div class="download-section">
                <h3 style="margin: 0 0 15px 0; color: #0c4a6e;">View Your Receipt</h3>
                <p style="margin: 0 0 20px 0; color: #0369a1;">Click below to view your beautiful receipt with download options</p>
                <a href="${data.receiptDownloadUrl}" class="download-button">
                    👁️ View Enhanced Receipt
                </a>
            </div>
            ` : ''}
            
            <div class="thank-you-section">
                <h3 style="margin: 0 0 10px 0; color: #047857;">Thank You for Your Payment!</h3>
                <p style="margin: 0; color: #065f46;">
                    We appreciate your prompt payment. This receipt serves as proof of payment for the above mentioned fees.
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>${data.schoolName}</strong></p>
            <p><strong>Received By:</strong> ${data.issuedBy || 'Bursar'}</p>
            <p><strong>Processed through:</strong> Bursar Portal</p>
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p>For any queries, please contact the school administration.</p>
            <p style="margin-top: 15px; font-size: 11px; color: #94a3b8;">
                Generated on ${new Date().toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </p>
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

${data.receiptDownloadUrl ? `View your receipt: ${data.receiptDownloadUrl}\n` : ''}
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


