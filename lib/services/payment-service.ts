import { Payment } from "../types/fees"

// Helper function to generate a unique receipt number
function generateReceiptNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `RCPT-${timestamp}-${random}`
}

// Helper function to get payments from localStorage
function getPayments(schoolCode: string, studentId: string): Payment[] {
  const key = `payments-${schoolCode}-${studentId}`
  const payments = localStorage.getItem(key)
  return payments ? JSON.parse(payments) : []
}

// Helper function to save payments to localStorage
function savePayments(schoolCode: string, studentId: string, payments: Payment[]) {
  const key = `payments-${schoolCode}-${studentId}`
  localStorage.setItem(key, JSON.stringify(payments))
}

export const PaymentService = {
  // Create a new payment
  createPayment: (
    schoolCode: string,
    studentId: string,
    paymentData: Partial<Payment>
  ): Payment => {
    const payments = getPayments(schoolCode, studentId)
    
    const payment: Payment = {
      id: Date.now().toString(),
      studentId,
      amount: paymentData.amount || 0,
      paymentDate: paymentData.paymentDate || new Date().toISOString(),
      paymentMethod: paymentData.paymentMethod || 'cash',
      referenceNumber: paymentData.referenceNumber,
      receiptNumber: generateReceiptNumber(),
      description: paymentData.description || 'School fees payment',
      receivedBy: paymentData.receivedBy || '',
      createdAt: new Date().toISOString()
    }

    payments.push(payment)
    savePayments(schoolCode, studentId, payments)

    return payment
  },

  // Get payment history for a student
  getPaymentHistory: (schoolCode: string, studentId: string): Payment[] => {
    return getPayments(schoolCode, studentId).sort((a, b) => 
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    )
  },

  // Get a specific payment by ID
  getPayment: (schoolCode: string, studentId: string, paymentId: string): Payment | null => {
    const payments = getPayments(schoolCode, studentId)
    return payments.find(p => p.id === paymentId) || null
  }
} 