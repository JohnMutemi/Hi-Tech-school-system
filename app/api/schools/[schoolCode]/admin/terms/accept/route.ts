import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyAdminSessionToken } from "@/lib/admin-auth"

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const token = request.cookies.get("admin_auth_token")?.value
    if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    const payload = verifyAdminSessionToken(token)
    if (!payload || payload.schoolCode !== params.schoolCode.toLowerCase()) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 })
    }

    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } })
    if (!school) return NextResponse.json({ error: "School not found." }, { status: 404 })

    const activeTerms = await prisma.platformTerms.findFirst({
      where: { isActive: true },
      orderBy: { effectiveAt: "desc" },
    })
    if (!activeTerms) return NextResponse.json({ error: "No active terms configured." }, { status: 400 })

    await prisma.schoolTermsAcceptance.upsert({
      where: {
        schoolId_termsId: {
          schoolId: school.id,
          termsId: activeTerms.id,
        },
      },
      update: { adminUserId: payload.userId, acceptedAt: new Date() },
      create: {
        schoolId: school.id,
        termsId: activeTerms.id,
        adminUserId: payload.userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Accept terms error:", error)
    return NextResponse.json({ error: "Failed to accept terms." }, { status: 500 })
  }
}
