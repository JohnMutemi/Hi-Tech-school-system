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

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    const data = readDatabase()
    
    const school = data.schools.find((s: any) => s.code === schoolCode)
    
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }
    
    // Transform to match the expected SchoolData interface
    const schoolData = {
      id: school.id,
      schoolCode: school.code,
      name: school.name,
      colorTheme: school.colorTheme,
      portalUrl: `/schools/${school.code}`,
      description: school.description,
      adminEmail: school.adminEmail,
      adminPassword: school.adminPassword,
      adminFirstName: school.adminFirstName,
      adminLastName: school.adminLastName,
      createdAt: school.createdAt,
      status: school.status,
      profile: {
        address: school.address,
        phone: school.phone,
        email: school.email,
        principalName: school.adminFirstName + ' ' + school.adminLastName,
        establishedYear: '2020',
        description: school.description || '',
        type: 'secondary' as const
      }
    }
    
    return NextResponse.json(schoolData)
  } catch (error) {
    console.error('Error fetching school:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    const body = await request.json()
    const { name, address, phone, email, website, principalName, establishedYear, description, motto } = body

    if (!name || !address || !phone || !email) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const data = readDatabase()
    const schoolIndex = data.schools.findIndex((s: any) => s.code === schoolCode)
    
    if (schoolIndex === -1) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Update the school
    data.schools[schoolIndex] = {
      ...data.schools[schoolIndex],
      name,
      address,
      phone,
      email,
      adminEmail: email,
      adminFirstName: principalName?.split(" ")[0] || name.split(" ")[0] || "Admin",
      adminLastName: principalName?.split(" ").slice(1).join(" ") || name.split(" ").slice(1).join(" ") || "User",
      description: description || data.schools[schoolIndex].description,
      updatedAt: new Date().toISOString()
    }

    writeDatabase(data)
    
    return NextResponse.json({ success: true, message: "School updated successfully" })
  } catch (error) {
    console.error('Error updating school:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Remove the school
    data.schools.splice(schoolIndex, 1)
    writeDatabase(data)
    
    return NextResponse.json({ success: true, message: "School deleted successfully" })
  } catch (error) {
    console.error('Error deleting school:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
