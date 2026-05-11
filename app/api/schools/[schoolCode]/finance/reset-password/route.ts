import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { resolveFinanceGateForSchoolCode } from "@/lib/finance-package-gate"

const prisma = new PrismaClient()

function isDatabaseConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "")
  return message.includes("Can't reach database server")
}

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { token, newPassword } = await request.json()
    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 })
    }

    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
    }

    const gate = await resolveFinanceGateForSchoolCode(params.schoolCode)
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const school = await prisma.school.findFirst({
      where: { code: { equals: params.schoolCode, mode: "insensitive" } },
    })
    if (!school) return NextResponse.json({ error: "School not found." }, { status: 404 })

    const bursar = await prisma.user.findFirst({
      where: { schoolId: school.id, role: "bursar", resetToken: token },
    })
    if (!bursar || !bursar.resetTokenExpiry || bursar.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: bursar.id },
      data: {
        password: hashed,
        mustChangePassword: false,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({ success: true, message: "Password updated successfully." })
  } catch (error) {
    console.error("Finance reset password error:", error)
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        {
          error: "Database is temporarily unreachable. Please check DATABASE_URL/network and try again.",
        },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 })
  }
}
