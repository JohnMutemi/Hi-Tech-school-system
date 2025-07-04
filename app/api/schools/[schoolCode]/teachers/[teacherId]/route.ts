import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string, teacherId: string } }) {
  try {
    const { schoolCode, teacherId } = params
    const teacherUser = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: "teacher",
        school: { code: schoolCode },
      },
      include: {
        teacherProfile: true,
      },
    })
    if (!teacherUser) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }
    // Fetch all classes where this teacher is the class teacher
    const classes = await prisma.class.findMany({
      where: {
        teacherId: teacherId,
        school: { code: schoolCode },
      },
      include: {
        grade: true,
      },
    })
    return NextResponse.json({ ...teacherUser, classes })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 