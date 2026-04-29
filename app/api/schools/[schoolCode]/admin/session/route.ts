import { NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const token = request.cookies.get("admin_auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    let payload: any
    try {
      payload = verify(token, process.env.JWT_SECRET!)
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    if (
      payload.role !== "admin" ||
      String(payload.schoolCode).toLowerCase() !== params.schoolCode.toLowerCase()
    ) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }
    // Optionally fetch admin info
    const admin = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }
    const school = await prisma.school.findUnique({ where: { id: admin.schoolId || "" } })
    if (!school || !school.isActive) {
      return NextResponse.json({ error: "School account is suspended." }, { status: 403 })
    }

    const activeTerms = await prisma.platformTerms.findFirst({
      where: { isActive: true },
      orderBy: { effectiveAt: "desc" },
    })
    let requiresTermsAcceptance = false
    if (activeTerms) {
      const accepted = await prisma.schoolTermsAcceptance.findFirst({
        where: { schoolId: school.id, termsId: activeTerms.id },
      })
      requiresTermsAcceptance = !accepted
    }

    return NextResponse.json({
      adminId: admin.id,
      schoolCode: String(payload.schoolCode).toLowerCase(),
      admin,
      requiresTermsAcceptance,
      activeTerms: activeTerms
        ? { id: activeTerms.id, version: activeTerms.version, title: activeTerms.title, content: activeTerms.content }
        : null,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 