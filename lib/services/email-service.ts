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
  receiptDownloadUrlA3?: string
  receiptDownloadUrlA4?: string
  receiptDownloadUrlA5?: string
  feesStatementUrl?: string
  academicYearId?: string
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
  paymentId?: string
}

export class EmailService {
  private config: EmailConfig | null = null

  // Helper function to generate receipt download URL (same as bursar dashboard)
  private generateReceiptDownloadUrl(schoolCode: string, receiptNumber: string, size: string = 'A4'): string {
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    baseUrl = baseUrl.replace(/\/$/, '')
    
    // Ensure HTTPS in production
    if (!baseUrl.includes('localhost') && !baseUrl.startsWith('https://')) {
      baseUrl = baseUrl.replace('http://', 'https://')
    }
    
    // Use the exact same endpoint as bursar dashboard
    const url = `${baseUrl}/api/schools/${schoolCode}/receipts/${receiptNumber}/download?size=${size}`
    console.log('🔍 Receipt Download URL (Bursar Format):', {
      baseUrl,
      receiptNumber,
      size,
      generatedUrl: url
    })
    return url
  }

  // Helper function to generate multiple receipt download URLs for different sizes
  private generateReceiptDownloadUrls(schoolCode: string, receiptNumber: string): {
    receiptDownloadUrlA3: string;
    receiptDownloadUrlA4: string;
    receiptDownloadUrlA5: string;
  } {
    return {
      receiptDownloadUrlA3: this.generateReceiptDownloadUrl(schoolCode, receiptNumber, 'A3'),
      receiptDownloadUrlA4: this.generateReceiptDownloadUrl(schoolCode, receiptNumber, 'A4'),
      receiptDownloadUrlA5: this.generateReceiptDownloadUrl(schoolCode, receiptNumber, 'A5')
    }
  }

  // Helper function to generate fees statement PDF URL (same as bursar dashboard)
  private generateFeesStatementUrl(schoolCode: string, studentId: string, academicYearId?: string): string {
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    baseUrl = baseUrl.replace(/\/$/, '')
    
    // Ensure HTTPS in production
    if (!baseUrl.includes('localhost') && !baseUrl.startsWith('https://')) {
      baseUrl = baseUrl.replace('http://', 'https://')
    }
    
    // Use the exact same endpoint as bursar dashboard
    const yearParam = academicYearId ? `?academicYearId=${academicYearId}` : ''
    const url = `${baseUrl}/api/schools/${schoolCode}/students/${studentId}/fee-statement/pdf${yearParam}`
    console.log('🔍 Fee Statement URL (Bursar Format):', {
      baseUrl,
      studentId,
      academicYearId,
      generatedUrl: url
    })
    return url
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
      // Generate receipt download URLs if not provided
      if (!paymentData.receiptDownloadUrl && paymentData.receiptNumber) {
        const receiptUrls = this.generateReceiptDownloadUrls(
          paymentData.schoolCode, 
          paymentData.receiptNumber
        )
        paymentData.receiptDownloadUrl = receiptUrls.receiptDownloadUrlA4 // Default to A4
        paymentData.receiptDownloadUrlA3 = receiptUrls.receiptDownloadUrlA3
        paymentData.receiptDownloadUrlA4 = receiptUrls.receiptDownloadUrlA4
        paymentData.receiptDownloadUrlA5 = receiptUrls.receiptDownloadUrlA5
      }

      // Generate fees statement URL if not provided (same as bursar dashboard)
      if (!paymentData.feesStatementUrl && paymentData.studentId) {
        try {
          console.log('📊 Generating fee statement URL:', {
            schoolCode: paymentData.schoolCode,
            studentId: paymentData.studentId,
            academicYearId: paymentData.academicYearId
          })
          paymentData.feesStatementUrl = this.generateFeesStatementUrl(
            paymentData.schoolCode,
            paymentData.studentId,
            paymentData.academicYearId
          )
          console.log('✅ Generated fees statement URL:', paymentData.feesStatementUrl)
        } catch (error) {
          console.error('❌ Error generating fees statement URL:', error)
          paymentData.feesStatementUrl = undefined
        }
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
        academicYearId: payment.academicYear.id,
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

  // Helper function to convert numbers to words for email
  private convertNumberToWords(amount: number): string {
    if (amount === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Million', 'Billion'];

    function convertHundreds(num: number): string {
      let result = '';
      
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        return result;
      }
      
      if (num > 0) {
        result += ones[num] + ' ';
      }
      
      return result;
    }

    let result = '';
    let thousandCounter = 0;
    
    while (amount > 0) {
      if (amount % 1000 !== 0) {
        result = convertHundreds(amount % 1000) + thousands[thousandCounter] + ' ' + result;
      }
      amount = Math.floor(amount / 1000);
      thousandCounter++;
    }
    
    return result.trim();
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
            font-family: Inter, system-ui, sans-serif; 
            line-height: 1.6; 
            color: #334155; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%);
            min-height: 100vh;
        }
        .email-container { 
            max-width: 750px; 
            margin: 20px auto; 
            padding: 0;
            background: white;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            overflow: hidden;
            backdrop-filter: blur(16px);
        }
        .header { 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); 
            color: white; 
            padding: 40px; 
            text-align: center; 
            position: relative;
            border-bottom: 4px solid #3b82f6;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 25% 25%, #1e40af 0%, transparent 50%), 
                        radial-gradient(circle at 75% 75%, #3b82f6 0%, transparent 50%);
            opacity: 0.1;
        }
        .header-content {
            position: relative;
            z-index: 1;
        }
        .school-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.1);
        }
        .school-icon::before {
            content: '🏫';
            font-size: 32px;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 800;
            margin: 0 0 8px 0;
            letter-spacing: -0.025em;
        }
        .header .subtitle {
            font-size: 16px;
            color: #94a3b8;
            margin: 0 0 5px 0;
            font-weight: 600;
        }
        .header .timestamp {
            font-size: 14px;
            color: #64748b;
            margin: 0;
            font-weight: 500;
        }
        .email-intro {
            padding: 40px;
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-bottom: 1px solid #a7f3d0;
            text-align: center;
            position: relative;
        }
        .success-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3);
        }
        .success-icon::before {
            content: '✅';
            font-size: 24px;
        }
        .email-intro h2 {
            color: #065f46;
            margin: 0 0 12px 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
        }
        .email-intro p {
            color: #047857;
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        .receipt-preview {
            margin: 30px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .receipt-header {
            padding: 25px;
            border-bottom: 2px solid #e2e8f0;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .receipt-header h3 {
            margin: 0;
            color: #1e293b;
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .receipt-header h3::before {
            content: '🧾';
            font-size: 20px;
        }
        .status-badge {
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            color: #065f46;
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 13px;
            font-weight: 700;
            border: 2px solid #a7f3d0;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }
        .receipt-content { 
            padding: 30px; 
        }
        .section {
            margin-bottom: 30px;
        }
        .section h4 {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 15px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section-box {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 20px;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
        }
        .amount-box {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 3px solid #a7f3d0;
            padding: 30px;
            border-radius: 16px;
            text-align: center;
            margin: 25px 0;
            position: relative;
            overflow: hidden;
        }
        .amount-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 30%, rgba(5, 150, 105, 0.1) 0%, transparent 50%);
        }
        .amount-content {
            position: relative;
            z-index: 1;
        }
        .amount-value {
            font-size: 36px;
            font-weight: 900;
            color: #065f46;
            margin: 0 0 8px 0;
            letter-spacing: -0.025em;
        }
        .amount-words {
            font-style: italic;
            color: #047857;
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        .details-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            font-size: 15px;
        }
        .detail-item {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            padding: 15px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        .detail-item span {
            color: #64748b;
            font-size: 13px; 
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.025em;
            display: block;
            margin-bottom: 5px;
        }
        .detail-item p {
            color: #1e293b;
            font-weight: 700;
            margin: 0;
            font-size: 15px;
        }
        .download-section {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            border-radius: 20px;
            padding: 40px;
            margin: 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .download-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 25% 25%, #1e40af 0%, transparent 50%), 
                        radial-gradient(circle at 75% 75%, #3b82f6 0%, transparent 50%);
            opacity: 0.1;
        }
        .download-content {
            position: relative;
            z-index: 1;
        }
        .download-title {
            color: #f8fafc;
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 10px 0;
            letter-spacing: -0.025em;
        }
        .download-subtitle {
            color: #94a3b8;
            margin: 0 0 30px 0;
            font-size: 16px;
            font-weight: 600;
        }
        .button-container {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .download-button {
            display: inline-flex;
            align-items: center;
            color: white;
            padding: 18px 30px;
            text-decoration: none;
            border-radius: 16px;
            font-weight: 700;
            min-width: 220px;
            gap: 12px;
            transition: all 0.3s ease;
            font-size: 16px;
            position: relative;
            overflow: hidden;
            border: 2px solid transparent;
        }
        .download-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .receipt-button {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            border-color: #3b82f6;
        }
        .receipt-button:hover {
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.6);
        }
        .statement-button {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
            border-color: #10b981;
        }
        .statement-button:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6);
        }
        .footer { 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-top: 2px solid #e2e8f0;
            padding: 30px;
            text-align: center; 
            color: #64748b; 
            font-size: 13px;
        }
        .footer p {
            margin: 5px 0;
        }
        .download-note {
            margin-top: 25px;
            padding: 20px;
            background: rgba(245, 158, 11, 0.08);
            border-radius: 10px;
            font-size: 14px;
            color: #78350f;
            border: 1px solid rgba(245, 158, 11, 0.2);
            border-left: 4px solid #f59e0b;
        }
        .footer { 
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            padding: 25px;
            text-align: center; 
            color: #6b7280; 
            font-size: 12px;
        }
        .footer p {
            margin: 5px 0;
        }
        @media (max-width: 600px) {
            .email-container { margin: 10px; }
            .details-grid { grid-template-columns: 1fr; }
            .receipt-info { flex-direction: column; gap: 10px; text-align: center; }
            .button-container { flex-direction: column; align-items: center; }
            .download-button { min-width: 200px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="header-content">
                <div class="school-icon"></div>
                <h1>${data.schoolName}</h1>
                <p class="subtitle">Financial Management System</p>
                <p class="timestamp">Payment Processed: ${new Date(data.paymentDate).toLocaleString()}</p>
            </div>
        </div>
        
        <div class="email-intro">
            <div class="success-icon"></div>
            <h2>Payment Successfully Received!</h2>
            <p>Your payment has been processed and all documents are ready for download.</p>
        </div>
        
        <!-- Payment Receipt Preview -->
        <div class="receipt-preview">
            <div class="receipt-header">
                <h3>Payment Receipt</h3>
                <div class="status-badge">Confirmed</div>
            </div>
            
            <div class="receipt-content">
                <!-- Amount Section -->
                <div class="amount-box">
                    <div class="amount-content">
                        <h4 class="amount-value">KES ${data.amount.toLocaleString()}</h4>
                        <p class="amount-words">${this.convertNumberToWords(data.amount)} Kenyan Shillings Only</p>
                    </div>
                </div>
                
                <!-- Payment Details -->
                <div class="section">
                    <h4>💳 Payment Information</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <span>Receipt Number</span>
                            <p>${data.receiptNumber}</p>
                        </div>
                        <div class="detail-item">
                            <span>Payment Date</span>
                            <p>${new Date(data.paymentDate).toLocaleDateString()}</p>
                        </div>
                        <div class="detail-item">
                            <span>Payment Method</span>
                            <p>${data.paymentMethod ? data.paymentMethod.replace('_', ' ') : 'N/A'}</p>
                        </div>
                        <div class="detail-item">
                            <span>Receipt Status</span>
                            <p style="color: #059669; font-weight: 700;">✅ Confirmed</p>
                        </div>
                    </div>
                </div>
                
                <!-- Student Details -->
                <div class="section">
                    <h4>👨‍🎓 Student Information</h4>
                    <div class="details-grid">
                        <div class="detail-item">
                            <span>Student Name</span>
                            <p>${data.studentName}</p>
                        </div>
                        <div class="detail-item">
                            <span>Admission Number</span>
                            <p>${data.admissionNumber || 'N/A'}</p>
                        </div>
                        <div class="detail-item">
                            <span>Academic Year</span>
                            <p>${data.academicYear || 'N/A'}</p>
                        </div>
                        <div class="detail-item">
                            <span>Academic Period</span>
                            <p>${data.academicYear || 'N/A'} - ${data.termName || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Balance Information -->
                <div class="section">
                    <h4>💰 Balance Summary</h4>
                    <div class="section-box">
                        <div class="details-grid">
                            ${data.balanceBefore !== undefined ? `
                            <div class="detail-item">
                                <span>Balance Before</span>
                                <p>KES ${data.balanceBefore.toLocaleString()}</p>
                            </div>
                            ` : ''}
                            <div class="detail-item">
                                <span>Amount Paid</span>
                                <p style="color: #059669; font-weight: 800;">KES ${data.amount.toLocaleString()}</p>
                            </div>
                            ${(data.academicYearOutstandingAfter !== undefined) ? `
                            <div class="detail-item">
                                <span>Remaining Balance</span>
                                <p style="color: ${data.academicYearOutstandingAfter > 0 ? '#d97706' : '#059669'}; font-weight: 800;">
                                    KES ${data.academicYearOutstandingAfter.toLocaleString()}
                                </p>
                            </div>
                            ` : (data.balanceAfter !== undefined) ? `
                            <div class="detail-item">
                                <span>Balance After</span>
                                <p style="color: ${data.balanceAfter > 0 ? '#d97706' : '#059669'}; font-weight: 800;">
                                    KES ${data.balanceAfter.toLocaleString()}
                                </p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
            
        <!-- Download Section with Clear Call-to-Action -->
            ${data.receiptDownloadUrlA3 || data.receiptDownloadUrlA4 || data.receiptDownloadUrlA5 || data.feesStatementUrl ? `
            <div class="download-section">
                <div class="download-content">
                    <div class="download-title">📋 Access Your Documents</div>
                    <div class="download-subtitle">Download your payment documents and complete academic fee statement</div>
                    
                    <div class="button-container">
                        ${data.receiptDownloadUrlA4 ? `
                        <a href="${data.receiptDownloadUrlA4}" class="download-button receipt-button">
                            🧾 Download Receipt (A4)
                        </a>
                        ` : ''}
                        
                        ${data.feesStatementUrl ? `
                        <a href="${data.feesStatementUrl}" class="download-button statement-button">
                            📊 Download Fee Statement
                        </a>
                        ` : ''}
                    </div>
                    
                    ${data.receiptDownloadUrlA3 || data.receiptDownloadUrlA5 ? `
                    <div style="margin-top: 25px; padding: 20px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2);">
                        <p style="margin: 0 0 15px 0; font-size: 14px; color: #f8fafc; font-weight: 600; text-align: center;">
                            📄 Alternative Receipt Formats
                        </p>
                        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
                            ${data.receiptDownloadUrlA3 ? `
                            <a href="${data.receiptDownloadUrlA3}" style="background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); color: white; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s ease;">
                                📋 A3 Format
                            </a>
                            ` : ''}
                            ${data.receiptDownloadUrlA5 ? `
                            <a href="${data.receiptDownloadUrlA5}" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s ease;">
                                🗒️ A5 Format
                            </a>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div style="margin-top: 25px; padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <p style="margin: 0; font-size: 14px; color: #f8fafc; font-weight: 500; text-align: center; line-height: 1.5;">
                            💡 <strong>Pro Tip:</strong> Save these documents for your records. The fee statement provides a complete academic year summary.
                        </p>
                    </div>
                </div>
            </div>
            ` : ''}
            
        <!-- Thank You Section -->
        <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 25px; margin: 30px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 18px;">🙏 Thank You for Your Payment!</h3>
            <p style="margin: 0; color: #15803d; font-size: 14px;">
                We appreciate your prompt payment. This receipt serves as official proof of payment for the fees mentioned above.
            </p>
        </div>
        
        <!-- Professional Footer -->
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-top: 2px solid #e2e8f0; padding: 30px; text-align: center;">
            <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 20px;">
                <div style="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg border border-blue-500/20; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); display: flex; align-items: center; justify-content: center;">
                    🏫
                </div>
                <div style="text-align: left;">
                    <h4 style="margin: 0; font-size: 18px; font-weight: 700; color: #1e293b;">${data.schoolName}</h4>
                    <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 500;">Bursar Portal • Financial Management</p>
                </div>
            </div>
            
            <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; text-align: center;">
                    <div>
                        <p style="margin: 0 0 5px 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em;">Processed By</p>
                        <p style="margin: 0; font-size: 14px; color: #1e293b; font-weight: 700;">${data.issuedBy || 'Bursar Portal'}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 5px 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em;">Generated</p>
                        <p style="margin: 0; font-size: 14px; color: #1e293b; font-weight: 700;">${new Date().toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 5px 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em;">Status</p>
                        <p style="margin: 0; font-size: 14px; color: #059669; font-weight: 700;">✅ Verified</p>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2);">
                <p style="margin: 0; font-size: 13px; color: #1e40af; font-weight: 500; line-height: 1.4;">
                    📧 This is a computer-generated receipt and does not require a signature.<br>
                    For any queries, please contact the school administration or bursar office.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `

    const text = `
${data.schoolName}
School Code: ${data.schoolCode || 'N/A'}
Contact: School Administration

✅ PAYMENT SUCCESSFULLY RECEIVED!

MONEY RECEIPT
===============================================

Receipt No: ${data.receiptNumber}
Date: ${new Date(data.paymentDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}
Status: ✓ PAID

Received with thanks from:
${data.studentName}
Admission No: ${data.admissionNumber || 'N/A'}
${data.parentName ? `Parent/Guardian: ${data.parentName}` : ''}
${data.phoneNumber ? `Phone: ${data.phoneNumber}` : ''}

Amount:
KES ${data.amount.toLocaleString()}
In words: ${this.convertNumberToWords(data.amount)} Kenyan Shillings Only

For:
Fee Type: ${data.feeType || 'School Fees'}
Academic Year: ${data.academicYear || 'N/A'}
Term: ${data.termName || 'N/A'}
Payment Method: ${data.paymentMethod ? data.paymentMethod.replace('_', ' ') : 'N/A'}
${data.reference ? `Reference: ${data.reference}` : ''}

${(data.academicYearOutstandingBefore !== undefined || data.academicYearOutstandingAfter !== undefined || data.balanceBefore !== undefined || data.balanceAfter !== undefined) ? `
Account Balance:
Balance Before: KES ${(data.academicYearOutstandingBefore || data.balanceBefore || 0).toLocaleString()}
Balance After: KES ${(data.academicYearOutstandingAfter || data.balanceAfter || 0).toLocaleString()}
${data.carryForward && data.carryForward > 0 ? `
Overpayment Carried Forward: KES ${data.carryForward.toLocaleString()}
Applied to next term fees` : ''}
` : ''}

                   _________________________
                      Money Receiver Sign
                        ${data.issuedBy || 'Bursar'}

${data.receiptDownloadUrl || data.feesStatementUrl ? `
📄 YOUR PAYMENT DOCUMENTS:

${data.receiptDownloadUrl ? `🧾 Download Payment Receipt: ${data.receiptDownloadUrl}
   • Direct PDF download
   • High quality format
   • Print ready
   • Save and archive` : ''}

${data.feesStatementUrl ? `📊 Complete Fee Statement: ${data.feesStatementUrl}
   • Full academic year summary
   • PDF format ready for download` : ''}
` : ''}

===============================================
🙏 Thank you for your payment!
This receipt serves as official proof of payment.

For queries, contact the school administration.
Processed through: Bursar Portal

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


