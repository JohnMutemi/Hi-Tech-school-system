import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } })
    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 })

    const activeTerms = await prisma.platformTerms.findFirst({
      where: { isActive: true },
      orderBy: { effectiveAt: "desc" },
    })
    if (!activeTerms) return NextResponse.json({ terms: null })

    const accepted = await prisma.schoolTermsAcceptance.findFirst({
      where: { schoolId: school.id, termsId: activeTerms.id },
    })

    return NextResponse.json({
      terms: {
        id: activeTerms.id,
        version: activeTerms.version,
        title: activeTerms.title,
        content: activeTerms.content,
      },
      accepted: Boolean(accepted),
    })
  } catch (error) {
    console.error("Get terms error:", error)
    return NextResponse.json({ error: "Failed to load terms." }, { status: 500 })
  }
}
