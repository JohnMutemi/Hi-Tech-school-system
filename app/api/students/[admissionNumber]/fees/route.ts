import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { admissionNumber: string } }
) {
  try {
    const { admissionNumber } = params
    
    // Read the JSON data
    const dataPath = path.join(process.cwd(), 'data', 'edusms.json')
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    
    // Find the student by admission number
    const student = jsonData.students.find((s: any) => s.admissionNumber === admissionNumber)
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    
    // Get fees for this student
    const studentFees = jsonData.studentFees.filter((f: any) => f.studentId === student.id)
    
    // Get payments for this student
    const payments = jsonData.payments.filter((p: any) => p.studentId === student.id)
    
    // Get receipts for this student
    const receipts = jsonData.receipts.filter((r: any) => r.studentId === student.id)
    
    // Get fee statements for this student
    const feeStatements = jsonData.feeStatements.filter((s: any) => s.studentId === student.id)
    
    return NextResponse.json({
      student,
      fees: studentFees,
      payments,
      receipts,
      feeStatements
    })
  } catch (error) {
    console.error('Error fetching student fees:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 