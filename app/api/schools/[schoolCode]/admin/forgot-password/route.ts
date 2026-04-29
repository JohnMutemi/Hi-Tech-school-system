import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { buildAdminResetLink, generateResetToken, getResetExpiryDate } from "@/lib/admin-auth"
import { sendAdminResetEmail } from "@/lib/services/admin-auth-email-service"

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 })

    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } })
    if (!school) return NextResponse.json({ error: "School not found." }, { status: 404 })

    const admin = await prisma.user.findFirst({
      where: { schoolId: school.id, role: "admin", email: String(email).trim().toLowerCase() },
    })

    if (!admin) {
      return NextResponse.json({
        success: true,
        message: "If this account exists, a password reset link has been sent.",
      })
    }

    const resetToken = generateResetToken()
    const resetTokenExpiry = getResetExpiryDate()
    const resetLink = buildAdminResetLink(school.code, resetToken)

    await prisma.user.update({
      where: { id: admin.id },
      data: { resetToken, resetTokenExpiry },
    })

    const emailSent = await sendAdminResetEmail(admin.email, school.name, resetLink)
    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? "Password reset link sent to your email."
        : "Unable to send reset email now. Please try again.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Failed to process forgot password." }, { status: 500 })
  }
}
