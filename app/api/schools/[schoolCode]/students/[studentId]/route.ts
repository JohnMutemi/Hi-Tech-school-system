import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jsonError, requireRole, requireSchoolAccess } from "@/lib/api-guard"

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string, studentId: string } }) {
  try {
    const { schoolCode, studentId } = params

    const { session, schoolContext } = await requireSchoolAccess(schoolCode)
    requireRole(session, ["super_admin", "school_admin", "teacher", "bursar"])

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: schoolContext.schoolId,
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
    return jsonError(error)
  }
} 