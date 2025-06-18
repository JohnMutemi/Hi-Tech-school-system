import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Database file path
const DB_FILE = path.join(process.cwd(), 'data', 'edusms.json')

// Read database
function readDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    return { schools: [], users: [], students: [], classes: [], feeStructures: [], studentFees: [], payments: [], receipts: [] }
  }
  const data = fs.readFileSync(DB_FILE, 'utf8')
  return JSON.parse(data)
}

// Write database
function writeDatabase(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    const data = readDatabase()
    
    const schoolIndex = data.schools.findIndex((s: any) => s.code === schoolCode)
    
    if (schoolIndex === -1) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Toggle the status
    const currentStatus = data.schools[schoolIndex].status
    const newStatus = currentStatus === "active" ? "suspended" : "active"
    
    data.schools[schoolIndex] = {
      ...data.schools[schoolIndex],
      status: newStatus,
      updatedAt: new Date().toISOString()
    }

    writeDatabase(data)
    
    return NextResponse.json({ 
      success: true, 
      message: `School status updated to ${newStatus}`,
      status: newStatus
    })
  } catch (error) {
    console.error('Error toggling school status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 