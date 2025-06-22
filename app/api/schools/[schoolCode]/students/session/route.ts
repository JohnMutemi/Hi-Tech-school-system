import { NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const token = request.cookies.get("student_auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    let payload: any
    try {
      payload = verify(token, process.env.JWT_SECRET!)
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    if (payload.role !== "student" || payload.schoolCode !== params.schoolCode) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }
    // Optionally fetch student info
    const student = await prisma.student.findUnique({ where: { id: payload.studentId } })
    return NextResponse.json({ studentId: payload.studentId, schoolCode: payload.schoolCode, student })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 