// Script to populate sample fees data in localStorage
// Run this in the browser console to add test fees, payments, and receipts

const sampleFeeStructures = [
  {
    id: "fee_1",
    name: "Tuition Fee",
    description: "Monthly tuition fee for all students",
    amount: 15000,
    frequency: "monthly",
    dueDate: "2024-02-01",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "fee_2", 
    name: "Development Fee",
    description: "Annual development fee for school infrastructure",
    amount: 25000,
    frequency: "annually",
    dueDate: "2024-03-01",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: "fee_3",
    name: "Library Fee",
    description: "Quarterly library maintenance fee",
    amount: 5000,
    frequency: "quarterly",
    dueDate: "2024-02-15",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
]

const sampleStudentFees = [
  {
    id: "student_fee_1",
    studentId: "student_1",
    feeStructureId: "fee_1",
    amount: 15000,
    dueDate: "2024-02-01",
    status: "paid",
    balance: 0,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "student_fee_2",
    studentId: "student_1", 
    feeStructureId: "fee_2",
    amount: 25000,
    dueDate: "2024-03-01",
    status: "pending",
    balance: 25000,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "student_fee_3",
    studentId: "student_2",
    feeStructureId: "fee_1",
    amount: 15000,
    dueDate: "2024-02-01",
    status: "overdue",
    balance: 15000,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z"
  }
]

const samplePayments = [
  {
    id: "payment_1",
    studentId: "student_1",
    amount: 15000,
    paymentDate: "2024-01-20",
    paymentMethod: "bank_transfer",
    referenceNumber: "BANK123456",
    receiptNumber: "RCP-ABC1234-2024-0001",
    description: "January 2024 Tuition Fee",
    receivedBy: "John Smith",
    createdAt: "2024-01-20T10:00:00.000Z"
  },
  {
    id: "payment_2",
    studentId: "student_1",
    amount: 5000,
    paymentDate: "2024-01-25",
    paymentMethod: "mobile_money",
    referenceNumber: "MPESA789012",
    receiptNumber: "RCP-ABC1234-2024-0002",
    description: "Partial Development Fee",
    receivedBy: "Maria Garcia",
    createdAt: "2024-01-25T14:30:00.000Z"
  }
]

const sampleReceipts = [
  {
    id: "receipt_1",
    paymentId: "payment_1",
    studentId: "student_1",
    receiptNumber: "RCP-ABC1234-2024-0001",
    amount: 15000,
    balance: 25000,
    balanceCarriedForward: 40000,
    paymentDate: "2024-01-20",
    format: "A4",
    createdAt: "2024-01-20T10:00:00.000Z"
  },
  {
    id: "receipt_2",
    paymentId: "payment_2",
    studentId: "student_1",
    receiptNumber: "RCP-ABC1234-2024-0002",
    amount: 5000,
    balance: 20000,
    balanceCarriedForward: 25000,
    paymentDate: "2024-01-25",
    format: "A4",
    createdAt: "2024-01-25T14:30:00.000Z"
  }
]

const sampleFeeStatements = [
  {
    id: "statement_1",
    studentId: "student_1",
    period: "January 2024",
    openingBalance: 40000,
    totalCharged: 15000,
    totalPaid: 20000,
    closingBalance: 35000,
    transactions: [
      {
        date: "2024-01-01",
        description: "January Tuition Fee",
        debit: 15000,
        credit: 0,
        balance: 55000
      },
      {
        date: "2024-01-20",
        description: "Payment - Bank Transfer",
        debit: 0,
        credit: 15000,
        balance: 40000
      },
      {
        date: "2024-01-25",
        description: "Payment - Mobile Money",
        debit: 0,
        credit: 5000,
        balance: 35000
      }
    ],
    generatedAt: "2024-01-31T23:59:59.000Z"
  }
]

function populateFeesData() {
  try {
    const schoolCode = "ABC1234" // Default school code
    
    // Save fee structures
    localStorage.setItem(`fees-structures-${schoolCode}`, JSON.stringify(sampleFeeStructures))
    
    // Save student fees
    localStorage.setItem(`student-fees-${schoolCode}`, JSON.stringify(sampleStudentFees))
    
    // Save payments
    localStorage.setItem(`payments-${schoolCode}`, JSON.stringify(samplePayments))
    
    // Save receipts
    localStorage.setItem(`receipts-${schoolCode}`, JSON.stringify(sampleReceipts))
    
    // Save fee statements
    localStorage.setItem(`fee-statements-${schoolCode}`, JSON.stringify(sampleFeeStatements))
    
    console.log("✅ Sample fees data added successfully!")
    console.log("Fee structures:", sampleFeeStructures.length)
    console.log("Student fees:", sampleStudentFees.length)
    console.log("Payments:", samplePayments.length)
    console.log("Receipts:", sampleReceipts.length)
    console.log("Fee statements:", sampleFeeStatements.length)
    
    return true
  } catch (error) {
    console.error("❌ Error adding fees data:", error)
    return false
  }
}

function clearFeesData() {
  try {
    const schoolCode = "ABC1234"
    
    localStorage.removeItem(`fees-structures-${schoolCode}`)
    localStorage.removeItem(`student-fees-${schoolCode}`)
    localStorage.removeItem(`payments-${schoolCode}`)
    localStorage.removeItem(`receipts-${schoolCode}`)
    localStorage.removeItem(`fee-statements-${schoolCode}`)
    
    console.log("✅ All fees data cleared!")
    return true
  } catch (error) {
    console.error("❌ Error clearing fees data:", error)
    return false
  }
}

function viewFeesData() {
  try {
    const schoolCode = "ABC1234"
    
    const feeStructures = JSON.parse(localStorage.getItem(`fees-structures-${schoolCode}`) || "[]")
    const studentFees = JSON.parse(localStorage.getItem(`student-fees-${schoolCode}`) || "[]")
    const payments = JSON.parse(localStorage.getItem(`payments-${schoolCode}`) || "[]")
    const receipts = JSON.parse(localStorage.getItem(`receipts-${schoolCode}`) || "[]")
    const statements = JSON.parse(localStorage.getItem(`fee-statements-${schoolCode}`) || "[]")
    
    console.log("📊 Current fees data in localStorage:")
    console.log("Fee structures:", feeStructures)
    console.log("Student fees:", studentFees)
    console.log("Payments:", payments)
    console.log("Receipts:", receipts)
    console.log("Fee statements:", statements)
    
    return { feeStructures, studentFees, payments, receipts, statements }
  } catch (error) {
    console.error("❌ Error reading fees data:", error)
    return {}
  }
}

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.populateFeesData = populateFeesData
  window.clearFeesData = clearFeesData
  window.viewFeesData = viewFeesData
  
  console.log("🎯 Fees data functions available:")
  console.log("- populateFeesData() - Add sample fees data")
  console.log("- clearFeesData() - Clear all fees data")
  console.log("- viewFeesData() - View current fees data")
}

module.exports = {
  populateFeesData,
  clearFeesData,
  viewFeesData,
  sampleFeeStructures,
  sampleStudentFees,
  samplePayments,
  sampleReceipts,
  sampleFeeStatements
} 