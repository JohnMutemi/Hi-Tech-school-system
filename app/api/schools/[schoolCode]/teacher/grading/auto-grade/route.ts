import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireUserSession } from "@/lib/grading/auth";
import { DEFAULT_SCALE_BANDS } from "@/lib/grading/defaults";
import { computeAutoGrade } from "@/lib/grading/engine";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { payload, school } = await requireUserSession(
      request.cookies.get("auth_token")?.value,
      params.schoolCode,
      ["teacher"]
    );
    const { classId, subjectId, term, academicYear } = await request.json();
    if (!classId || !subjectId || !term || !academicYear) {
      return NextResponse.json(
        { error: "classId, subjectId, term and academicYear are required" },
        { status: 400 }
      );
    }

    const classRecord = await prisma.class.findFirst({
      where: { id: classId, schoolId: school.id, teacherId: payload.userId },
      select: { id: true },
    });
    if (!classRecord) {
      return NextResponse.json({ error: "Class not assigned to teacher" }, { status: 403 });
    }

    const db = prisma as any;
    const criteria =
      (await db.gradingCriteria.findFirst({
        where: { schoolId: school.id, isActive: true },
        orderBy: { updatedAt: "desc" },
      })) ||
      (await db.gradingCriteria.create({
        data: {
          schoolId: school.id,
          name: "Default Grading Scale",
          passMark: 50,
          scaleBands: DEFAULT_SCALE_BANDS,
          isActive: true,
        },
      }));

    const assessments = await db.assessment.findMany({
      where: {
        schoolId: school.id,
        classId,
        subjectId,
        term,
        academicYear,
        createdByTeacherId: payload.userId,
      },
      include: { scores: true },
    });

    const grouped = new Map<string, { weighted: number; totalWeight: number }>();
    assessments.forEach((assessment: any) => {
      const weight = Number(assessment.weight || 1);
      const totalMarks = Number(assessment.totalMarks || 100);
      assessment.scores.forEach((score: any) => {
        const normalized = totalMarks > 0 ? Number(score.rawScore) / totalMarks : 0;
        const current = grouped.get(score.studentId) || { weighted: 0, totalWeight: 0 };
        grouped.set(score.studentId, {
          weighted: current.weighted + normalized * weight,
          totalWeight: current.totalWeight + weight,
        });
      });
    });

    const students = await prisma.student.findMany({
      where: { classId, schoolId: school.id, isActive: true },
      select: { id: true },
    });

    let computedCount = 0;
    for (const student of students) {
      const totals = grouped.get(student.id) || { weighted: 0, totalWeight: 0 };
      const autoGrade = computeAutoGrade({
        totalWeightedScore: totals.weighted,
        totalWeight: totals.totalWeight,
        criteria: {
          passMark: Number(criteria.passMark ?? 50),
          scaleBands: Array.isArray(criteria.scaleBands) ? criteria.scaleBands : DEFAULT_SCALE_BANDS,
        },
      });
      await db.studentGradeResult.upsert({
        where: {
          studentId_subjectId_term_academicYear: {
            studentId: student.id,
            subjectId,
            term,
            academicYear,
          },
        },
        create: {
          schoolId: school.id,
          studentId: student.id,
          classId,
          subjectId,
          term,
          academicYear,
          percentage: autoGrade.percentage,
          totalWeighted: totals.weighted,
          letterGrade: autoGrade.letterGrade,
          gradePoint: autoGrade.gradePoint,
          passStatus: autoGrade.passStatus,
          remarks: autoGrade.remarks,
          status: "draft",
          gradedByTeacherId: payload.userId,
        },
        update: {
          percentage: autoGrade.percentage,
          totalWeighted: totals.weighted,
          letterGrade: autoGrade.letterGrade,
          gradePoint: autoGrade.gradePoint,
          passStatus: autoGrade.passStatus,
          remarks: autoGrade.remarks,
          gradedByTeacherId: payload.userId,
        },
      });
      computedCount += 1;
    }

    return NextResponse.json({
      success: true,
      computedCount,
      criteria: {
        id: criteria.id,
        name: criteria.name,
        passMark: criteria.passMark,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Auto-grading failed" }, { status: 400 });
  }
}
