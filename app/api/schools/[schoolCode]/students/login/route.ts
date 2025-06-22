import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { sign } from "jsonwebtoken"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { admissionNumber, email, password } = await request.json()
    const schoolCode = params.schoolCode.toLowerCase()

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
      include: {
        students: {
          include: { user: true },
        },
      },
    })

    if (!school) {
      return NextResponse.json({ error: "Invalid credentials or school" }, { status: 401 })
    }

    const student = school.students.find(
      (s) =>
        (admissionNumber && s.admissionNumber === admissionNumber) ||
        (email && s.user.email === email)
    )

    if (!student) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Compare the provided password with the hashed tempPassword
    const isPasswordValid = await bcrypt.compare(password, student.tempPassword)
    
    if (!isPasswordValid) {
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

    return NextResponse.json({ success: true, message: "Login successful", studentId: student.id })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 