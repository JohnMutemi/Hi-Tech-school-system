import { NextResponse } from "next/server"
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

export async function GET() {
  try {
    const data = readDatabase()
    
    // Transform schools to match the expected SchoolData interface
    const schools = data.schools.map((school: any) => ({
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
    }))
    
    return NextResponse.json({ 
      schools: schools,
      count: schools.length
    })
  } catch (error) {
    console.error("Error in schools API:", error)
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, address, phone, email, code, colorTheme, description, website, principalName, establishedYear, motto } = body

    if (!name || !address || !phone || !email) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 })
    }

    const data = readDatabase()
    
    // Check if school code already exists
    const schoolCode = code || generateSchoolCode(name)
    const existingSchool = data.schools.find((s: any) => s.code === schoolCode)
    if (existingSchool) {
      return NextResponse.json({ error: "School with this code already exists" }, { status: 400 })
    }

    // Check if email already exists
    const existingEmail = data.schools.find((s: any) => s.adminEmail === email)
    if (existingEmail) {
      return NextResponse.json({ error: "School with this email already exists" }, { status: 400 })
    }

    const tempPassword = generateTempPassword()
    const newSchool = {
      id: `school-${Date.now()}`,
      name,
      code: schoolCode,
      address,
      phone,
      email,
      adminEmail: email,
      adminPassword: tempPassword,
      adminFirstName: principalName?.split(" ")[0] || name.split(" ")[0] || "Admin",
      adminLastName: principalName?.split(" ").slice(1).join(" ") || name.split(" ").slice(1).join(" ") || "User",
      status: "setup",
      colorTheme: colorTheme || "#3b82f6",
      description: description || "",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    data.schools.push(newSchool)
    writeDatabase(data)

    return NextResponse.json({
      success: true,
      schoolCode,
      tempPassword,
      portalUrl: `/schools/${schoolCode}`,
      message: "School created successfully",
      school: newSchool
    })
  } catch (error) {
    console.error("Error creating school:", error)
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 })
  }
}

// Helper functions
function generateSchoolCode(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 8)
}

function generateTempPassword(): string {
  return Math.random().toString(36).substring(2, 8)
}
