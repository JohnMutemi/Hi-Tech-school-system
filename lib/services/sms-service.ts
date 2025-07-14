import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// SMS Provider Configuration
interface SMSConfig {
  provider: 'africas_talking' | 'twilio' | 'simulation';
  apiKey?: string;
  apiSecret?: string;
  senderId?: string;
  phoneNumber?: string;
}

// SMS Message Template
interface SMSMessage {
  to: string;
  message: string;
  reference?: string;
}

export class SMSService {
  private static config: SMSConfig = {
    provider: 'simulation', // Default to simulation for development
    apiKey: process.env.SMS_API_KEY,
    apiSecret: process.env.SMS_API_SECRET,
    senderId: process.env.SMS_SENDER_ID || 'SCHOOL',
    phoneNumber: process.env.SMS_PHONE_NUMBER,
  };

  /**
   * Initialize SMS service with configuration
   */
  static initialize(config: Partial<SMSConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send payment confirmation SMS to parent
   */
  static async sendPaymentConfirmation(
    parentPhone: string,
    parentName: string,
    studentName: string,
    amount: number,
    paymentDate: Date,
    schoolName: string,
    paymentMethod: string = 'payment'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const formattedAmount = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
      }).format(amount);

      const formattedDate = paymentDate.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const message = `Dear ${parentName}, your ${paymentMethod} of ${formattedAmount} for ${studentName} on ${formattedDate} has been received. Thank you. - ${schoolName}`;

      return await this.sendSMS({
        to: parentPhone,
        message,
        reference: `PAYMENT-${Date.now()}`
      });
    } catch (error) {
      console.error('SMS payment confirmation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed'
      };
    }
  }

  /**
   * Send manual payment entry confirmation
   */
  static async sendManualPaymentConfirmation(
    parentPhone: string,
    parentName: string,
    studentName: string,
    amount: number,
    paymentDate: Date,
    schoolName: string,
    receiptNumber: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const formattedAmount = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
      }).format(amount);

      const formattedDate = paymentDate.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const message = `Dear ${parentName}, your cash payment of ${formattedAmount} for ${studentName} on ${formattedDate} has been received. Receipt: ${receiptNumber}. Thank you. - ${schoolName}`;

      return await this.sendSMS({
        to: parentPhone,
        message,
        reference: `MANUAL-${receiptNumber}`
      });
    } catch (error) {
      console.error('SMS manual payment confirmation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed'
      };
    }
  }

  /**
   * Send fee reminder SMS
   */
  static async sendFeeReminder(
    parentPhone: string,
    parentName: string,
    studentName: string,
    outstandingAmount: number,
    schoolName: string,
    dueDate?: Date
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const formattedAmount = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
      }).format(outstandingAmount);

      let message = `Dear ${parentName}, ${studentName} has outstanding fees of ${formattedAmount}. Please make payment to avoid any inconveniences. - ${schoolName}`;

      if (dueDate) {
        const formattedDueDate = dueDate.toLocaleDateString('en-KE', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        message = `Dear ${parentName}, ${studentName} has outstanding fees of ${formattedAmount} due on ${formattedDueDate}. Please make payment to avoid any inconveniences. - ${schoolName}`;
      }

      return await this.sendSMS({
        to: parentPhone,
        message,
        reference: `REMINDER-${Date.now()}`
      });
    } catch (error) {
      console.error('SMS fee reminder error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed'
      };
    }
  }

  /**
   * Core SMS sending method
   */
  private static async sendSMS(smsMessage: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      switch (this.config.provider) {
        case 'africas_talking':
          return await this.sendViaAfricasTalking(smsMessage);
        case 'twilio':
          return await this.sendViaTwilio(smsMessage);
        case 'simulation':
        default:
          return await this.sendViaSimulation(smsMessage);
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed'
      };
    }
  }

  /**
   * Send SMS via Africa's Talking
   */
  private static async sendViaAfricasTalking(smsMessage: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.config.apiKey || !this.config.apiSecret) {
        throw new Error('Africa\'s Talking API credentials not configured');
      }

      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.config.apiKey,
        },
        body: new URLSearchParams({
          username: this.config.apiSecret,
          to: smsMessage.to,
          message: smsMessage.message,
          from: this.config.senderId || 'SCHOOL',
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.SMSMessageData) {
        return {
          success: true,
          messageId: result.SMSMessageData.Recipients[0]?.messageId
        };
      } else {
        throw new Error(result.errorMessage || 'Africa\'s Talking API error');
      }
    } catch (error) {
      console.error('Africa\'s Talking SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Africa\'s Talking SMS failed'
      };
    }
  }

  /**
   * Send SMS via Twilio
   */
  private static async sendViaTwilio(smsMessage: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.config.apiKey || !this.config.apiSecret || !this.config.phoneNumber) {
        throw new Error('Twilio API credentials not configured');
      }

      const auth = btoa(`${this.config.apiKey}:${this.config.apiSecret}`);
      
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.config.apiKey}/Messages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`,
        },
        body: new URLSearchParams({
          To: smsMessage.to,
          From: this.config.phoneNumber,
          Body: smsMessage.message,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.sid) {
        return {
          success: true,
          messageId: result.sid
        };
      } else {
        throw new Error(result.error_message || 'Twilio API error');
      }
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Twilio SMS failed'
      };
    }
  }

  /**
   * Send SMS via simulation (for development/testing)
   */
  private static async sendViaSimulation(smsMessage: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const messageId = `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('📱 [SMS SIMULATION] Message sent:', {
        to: smsMessage.to,
        message: smsMessage.message,
        messageId,
        reference: smsMessage.reference,
        timestamp: new Date().toISOString()
      });

      // Log to database for tracking (optional)
      // Note: SMSLog model needs to be added to schema for this to work
      // try {
      //   await prisma.smsLog.create({
      //     data: {
      //       phoneNumber: smsMessage.to,
      //       message: smsMessage.message,
      //       messageId,
      //       reference: smsMessage.reference,
      //       status: 'delivered',
      //       provider: 'simulation',
      //       sentAt: new Date()
      //     }
      //   });
      // } catch (dbError) {
      //   console.warn('Failed to log SMS to database:', dbError);
      // }

      return {
        success: true,
        messageId
      };
    } catch (error) {
      console.error('SMS simulation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS simulation failed'
      };
    }
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phone: string): boolean {
    // Basic validation for Kenyan phone numbers
    const kenyanPhoneRegex = /^(\+254|254|0)?([17]\d{8})$/;
    return kenyanPhoneRegex.test(phone);
  }

  /**
   * Format phone number to international format
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Convert to international format
    if (cleaned.startsWith('254')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+254${cleaned.substring(1)}`;
    } else if (cleaned.length === 9) {
      return `+254${cleaned}`;
    }
    
    return phone; // Return as-is if can't format
  }
}

// SMS Log model for tracking (add to schema if needed)
// model SMSLog {
//   id          String   @id @default(uuid())
//   phoneNumber String
//   message     String
//   messageId   String?
//   reference   String?
//   status      String   @default("pending")
//   provider    String
//   sentAt      DateTime @default(now())
//   deliveredAt DateTime?
//   error       String?
// } 