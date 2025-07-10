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

    // 1. Find the school
    const school = await prisma.school.findUnique({ where: { code: schoolCode } })
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    // 2. Find the admin user for this school
    const user = await prisma.user.findFirst({
      where: { schoolId: school.id, email, role: "admin" }
    })
    if (!user) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }

    // 3. Compare password (assuming user.password is hashed)
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // 4. Return success (and set session/cookie if needed)
    const token = sign({ userId: user.id, schoolCode: school.code, role: "admin" }, process.env.JWT_SECRET!, { expiresIn: "1h" })
    cookies().set("admin_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    })
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    console.error("Error in auth API:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
