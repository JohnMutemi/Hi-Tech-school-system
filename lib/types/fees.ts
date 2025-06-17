export interface FeeStructure {
  id: string
  name: string
  description: string
  amount: number
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time'
  dueDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StudentFee {
  id: string
  studentId: string
  feeStructureId: string
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue' | 'partial'
  balance: number
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  studentId: string
  amount: number
  paymentDate: string
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check'
  referenceNumber?: string
  receiptNumber: string
  description: string
  receivedBy: string
  createdAt: string
}

export interface Receipt {
  id: string
  paymentId: string
  studentId: string
  receiptNumber: string
  amount: number
  balance: number
  balanceCarriedForward: number
  paymentDate: string
  format: 'A3' | 'A4' | 'A5'
  createdAt: string
}

export interface FeeStatement {
  id: string
  studentId: string
  period: string
  openingBalance: number
  totalCharged: number
  totalPaid: number
  closingBalance: number
  transactions: Array<{
    date: string
    description: string
    debit: number
    credit: number
    balance: number
  }>
  generatedAt: string
}

export interface StudentFeesSummary {
  studentId: string
  totalFees: number
  totalPaid: number
  totalBalance: number
  overdueAmount: number
  nextDueDate?: string
  lastPaymentDate?: string
} 