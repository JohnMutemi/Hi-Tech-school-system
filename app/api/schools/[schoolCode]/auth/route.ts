import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import {
  buildAdminResetLink,
  createTwoFactorToken,
  generateResetToken,
  generateTwoFactorCode,
  getLockoutExpiryDate,
  getResetExpiryDate,
  getTwoFactorExpiryDate,
  LOCKOUT_MS,
  MAX_LOGIN_ATTEMPTS,
} from "@/lib/admin-auth"
import { sendAdminResetEmail, sendAdminTwoFactorCodeEmail } from "@/lib/services/admin-auth-email-service"

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
    if (!school.isActive) {
      return NextResponse.json(
        { error: "This school account is suspended. Contact platform support." },
        { status: 403 }
      )
    }

    // 2. Find the admin user for this school
    const user = await prisma.user.findFirst({
      where: { schoolId: school.id, email, role: "admin" }
    })
    if (!user) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Account temporarily locked. Try again in ${minutes} minute(s).` },
        { status: 429 }
      )
    }

    // 3. Compare password (assuming user.password is hashed)
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      const failedAttempts = user.failedLoginAttempts + 1
      const shouldLock = failedAttempts >= MAX_LOGIN_ATTEMPTS
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : failedAttempts,
          lockoutUntil: shouldLock ? getLockoutExpiryDate() : null,
        },
      })
      if (shouldLock) {
        return NextResponse.json(
          { error: `Too many failed attempts. Account locked for ${Math.floor(LOCKOUT_MS / 60000)} minutes.` },
          { status: 429 }
        )
      }
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockoutUntil: null },
    })

    if (user.mustChangePassword) {
      const resetToken = generateResetToken()
      const resetTokenExpiry = getResetExpiryDate()
      const resetLink = buildAdminResetLink(school.code, resetToken)

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      })

      const emailSent = await sendAdminResetEmail(user.email, school.name, resetLink)
      return NextResponse.json({
        success: false,
        requiresPasswordChange: true,
        emailSent,
        message: emailSent
          ? "First-time login detected. A password reset link was sent to your email."
          : "First-time login detected. Email delivery failed; please use Forgot Password.",
      })
    }

    const twoFactorCode = generateTwoFactorCode()
    const twoFactorCodeExpiry = getTwoFactorExpiryDate()
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode, twoFactorCodeExpiry, twoFactorFailedAttempts: 0 },
    })

    const emailSent = await sendAdminTwoFactorCodeEmail(user.email, school.name, twoFactorCode)
    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send 2FA code. Please try again." }, { status: 500 })
    }

    const twoFactorToken = createTwoFactorToken({ userId: user.id, schoolCode: school.code, email: user.email })
    return NextResponse.json({
      success: true,
      requiresTwoFactor: true,
      twoFactorToken,
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (error) {
    console.error("Error in auth API:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
