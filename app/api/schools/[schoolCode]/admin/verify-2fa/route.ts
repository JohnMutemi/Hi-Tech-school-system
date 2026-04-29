import { NextRequest, NextResponse } from "next/server"
import { Prisma, PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"
import {
  createAdminSessionToken,
  getLockoutExpiryDate,
  getAdminCookieName,
  LOCKOUT_MS,
  MAX_2FA_ATTEMPTS,
  verifyTwoFactorToken,
} from "@/lib/admin-auth"

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { twoFactorToken, code } = await request.json()
    if (!twoFactorToken || !code) {
      return NextResponse.json({ error: "Verification token and code are required." }, { status: 400 })
    }

    const decoded = verifyTwoFactorToken(twoFactorToken)
    if (!decoded || decoded.schoolCode !== params.schoolCode.toLowerCase()) {
      return NextResponse.json({ error: "Invalid verification token." }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!admin || admin.role !== "admin" || !admin.twoFactorCode || !admin.twoFactorCodeExpiry) {
      return NextResponse.json({ error: "2FA verification unavailable." }, { status: 401 })
    }
    if (admin.lockoutUntil && admin.lockoutUntil > new Date()) {
      const minutes = Math.ceil((admin.lockoutUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Account temporarily locked. Try again in ${minutes} minute(s).` },
        { status: 429 }
      )
    }

    if (admin.twoFactorCodeExpiry < new Date()) {
      return NextResponse.json({ error: "2FA code expired. Please login again." }, { status: 401 })
    }
    if (admin.twoFactorCode !== String(code).trim()) {
      const failedAttempts = admin.twoFactorFailedAttempts + 1
      const shouldLock = failedAttempts >= MAX_2FA_ATTEMPTS
      await prisma.user.update({
        where: { id: admin.id },
        data: {
          twoFactorFailedAttempts: shouldLock ? 0 : failedAttempts,
          lockoutUntil: shouldLock ? getLockoutExpiryDate() : null,
        },
      })
      if (shouldLock) {
        return NextResponse.json(
          { error: `Too many invalid codes. Account locked for ${Math.floor(LOCKOUT_MS / 60000)} minutes.` },
          { status: 429 }
        )
      }
      return NextResponse.json({ error: "Invalid verification code." }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: admin.id },
      data: {
        twoFactorCode: null,
        twoFactorCodeExpiry: null,
        twoFactorLastVerifiedAt: new Date(),
        twoFactorFailedAttempts: 0,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    })

    const token = createAdminSessionToken({ userId: admin.id, schoolCode: params.schoolCode.toLowerCase() })
    cookies().set(getAdminCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60,
      path: "/",
    })

    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } })
    const activeTerms = await prisma.platformTerms.findFirst({
      where: { isActive: true },
      orderBy: { effectiveAt: "desc" },
    })
    let requiresTermsAcceptance = false
    if (school && activeTerms) {
      const accepted = await prisma.schoolTermsAcceptance.findFirst({
        where: { schoolId: school.id, termsId: activeTerms.id },
      })
      requiresTermsAcceptance = !accepted
    }

    return NextResponse.json({
      success: true,
      requiresTermsAcceptance,
      activeTerms: activeTerms
        ? { id: activeTerms.id, version: activeTerms.version, title: activeTerms.title, content: activeTerms.content }
        : null,
    })
  } catch (error) {
    console.error("Admin 2FA verification error:", error)
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: "Database temporarily unavailable. Please retry in a few seconds." },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: "Failed to verify 2FA code." }, { status: 500 })
  }
}
