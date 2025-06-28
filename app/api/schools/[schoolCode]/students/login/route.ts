import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { sign } from "jsonwebtoken"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { admissionNumber, email, password } = await request.json()
    let schoolCode = params.schoolCode.toLowerCase()
    
    // Decode URL-encoded school code
    try {
      schoolCode = decodeURIComponent(schoolCode)
    } catch (e) {
      console.error('Failed to decode school code:', schoolCode)
    }

    console.log('Student login attempt:', { schoolCode, admissionNumber, email, hasPassword: !!password })

    // Validate school code
    if (!schoolCode || schoolCode.includes('%20') || schoolCode.length < 2) {
      console.error('Invalid school code:', schoolCode)
      return NextResponse.json({ error: "Invalid school code" }, { status: 400 })
    }

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
      include: {
        students: {
          include: { user: true },
        },
      },
    })

    if (!school) {
      console.log('School not found for code:', schoolCode)
      return NextResponse.json({ error: "Invalid credentials or school" }, { status: 401 })
    }

    const student = school.students.find(
      (s) =>
        (admissionNumber && s.admissionNumber === admissionNumber) ||
        (email && s.user.email === email)
    )

    if (!student) {
      console.log('Student not found for:', { admissionNumber, email })
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if user password exists
    if (!student.user || !student.user.password) {
      console.log('No user password found for student:', student.id)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Compare the provided password with the hashed user password
    const isPasswordValid = await bcrypt.compare(password, student.user.password)
    if (!isPasswordValid) {
      console.log('Invalid password for student:', student.id)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token for session
    const token = sign(
      { studentId: student.id, schoolCode: school.code, role: "student" },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    )

    cookies().set("student_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    })

    console.log('Student login successful:', student.id)
    return NextResponse.json({ success: true, message: "Login successful", studentId: student.id })
  } catch (error) {
    console.error('Student login error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 