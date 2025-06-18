import type { 
  FeeStructure, 
  StudentFee, 
  Payment, 
  Receipt, 
  FeeStatement, 
  StudentFeesSummary 
} from "@/lib/types/fees"

// Fee Structures Management
export function saveFeeStructure(schoolCode: string, feeStructure: FeeStructure) {
  try {
    const key = `fees-structures-${schoolCode}`
    const existing = JSON.parse(localStorage.getItem(key) || "[]")
    const index = existing.findIndex((f: FeeStructure) => f.id === feeStructure.id)
    
    if (index >= 0) {
      existing[index] = feeStructure
    } else {
      existing.push(feeStructure)
    }
    
    localStorage.setItem(key, JSON.stringify(existing))
    return true
  } catch (error) {
    console.error("Error saving fee structure:", error)
    return false
  }
}

export function getFeeStructures(schoolCode: string): FeeStructure[] {
  try {
    const key = `fees-structures-${schoolCode}`
    return JSON.parse(localStorage.getItem(key) || "[]")
  } catch (error) {
    console.error("Error getting fee structures:", error)
    return []
  }
}

export function getFeeStructure(schoolCode: string, id: string): FeeStructure | null {
  try {
    const structures = getFeeStructures(schoolCode)
    return structures.find(f => f.id === id) || null
  } catch (error) {
    console.error("Error getting fee structure:", error)
    return null
  }
}

export function deleteFeeStructure(schoolCode: string, id: string) {
  try {
    const key = `fees-structures-${schoolCode}`
    const existing = JSON.parse(localStorage.getItem(key) || "[]")
    const filtered = existing.filter((f: FeeStructure) => f.id !== id)
    localStorage.setItem(key, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error("Error deleting fee structure:", error)
    return false
  }
}

// Student Fees Management
export function saveStudentFee(schoolCode: string, studentFee: StudentFee) {
  try {
    const key = `student-fees-${schoolCode}`
    const existing = JSON.parse(localStorage.getItem(key) || "[]")
    const index = existing.findIndex((f: StudentFee) => f.id === studentFee.id)
    
    if (index >= 0) {
      existing[index] = studentFee
    } else {
      existing.push(studentFee)
    }
    
    localStorage.setItem(key, JSON.stringify(existing))
    return true
  } catch (error) {
    console.error("Error saving student fee:", error)
    return false
  }
}

export function getStudentFees(schoolCode: string, studentId?: string): StudentFee[] {
  try {
    const key = `student-fees-${schoolCode}`
    const allFees = JSON.parse(localStorage.getItem(key) || "[]")
    
    if (studentId) {
      return allFees.filter((f: StudentFee) => f.studentId === studentId)
    }
    
    return allFees
  } catch (error) {
    console.error("Error getting student fees:", error)
    return []
  }
}

// Payments Management
export function savePayment(schoolCode: string, payment: Payment) {
  try {
    const key = `payments-${schoolCode}`
    const existing = JSON.parse(localStorage.getItem(key) || "[]")
    existing.push(payment)
    localStorage.setItem(key, JSON.stringify(existing))
    return true
  } catch (error) {
    console.error("Error saving payment:", error)
    return false
  }
}

export function getPayments(schoolCode: string, studentId?: string): Payment[] {
  try {
    const key = `payments-${schoolCode}`
    const allPayments = JSON.parse(localStorage.getItem(key) || "[]")
    
    if (studentId) {
      return allPayments.filter((p: Payment) => p.studentId === studentId)
    }
    
    return allPayments
  } catch (error) {
    console.error("Error getting payments:", error)
    return []
  }
}

// Receipts Management
export function saveReceipt(schoolCode: string, receipt: Receipt) {
  try {
    const key = `receipts-${schoolCode}`
    const existing = JSON.parse(localStorage.getItem(key) || "[]")
    existing.push(receipt)
    localStorage.setItem(key, JSON.stringify(existing))
    return true
  } catch (error) {
    console.error("Error saving receipt:", error)
    return false
  }
}

export function getReceipts(schoolCode: string, studentId?: string): Receipt[] {
  try {
    const key = `receipts-${schoolCode}`
    const allReceipts = JSON.parse(localStorage.getItem(key) || "[]")
    
    if (studentId) {
      return allReceipts.filter((r: Receipt) => r.studentId === studentId)
    }
    
    return allReceipts
  } catch (error) {
    console.error("Error getting receipts:", error)
    return []
  }
}

// Fee Statements Management
export function saveFeeStatement(schoolCode: string, statement: FeeStatement) {
  try {
    const key = `fee-statements-${schoolCode}`
    const existing = JSON.parse(localStorage.getItem(key) || "[]")
    const index = existing.findIndex((s: FeeStatement) => s.id === statement.id)
    
    if (index >= 0) {
      existing[index] = statement
    } else {
      existing.push(statement)
    }
    
    localStorage.setItem(key, JSON.stringify(existing))
    return true
  } catch (error) {
    console.error("Error saving fee statement:", error)
    return false
  }
}

export function getFeeStatements(schoolCode: string, studentId?: string): FeeStatement[] {
  try {
    const key = `fee-statements-${schoolCode}`
    const allStatements = JSON.parse(localStorage.getItem(key) || "[]")
    
    if (studentId) {
      return allStatements.filter((s: FeeStatement) => s.studentId === studentId)
    }
    
    return allStatements
  } catch (error) {
    console.error("Error getting fee statements:", error)
    return []
  }
}

// Utility Functions
export function generateReceiptNumber(schoolCode: string): string {
  const receipts = getReceipts(schoolCode)
  const year = new Date().getFullYear()
  const count = receipts.filter(r => r.createdAt.startsWith(year.toString())).length + 1
  return `RCP-${schoolCode.toUpperCase()}-${year}-${count.toString().padStart(4, '0')}`
}

export function generatePaymentNumber(schoolCode: string): string {
  const payments = getPayments(schoolCode)
  const year = new Date().getFullYear()
  const count = payments.filter(p => p.createdAt.startsWith(year.toString())).length + 1
  return `PAY-${schoolCode.toUpperCase()}-${year}-${count.toString().padStart(4, '0')}`
}

export function calculateStudentFeesSummary(schoolCode: string, studentId: string): StudentFeesSummary {
  const studentFees = getStudentFees(schoolCode, studentId)
  const payments = getPayments(schoolCode, studentId)
  
  const totalFees = studentFees.reduce((sum, fee) => sum + fee.amount, 0)
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalBalance = totalFees - totalPaid
  
  const overdueFees = studentFees.filter(fee => 
    fee.status === 'overdue' && new Date(fee.dueDate) < new Date()
  )
  const overdueAmount = overdueFees.reduce((sum, fee) => sum + fee.balance, 0)
  
  const nextDueFee = studentFees
    .filter(fee => fee.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
  
  const lastPayment = payments
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0]
  
  return {
    studentId,
    totalFees,
    totalPaid,
    totalBalance,
    overdueAmount,
    nextDueDate: nextDueFee?.dueDate,
    lastPaymentDate: lastPayment?.paymentDate
  }
} 