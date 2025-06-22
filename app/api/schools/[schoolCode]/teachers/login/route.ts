import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { sign } from "jsonwebtoken"
import { cookies } from "next/headers"

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { email, password } = await request.json()
    const schoolCode = params.schoolCode.toLowerCase()

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
      include: { users: { where: { email, role: "teacher" } } },
    })

    if (!school || !school.users || school.users.length === 0) {
      return NextResponse.json({ error: "Invalid credentials or school" }, { status: 401 })
    }

    const teacherUser = school.users[0]
    
    // In your previous code, you were checking a temporary password.
    // Assuming you want to move to a more permanent, hashed password system.
    // If you are still using temporary, non-hashed passwords, this part needs adjustment.
    const isPasswordValid = await bcrypt.compare(password, teacherUser.password)

    if (!isPasswordValid) {
      // Fallback for temporary password if the main password isn't set or doesn't match
      const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: teacherUser.id }})
      if (teacherProfile?.tempPassword !== password) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }
    }

    // Create JWT token for session
    const token = sign({ userId: teacherUser.id, schoolCode: school.code, role: 'teacher' }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    })

    cookies().set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    })

    return NextResponse.json({ success: true, message: "Login successful" })
  } catch (error) {
    console.error("Teacher login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 