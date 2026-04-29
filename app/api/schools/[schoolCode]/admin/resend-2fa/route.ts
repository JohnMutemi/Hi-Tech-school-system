import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { generateTwoFactorCode, getTwoFactorExpiryDate, verifyTwoFactorToken } from "@/lib/admin-auth"
import { sendAdminTwoFactorCodeEmail } from "@/lib/services/admin-auth-email-service"

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { twoFactorToken } = await request.json()
    if (!twoFactorToken) return NextResponse.json({ error: "Verification token is required." }, { status: 400 })

    const decoded = verifyTwoFactorToken(twoFactorToken)
    if (!decoded || decoded.schoolCode !== params.schoolCode.toLowerCase()) {
      return NextResponse.json({ error: "Invalid verification token." }, { status: 401 })
    }

    const [admin, school] = await Promise.all([
      prisma.user.findUnique({ where: { id: decoded.userId } }),
      prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } }),
    ])

    if (!admin || !school || admin.role !== "admin") {
      return NextResponse.json({ error: "Admin account not found." }, { status: 404 })
    }

    const twoFactorCode = generateTwoFactorCode()
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        twoFactorCode,
        twoFactorCodeExpiry: getTwoFactorExpiryDate(),
        twoFactorFailedAttempts: 0,
      },
    })

    const sent = await sendAdminTwoFactorCodeEmail(admin.email, school.name, twoFactorCode)
    if (!sent) return NextResponse.json({ error: "Unable to resend code right now." }, { status: 500 })

    return NextResponse.json({ success: true, message: "A new verification code has been sent." })
  } catch (error) {
    console.error("Resend 2FA code error:", error)
    return NextResponse.json({ error: "Failed to resend verification code." }, { status: 500 })
  }
}
