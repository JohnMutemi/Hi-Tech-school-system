import { NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    let payload: any
    try {
      payload = verify(token, process.env.JWT_SECRET!)
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    if (payload.role !== "teacher" || payload.schoolCode !== params.schoolCode) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }
    // Optionally fetch teacher info
    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: payload.userId } })
    return NextResponse.json({ teacherId: payload.userId, schoolCode: payload.schoolCode, teacherProfile })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 