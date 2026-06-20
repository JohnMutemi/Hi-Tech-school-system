import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { generateResetToken, getResetExpiryDate } from "@/lib/admin-auth"
import { sendFinanceResetEmail } from "@/lib/services/admin-auth-email-service"
import { resolveFinanceGateForSchoolCode } from "@/lib/finance-package-gate"
import { normalizePackageType } from "@/lib/school-package"

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
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 })
    const normalizedEmail = String(email).trim().toLowerCase()

    const gate = await resolveFinanceGateForSchoolCode(params.schoolCode)
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const school = await prisma.school.findFirst({
      where: { code: { equals: params.schoolCode, mode: "insensitive" } },
    })
    if (!school) return NextResponse.json({ error: "School not found." }, { status: 404 })

    const pkg = normalizePackageType(gate.school.packageType)
    const financeRoles = pkg === "finance_grading" ? ["bursar", "school_admin"] : ["bursar"]

    const bursar = await prisma.user.findFirst({
      where: {
        schoolId: school.id,
        role: { in: financeRoles },
        email: { equals: normalizedEmail, mode: "insensitive" },
      },
    })

    if (!bursar) {
      const anySchoolUser = await prisma.user.findFirst({
        where: {
          schoolId: school.id,
          email: { equals: normalizedEmail, mode: "insensitive" },
        },
        select: { id: true, role: true, email: true },
      })
      return NextResponse.json({
        success: true,
        message: "If this account exists, a password reset link has been sent.",
        ...(process.env.NODE_ENV !== "production"
          ? {
              debugHint: anySchoolUser
                ? `Account found with role "${anySchoolUser.role}" for ${anySchoolUser.email}. Finance reset only works for bursar role.`
                : "No account found for this email in the selected school.",
            }
          : {}),
      })
    }

    const resetToken = generateResetToken()
    const resetTokenExpiry = getResetExpiryDate()
    const baseUrl = request.nextUrl.origin.replace(/\/$/, "")
    const resetLink = `${baseUrl}/schools/${encodeURIComponent(
      school.code
    )}/bursar/reset-password?token=${encodeURIComponent(resetToken)}`

    await prisma.user.update({
      where: { id: bursar.id },
      data: { resetToken, resetTokenExpiry },
    })

    const emailSent = await sendFinanceResetEmail(bursar.email, school.name, resetLink)
    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? "Password reset link sent to your email."
        : "Unable to send reset email now. Please try again.",
      ...(process.env.NODE_ENV !== "production"
        ? { debugResetLink: resetLink, debugResetToken: resetToken }
        : {}),
    })
  } catch (error) {
    console.error("Finance forgot password error:", error)
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        {
          error: "Database is temporarily unreachable. Please check DATABASE_URL/network and try again.",
        },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: "Failed to process forgot password." }, { status: 500 })
  }
}
