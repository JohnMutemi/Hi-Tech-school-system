import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string, studentId: string } }) {
  try {
    const { schoolCode, studentId } = params
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        school: { code: schoolCode },
      },
      include: {
        user: true,
        parent: true,
        class: true,
      },
    })
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    return NextResponse.json(student)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 