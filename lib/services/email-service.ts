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

  // Helper function to generate receipt download URL (direct PDF)
  private generateReceiptDownloadUrl(schoolCode: string, receiptNumber: string, size: string = 'A4'): string {
    // Create a secure URL that leads to the receipt download endpoint (direct PDF)
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    // Remove trailing slash to avoid double slashes
    baseUrl = baseUrl.replace(/\/$/, '')
    const url = `${baseUrl}/api/schools/${schoolCode}/receipts/${receiptNumber}/download?size=${size}`
    console.log('🔍 Receipt Download URL Debug:', {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      baseUrl,
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

  // Helper function to generate fees statement PDF URL
  private generateFeesStatementUrl(schoolCode: string, studentId: string, academicYearId?: string): string {
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    // Remove trailing slash to avoid double slashes
    baseUrl = baseUrl.replace(/\/$/, '')
    const yearParam = academicYearId ? `?academicYearId=${academicYearId}` : ''
    const url = `${baseUrl}/api/schools/${schoolCode}/students/${studentId}/fee-statement/pdf${yearParam}`
    console.log('🔍 Fees Statement URL Debug:', {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      baseUrl,
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

      // Generate fees statement URL if not provided
      if (!paymentData.feesStatementUrl && paymentData.studentId) {
        paymentData.feesStatementUrl = this.generateFeesStatementUrl(
          paymentData.schoolCode,
          paymentData.studentId,
          paymentData.academicYearId
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
            color: #333; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        }
        .email-container { 
            max-width: 700px; 
            margin: 20px auto; 
            padding: 0;
            background: white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-bottom: 3px solid #f59e0b;
        }
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 5px 0;
        }
        .header p {
            font-size: 12px;
            color: #dbeafe;
            margin: 2px 0;
        }
        .email-intro {
            padding: 30px;
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-bottom: 1px solid #bbf7d0;
            text-align: center;
        }
        .email-intro h2 {
            color: #14532d;
            margin: 0 0 10px 0;
            font-size: 22px;
            font-weight: 700;
        }
        .email-intro p {
            color: #166534;
            margin: 0;
            font-size: 16px;
            font-weight: 500;
        }
        .receipt-preview {
            margin: 30px;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        .receipt-header {
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
        }
        .receipt-header h3 {
            margin: 0 0 10px 0;
            color: #374151;
            font-size: 18px;
        }
        .receipt-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            color: #6b7280;
            margin-top: 10px;
        }
        .status-badge {
            background: #dcfce7;
            color: #166534;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .receipt-content { 
            padding: 25px; 
        }
        .section {
            margin-bottom: 25px;
        }
        .section h4 {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin: 0 0 10px 0;
        }
        .section-box {
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .amount-box {
            background: #f0fdf4;
            border: 2px solid #bbf7d0;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .amount-value {
            font-size: 24px;
            font-weight: bold;
            color: #166534;
            margin: 0;
        }
        .amount-words {
            font-style: italic;
            color: #374151;
            margin: 5px 0 0 0;
            font-size: 14px;
        }
        .details-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            font-size: 14px;
        }
        .detail-item span {
            color: #6b7280;
            font-size: 12px; 
            font-weight: 500;
        }
        .detail-item p {
            color: #374151;
            font-weight: 600;
            margin: 2px 0 0 0;
        }
        .download-section {
            background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
            border: 2px solid #f59e0b;
            border-radius: 16px;
            padding: 35px;
            margin: 30px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.1);
        }
        .download-title {
            color: #92400e;
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 8px 0;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .download-subtitle {
            color: #d97706;
            margin: 0 0 30px 0;
            font-size: 15px;
            font-weight: 500;
        }
        .button-container {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .download-button {
            display: inline-flex;
            align-items: center;
            color: white;
            padding: 18px 28px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            min-width: 200px;
            gap: 12px;
            transition: all 0.3s ease;
            font-size: 15px;
            border: 2px solid transparent;
            position: relative;
            overflow: hidden;
        }
        .download-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        .receipt-button {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
            border-color: #f59e0b;
        }
        .receipt-button:hover {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
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
            <h1>${data.schoolName}</h1>
            <p>School Code: ${data.schoolCode || 'N/A'}</p>
        </div>
        
        <div class="email-intro">
            <h2>✅ Payment Successfully Received!</h2>
            <p>Your payment has been processed and a receipt has been generated.</p>
        </div>
        
        <div class="receipt-preview">
            <!-- Premium Receipt Header -->
            <div style="background: linear-gradient(135deg, #1d4ed8 0%, #3730a3 100%); color: white; padding: 20px; position: relative; overflow: hidden;">
                <!-- Decorative elements -->
                <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -15px; left: -15px; width: 60px; height: 60px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: start; position: relative;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.3);">
                                <span style="font-size: 16px;">🏫</span>
            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">${data.schoolName}</h3>
                                <p style="margin: 0; font-size: 12px; color: #dbeafe; font-weight: 500;">Excellence in Education</p>
                </div>
                        </div>
                        <div style="font-size: 10px; color: #dbeafe; line-height: 1.5;">
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                                <span style="width: 14px; height: 14px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px;">🏢</span>
                                School Code: <span style="color: white; font-weight: 600;">${data.schoolCode || 'N/A'}</span>
                        </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="width: 14px; height: 14px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px;">📧</span>
                                Contact: School Administration
                    </div>
                </div>
            </div>
            
                    <div style="text-align: right; margin-left: 20px;">
                        <div style="background: rgba(255,255,255,0.95); color: #1d4ed8; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.5);">
                            <p style="margin: 0; font-size: 10px; font-weight: 600; color: #3730a3;">DATE</p>
                            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #000;">${new Date(data.paymentDate).toLocaleDateString()}</p>
                </div>
                        <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #000; padding: 8px 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #d97706;">
                            <p style="margin: 0; font-size: 10px; font-weight: 600; color: #92400e;">RECEIPT NO</p>
                            <p style="margin: 0; font-size: 12px; font-weight: bold;">${data.receiptNumber}</p>
                        </div>
                        </div>
                        </div>
            </div>

            <!-- Invoice/Receipt Label -->
            <div style="background: #2563eb; color: white; text-align: center; padding: 8px;">
                <h4 style="margin: 0; font-size: 14px; font-weight: bold;">MONEY RECEIPT</h4>
            </div>

            <div class="receipt-content" style="padding: 20px;">
                <!-- Enhanced Customer Information Section -->
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%); border: 2px solid #2563eb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <div style="margin-bottom: 15px;">
                        <div style="background: white; border: 2px solid #bfdbfe; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                <span style="width: 20px; height: 20px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">👤</span>
                                <h5 style="color: #2563eb; font-size: 12px; font-weight: bold; margin: 0;">STUDENT NAME:</h5>
                            </div>
                            <p style="margin: 0; font-weight: bold; font-size: 16px; color: #374151;">${data.studentName}</p>
                        </div>
                    </div>
                    <div>
                        <div style="background: white; border: 2px solid #bfdbfe; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                <span style="width: 20px; height: 20px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">🆔</span>
                                <h5 style="color: #2563eb; font-size: 12px; font-weight: bold; margin: 0;">ADMISSION NO:</h5>
                            </div>
                            <p style="margin: 0; font-weight: bold; font-size: 16px; color: #374151;">${data.admissionNumber || 'N/A'}</p>
                            ${data.parentName ? `
                            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eff6ff;">
                                <p style="margin: 0; font-size: 12px; color: #2563eb; font-weight: 500;">Parent/Guardian: ${data.parentName}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
                <!-- Items Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #2563eb; color: white;">
                            <th style="border: 1px solid #1d4ed8; padding: 8px; text-align: center; font-size: 11px;">NO.</th>
                            <th style="border: 1px solid #1d4ed8; padding: 8px; text-align: left; font-size: 11px;">DESCRIPTION</th>
                            <th style="border: 1px solid #1d4ed8; padding: 8px; text-align: center; font-size: 11px;">QTY</th>
                            <th style="border: 1px solid #1d4ed8; padding: 8px; text-align: center; font-size: 11px;">UNIT PRICE</th>
                            <th style="border: 1px solid #1d4ed8; padding: 8px; text-align: center; font-size: 11px;">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: 600;">1</td>
                            <td style="border: 1px solid #d1d5db; padding: 8px;">
                                <div style="font-weight: 600; color: #374151;">${data.feeType || 'School Fees'}</div>
                                <div style="font-size: 11px; color: #6b7280;">${data.academicYear || 'N/A'} - ${data.termName || 'N/A'}</div>
                                <div style="font-size: 10px; color: #9ca3af;">Payment: ${data.paymentMethod ? data.paymentMethod.replace('_', ' ') : 'N/A'}</div>
                            </td>
                            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">1</td>
                            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">KES ${data.amount.toLocaleString()}</td>
                            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: bold;">KES ${data.amount.toLocaleString()}</td>
                        </tr>
                        ${(data.academicYearOutstandingBefore !== undefined || data.academicYearOutstandingAfter !== undefined || data.balanceBefore !== undefined || data.balanceAfter !== undefined) ? `
                        <tr style="background: #f9fafb;">
                            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: 600;">2</td>
                            <td style="border: 1px solid #d1d5db; padding: 8px;">
                                <div style="font-weight: 600; color: #374151;">Account Balance Summary</div>
                                <div style="font-size: 11px; color: #6b7280;">
                                    Balance Before: KES ${(data.academicYearOutstandingBefore || data.balanceBefore || 0).toLocaleString()}<br>
                                    Balance After: KES ${(data.academicYearOutstandingAfter || data.balanceAfter || 0).toLocaleString()}
                </div>
                            </td>
                            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">-</td>
                            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">-</td>
                            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">-</td>
                        </tr>
                        ` : ''}
                        ${data.carryForward && data.carryForward > 0 ? `
                        <tr style="background: #eff6ff;">
                            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: 600; color: #2563eb;">3</td>
                            <td style="border: 1px solid #d1d5db; padding: 8px;">
                                <div style="font-weight: 600; color: #2563eb;">Overpayment Carried Forward</div>
                                <div style="font-size: 11px; color: #3b82f6;">Applied to next term fees</div>
                            </td>
                            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #2563eb;">1</td>
                            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #2563eb;">KES ${data.carryForward.toLocaleString()}</td>
                            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: bold; color: #2563eb;">KES ${data.carryForward.toLocaleString()}</td>
                        </tr>
                        ` : ''}
                    </tbody>
                </table>

                <!-- Terms and Total Section -->
                <div style="border-top: 2px solid #2563eb; display: grid; grid-template-columns: 1fr 1fr;">
                    <div style="padding: 15px; border-right: 1px solid #d1d5db;">
                        <div style="font-size: 11px; color: #6b7280;">
                            <p style="font-weight: bold; margin: 0 0 5px 0;">TERMS & CONDITIONS:</p>
                            <p style="margin: 2px 0;">Payment received in good condition</p>
                            <p style="margin: 2px 0;">No refund of money after payment</p>
                            <p style="margin: 8px 0 0 0; font-weight: 600;">Thanks for your patronage.</p>
                        </div>
                        </div>
                    <div style="background: #fecaca; padding: 15px; text-align: right;">
                        <div style="background: #dc2626; color: white; padding: 8px 15px; font-weight: bold; font-size: 14px; border-radius: 4px; display: inline-block;">
                            TOTAL KES ${data.amount.toLocaleString()}
                        </div>
                        </div>
                    </div>

                <!-- Amount in Words -->
                <div style="border-top: 1px solid #d1d5db; padding: 15px; background: #f9fafb;">
                    <h5 style="font-size: 12px; font-weight: bold; color: #374151; margin: 0 0 5px 0;">Amount in words:</h5>
                    <p style="margin: 0; font-weight: 600; color: #374151;">${this.convertNumberToWords(data.amount)} Kenyan Shillings Only</p>
            </div>
            
                <!-- Signatures -->
                <div style="border-top: 1px solid #d1d5db; padding: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div style="text-align: center;">
                        <div style="border-top: 1px solid #6b7280; width: 80%; margin: 20px auto 8px auto;"></div>
                        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #374151;">Soft's signature</p>
                </div>
                    <div style="text-align: center;">
                        <div style="background: #2563eb; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-bottom: 15px; display: inline-block;">
                            Thanks For Your Patronage!
                        </div>
                        <div style="border-top: 1px solid #6b7280; width: 80%; margin: 0 auto 8px auto;"></div>
                        <p style="margin: 0; font-size: 12px; font-weight: bold; color: #374151;">Customer's signature</p>
                            </div>
                        </div>

                <!-- Reference Information -->
                ${(data.reference || data.transactionId || data.paymentId) ? `
                <div style="border-top: 1px solid #d1d5db; padding: 15px; background: #f9fafb;">
                    <div style="font-size: 11px; color: #6b7280;">
                        ${data.paymentId ? `<p style="margin: 2px 0;"><span style="font-weight: 600;">Payment ID:</span> ${data.paymentId}</p>` : ''}
                        ${data.transactionId ? `<p style="margin: 2px 0;"><span style="font-weight: 600;">Transaction ID:</span> ${data.transactionId}</p>` : ''}
                        ${data.reference ? `<p style="margin: 2px 0;"><span style="font-weight: 600;">Reference:</span> ${data.reference}</p>` : ''}
                        <p style="margin: 8px 0 0 0; text-align: center;"><span style="font-weight: 600;">Issued by:</span> ${data.issuedBy || 'Bursar'} | <span style="font-weight: 600;">Generated:</span> ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
            ` : ''}
            </div>
        </div>
            
        <!-- Download Section with Clear Call-to-Action -->
            ${data.receiptDownloadUrlA3 || data.receiptDownloadUrlA4 || data.receiptDownloadUrlA5 || data.feesStatementUrl ? `
            <div class="download-section">
            <div class="download-title">📋 Access Your Documents</div>
            <div class="download-subtitle">Download your payment receipt in multiple formats and complete fee statement</div>
                
            <div class="button-container">
                    ${data.receiptDownloadUrlA3 || data.receiptDownloadUrlA4 || data.receiptDownloadUrlA5 ? `
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-weight: 700; margin-bottom: 10px; color: #374151;">🧾 Payment Receipt Downloads</div>
                        <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                            ${data.receiptDownloadUrlA3 ? `
                            <a href="${data.receiptDownloadUrlA3}" style="background: #3b82f6; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; margin: 4px;">
                                📄 A3 Format
                            </a>
                            ` : ''}
                            ${data.receiptDownloadUrlA4 ? `
                            <a href="${data.receiptDownloadUrlA4}" style="background: #10b981; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; margin: 4px;">
                                📄 A4 Format
                            </a>
                            ` : ''}
                            ${data.receiptDownloadUrlA5 ? `
                            <a href="${data.receiptDownloadUrlA5}" style="background: #8b5cf6; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; margin: 4px;">
                                📄 A5 Format
                            </a>
                            ` : ''}
                        </div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">
                            PDF Downloads • Print Ready • High Quality
                        </div>
                    </div>
                    ` : ''}
                    
                    ${data.feesStatementUrl ? `
                    <div style="text-align: center;">
                    <a href="${data.feesStatementUrl}" class="download-button statement-button">
                        <span style="font-size: 20px;">📊</span>
                            <div>
                            <div style="font-weight: 700;">Download Fee Statement</div>
                            <div style="font-size: 13px; opacity: 0.9;">Complete Academic Year Summary</div>
                            </div>
                        </a>
                    </div>
                    ` : ''}
                </div>
                
            <div class="download-note">
                <strong>📋 Document Details:</strong><br>
                • <strong>Payment Receipt:</strong> Professional receipt with multiple format options (A3, A4, A5) matching bursar system<br>
                • <strong>Fee Statement:</strong> Comprehensive academic year overview including all payments and balances
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


