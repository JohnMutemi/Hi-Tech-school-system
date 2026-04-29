import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { token, newPassword } = await request.json()
    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 })
    }

    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
    }

    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } })
    if (!school) return NextResponse.json({ error: "School not found." }, { status: 404 })

    const admin = await prisma.user.findFirst({
      where: { schoolId: school.id, role: "admin", resetToken: token },
    })
    if (!admin || !admin.resetTokenExpiry || admin.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        password: hashed,
        mustChangePassword: false,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({ success: true, message: "Password updated successfully." })
  } catch (error) {
    console.error("Admin reset password error:", error)
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 })
  }
}
