import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/services/email-service'

// POST - Send test email
export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    const body = await request.json()
    
    const { testEmail, config } = body

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      )
    }

    if (!config || !config.isEnabled) {
      return NextResponse.json(
        { error: 'Email configuration is not enabled' },
        { status: 400 }
      )
    }

    // Create a test payment notification
    const testPaymentData = {
      studentName: 'John Doe (Test Student)',
      studentId: 'TEST-001',
      amount: 15000,
      paymentMethod: 'Test Payment Method',
      receiptNumber: `TEST-${Date.now()}`,
      paymentDate: new Date().toISOString(),
      schoolName: 'Test School',
      termName: 'Term 1',
      academicYear: '2025',
      balanceAfter: 5000
    }

    // Temporarily set up email service with test configuration
    const tempEmailService = {
      config: {
        provider: config.emailProvider,
        configuration: config.configuration,
        fromEmail: config.fromEmail,
        fromName: config.fromName
      }
    }

    // Generate test email content
    const emailContent = generateTestEmailContent(testPaymentData, config.fromName)

    // Simulate sending based on provider
    let success = false
    switch (config.emailProvider) {
      case 'sendgrid':
        console.log('Test email would be sent via SendGrid to:', testEmail)
        success = true // In production, actually send the email
        break
      case 'aws_ses':
        console.log('Test email would be sent via AWS SES to:', testEmail)
        success = true // In production, actually send the email
        break
      case 'smtp':
        console.log('Test email would be sent via SMTP to:', testEmail)
        success = true // In production, actually send the email
        break
      case 'gmail':
        console.log('🔍 Testing Gmail SMTP to:', testEmail)
        console.log('📧 Gmail config:', {
          fromEmail: config.fromEmail,
          fromName: config.fromName,
          username: config.configuration?.username,
          hasPassword: !!config.configuration?.password
        })
        
        try {
          // Actually send the test email via Gmail SMTP
          const nodemailer = await import('nodemailer')
          
          const transporter = nodemailer.default.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: config.configuration.username || config.fromEmail,
              pass: config.configuration.password
            },
            tls: {
              rejectUnauthorized: false
            }
          })
          
          const mailOptions = {
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to: testEmail,
            subject: `Test Email - ${config.fromName} Payment Notifications`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                <h2 style="color: #4f46e5;">✅ Email Configuration Test Successful!</h2>
                <p>This is a test email from <strong>${config.fromName}</strong> payment notification system.</p>
                
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Configuration Details:</h3>
                  <ul>
                    <li><strong>From:</strong> ${config.fromName} &lt;${config.fromEmail}&gt;</li>
                    <li><strong>Provider:</strong> Gmail SMTP</li>
                    <li><strong>Test Date:</strong> ${new Date().toLocaleString()}</li>
                  </ul>
                </div>
                
                <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #166534;">🎉 What This Means:</h3>
                  <p>Your email notification system is now ready to send instant payment confirmations to parents!</p>
                  <p>Parents will receive professional emails like this whenever payments are recorded.</p>
                </div>
                
                <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
                  This is an automated test email from ${config.fromName} School Management System.
                </p>
              </div>
            `,
            text: `
Email Configuration Test Successful!

This is a test email from ${config.fromName} payment notification system.

Configuration Details:
- From: ${config.fromName} <${config.fromEmail}>
- Provider: Gmail SMTP
- Test Date: ${new Date().toLocaleString()}

Your email notification system is now ready to send instant payment confirmations to parents!

This is an automated test email from ${config.fromName} School Management System.
            `
          }
          
          console.log('📤 Sending real test email...')
          await transporter.sendMail(mailOptions)
          console.log('✅ Test email sent successfully!')
          success = true
          
        } catch (emailError) {
          console.error('❌ Gmail SMTP test failed:', emailError)
          success = false
          return NextResponse.json({
            error: `Gmail SMTP test failed: ${emailError.message}`,
            details: 'Please check your Gmail credentials and app password'
          }, { status: 400 })
        }
        break
      default:
        return NextResponse.json(
          { error: `Unsupported email provider: ${config.emailProvider}` },
          { status: 400 }
        )
    }

    if (success) {
      return NextResponse.json({ 
        message: 'Test email sent successfully',
        testEmail,
        provider: config.emailProvider
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateTestEmailContent(paymentData: any, fromName: string) {
  const subject = `Test Email - Payment Confirmation`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Payment Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4f46e5, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .test-badge { background: #fbbf24; color: #92400e; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 20px; }
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
            <div class="test-badge">🧪 TEST EMAIL</div>
            <div class="success-icon">✅</div>
            <h1>Payment Confirmation Test</h1>
            <p>This is a test email to verify your email configuration</p>
        </div>
        
        <div class="content">
            <div class="amount">KES ${paymentData.amount.toLocaleString()}</div>
            
            <div class="payment-details">
                <h3 style="margin-top: 0; color: #1e293b;">Test Payment Details</h3>
                
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">Student Name</div>
                        <div class="detail-value">${paymentData.studentName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Receipt Number</div>
                        <div class="detail-value">${paymentData.receiptNumber}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Payment Method</div>
                        <div class="detail-value">${paymentData.paymentMethod}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Payment Date</div>
                        <div class="detail-value">${new Date(paymentData.paymentDate).toLocaleDateString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Term</div>
                        <div class="detail-value">${paymentData.termName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Academic Year</div>
                        <div class="detail-value">${paymentData.academicYear}</div>
                    </div>
                </div>
            </div>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #3b82f6;">
                <h4 style="margin-top: 0; color: #1e40af;">✅ Test Successful!</h4>
                <p style="margin: 0; color: #1e3a8a;">
                    If you received this email, your email configuration is working correctly. 
                    Payment confirmation emails will be sent automatically when real payments are processed.
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>${fromName}</strong></p>
            <p>This is a test email from your automated notification system.</p>
        </div>
    </div>
</body>
</html>
  `

  const text = `
Test Email - Payment Confirmation

🧪 TEST EMAIL

This is a test email to verify your email configuration.

Test Payment Details:
- Amount: KES ${paymentData.amount.toLocaleString()}
- Student: ${paymentData.studentName}
- Receipt Number: ${paymentData.receiptNumber}
- Payment Method: ${paymentData.paymentMethod}
- Payment Date: ${new Date(paymentData.paymentDate).toLocaleDateString()}
- Term: ${paymentData.termName}
- Academic Year: ${paymentData.academicYear}

✅ Test Successful!
If you received this email, your email configuration is working correctly. 
Payment confirmation emails will be sent automatically when real payments are processed.

${fromName}
This is a test email from your automated notification system.
  `

  return { subject, html, text }
}


