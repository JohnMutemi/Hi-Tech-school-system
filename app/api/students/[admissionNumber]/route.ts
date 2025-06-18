import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Database file path
const DB_FILE = path.join(process.cwd(), 'data', 'edusms.json')

// Read database
function readDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    return { schools: [], users: [], students: [], classes: [], feeStructures: [], studentFees: [], payments: [], receipts: [], feeStatements: [] }
  }
  const data = fs.readFileSync(DB_FILE, 'utf8')
  return JSON.parse(data)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { admissionNumber: string } }
) {
  try {
    const { admissionNumber } = params
    const data = readDatabase()
    
    // Find student by admission number
    const student = data.students.find((s: any) => s.admissionNumber === admissionNumber)
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Find associated user
    const user = data.users.find((u: any) => u.id === student.userId)
    
    // Find school
    const school = data.schools.find((s: any) => s.id === student.schoolId)
    
    // Find class
    const classData = data.classes.find((c: any) => c.id === student.classId)
    
    // Find student fees
    const studentFees = data.studentFees.filter((sf: any) => sf.studentId === student.id)
    
    // Find payments
    const payments = data.payments.filter((p: any) => p.studentId === student.id)
    
    // Find receipts
    const receipts = data.receipts.filter((r: any) => r.studentId === student.id)
    
    // Find fee statements
    const feeStatements = data.feeStatements.filter((fs: any) => fs.studentId === student.id)
    
    // Calculate totals
    const totalFees = studentFees.reduce((sum: number, fee: any) => sum + fee.amount, 0)
    const totalPaid = payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
    const totalBalance = totalFees - totalPaid
    
    const studentData = {
      id: student.id,
      admissionNumber: student.admissionNumber,
      name: user?.name || student.parentName,
      email: user?.email,
      phone: user?.phone,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      address: student.address,
      dateAdmitted: student.dateAdmitted,
      status: student.status,
      school: {
        id: school?.id,
        name: school?.name,
        code: school?.code,
        colorTheme: school?.colorTheme
      },
      class: classData ? {
        id: classData.id,
        name: classData.name,
        level: classData.level
      } : null,
      fees: {
        total: totalFees,
        paid: totalPaid,
        balance: totalBalance,
        items: studentFees.map((fee: any) => {
          const feeStructure = data.feeStructures.find((fs: any) => fs.id === fee.feeStructureId)
          return {
            id: fee.id,
            name: feeStructure?.name,
            description: feeStructure?.description,
            amount: fee.amount,
            balance: fee.balance,
            dueDate: fee.dueDate,
            status: fee.status,
            frequency: feeStructure?.frequency
          }
        })
      },
      payments: payments.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
        status: payment.status,
        paymentDate: payment.paymentDate,
        notes: payment.notes
      })),
      receipts: receipts.map((receipt: any) => ({
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        amount: receipt.amount,
        generatedAt: receipt.generatedAt
      })),
      statements: feeStatements.map((statement: any) => ({
        id: statement.id,
        period: statement.period,
        totalAmount: statement.totalAmount,
        paidAmount: statement.paidAmount,
        balance: statement.balance,
        generatedAt: statement.generatedAt
      }))
    }
    
    return NextResponse.json(studentData)
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 