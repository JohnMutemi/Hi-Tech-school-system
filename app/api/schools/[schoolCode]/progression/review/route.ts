import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode } });
    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

    // Get all active students
    const students = await prisma.student.findMany({
      where: { schoolId: school.id, isActive: true },
      include: { user: true, class: true }
    });

    // Get all classes and progression rules
    const classes = await prisma.class.findMany({ where: { schoolId: school.id, isActive: true } });
    const progressions = await prisma.classProgression.findMany({ where: { schoolId: school.id, isActive: true } });

    const result = students.map(student => {
      const fromClass = student.class?.name || "Unassigned";
      const progression = progressions.find(p => p.fromClass === fromClass);
      let toClass = progression?.toClass || "";
      let status = "OK";
      if (!progression) {
        status = "No next class configured";
        toClass = "";
      } else if (!classes.some(c => c.name === toClass)) {
        status = "Next class missing";
      }
      return {
        id: student.id,
        name: student.user?.name || "",
        admissionNumber: student.admissionNumber,
        fromClass,
        toClass,
        status
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch student progression review" }, { status: 500 });
  }
} 