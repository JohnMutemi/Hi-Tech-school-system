import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { schools } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { randomBytes } from "crypto"

function generateSchoolCode(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 8)
}

function generateTempPassword(): string {
  return randomBytes(4).toString("hex") // 8 chars
}

// GET handler removed for now to fix linter error

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, address, phone, email, code, colorTheme, description, website, principalName, establishedYear, motto } = body

    if (!name || !address || !phone || !email) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 })
    }

    // Check if school code or email already exists
    const schoolCode = code || generateSchoolCode(name)
    const existingSchool = await db.select().from(schools).where(eq(schools.code, schoolCode)).limit(1)
    if (existingSchool.length > 0) {
      return NextResponse.json({ error: "School with this code already exists" }, { status: 400 })
    }
    const existingEmail = await db.select().from(schools).where(eq(schools.adminEmail, email)).limit(1)
    if (existingEmail.length > 0) {
      return NextResponse.json({ error: "School with this email already exists" }, { status: 400 })
    }

    const tempPassword = generateTempPassword()
    const adminFirstName = principalName?.split(" ")[0] || name.split(" ")[0] || "Admin"
    const adminLastName = principalName?.split(" ").slice(1).join(" ") || name.split(" ").slice(1).join(" ") || "User"

    const newSchool = {
      name,
      code: schoolCode,
      address,
      phone,
      email,
      colorTheme: colorTheme || "#3b82f6",
      description: description || "",
      adminFirstName,
      adminLastName,
      adminEmail: email,
      adminPassword: tempPassword,
      status: "setup",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      // logo, profile, etc. can be added if needed
    }

    const inserted = await db.insert(schools).values(newSchool).returning()
    const school = inserted[0]

    return NextResponse.json({
      success: true,
      schoolCode,
      tempPassword,
      portalUrl: `/schools/${schoolCode}`,
      message: "School created successfully",
      school
    })
  } catch (error) {
    console.error("Error creating school:", error)
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 })
  }
}
