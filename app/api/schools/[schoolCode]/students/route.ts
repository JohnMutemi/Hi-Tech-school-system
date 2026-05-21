import { NextRequest, NextResponse } from 'next/server';
import { withSchoolContext } from '@/lib/school-context';
import { hashDefaultPasswordByRole } from '@/lib/utils/default-passwords';
import { prisma } from "@/lib/prisma";
import { normalizeStudentFeeSegment } from '@/lib/fees/fee-structure-resolve';
import { jsonError, requireRole, requireSchoolAccess } from "@/lib/api-guard";
import {
  findExistingParentUser,
  resolveParentLoginEmail,
  resolveStudentLoginEmail,
} from '@/lib/student-parent-users';
import { deleteStudentCompletely } from '@/lib/services/delete-student-service';

function normalizeName(value?: string | null): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildStudentFullName(payload: {
  firstName?: string | null;
  middleName?: string | null;
  surname?: string | null;
  name?: string | null;
}): string {
  const fromParts = [payload.firstName, payload.middleName, payload.surname]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(" ");

  if (fromParts) return fromParts;
  return (payload.name || "").trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;

    const { session, schoolContext } = await requireSchoolAccess(schoolCode);
    requireRole(session, ["super_admin", "school_admin", "teacher", "bursar"]);

    const { searchParams } = new URL(request.url);
    
    const gradeId = searchParams.get("gradeId");
    const classId = searchParams.get("classId");
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    // Build where clause with school-specific filtering
    const whereClause: any = {
      schoolId: schoolContext.schoolId,
      isActive: true,
      // Also exclude students who have been promoted to alumni
      status: {
        not: 'graduated'
      }
    };

    // Filter by class if specified
    if (classId) {
      whereClause.classId = classId;
    } else if (gradeId) {
      // Filter by grade if class not specified
      whereClause.class = {
        gradeId: gradeId,
      };
    }

    // Filter by role if specified
    if (role) {
      whereClause.user = {
        role: role,
      };
    }

    // Add search filter if specified
    if (search) {
      whereClause.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          admissionNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          parent: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Fetch students with related data
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        class: {
          include: {
            grade: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: [
        {
          class: {
            grade: {
              name: "asc",
            },
          },
        },
        {
          class: {
            name: "asc",
          },
        },
        {
          user: {
            name: "asc",
          },
        },
      ],
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return jsonError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ["super_admin", "school_admin", "bursar"]);

    const data = await req.json();
    const {
      name,
      firstName,
      middleName,
      surname,
      email,
      phone,
      admissionNumber,
      yearOfBirth,
      dateOfBirth,
      dateAdmitted,
      parentName, parentPhone, parentEmail, address, gender, classId, gradeId: gradeIdRaw, avatarUrl,
      emergencyContact, medicalInfo, notes, feeAccommodation: feeRaw
    } = data;

    const fullName = buildStudentFullName({ firstName, middleName, surname, name });

    let resolvedClassId =
      typeof classId === "string" && classId.trim()
        ? classId.trim()
        : "";

    const gradeId =
      typeof gradeIdRaw === "string" && gradeIdRaw.trim() ? gradeIdRaw.trim() : "";

    if (!resolvedClassId && gradeId) {
      const classesInGrade = await prisma.class.findMany({
        where: {
          schoolId: schoolContext.schoolId,
          gradeId,
          isActive: true,
        },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });
      if (classesInGrade.length === 0) {
        return NextResponse.json(
          { error: "No active class exists for the selected grade." },
          { status: 400 }
        );
      }
      if (classesInGrade.length > 1) {
        return NextResponse.json(
          {
            error: `This grade has multiple classes (${classesInGrade.map((c) => c.name).join(", ")}). Enrol by class from Academic Setup, or use one class per grade for grade-only onboarding.`,
          },
          { status: 400 }
        );
      }
      resolvedClassId = classesInGrade[0].id;
    }

    if (
      !fullName ||
      !resolvedClassId ||
      !admissionNumber?.trim() ||
      !parentName?.trim() ||
      !parentPhone?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: student name, admission number, grade (or class), parent name, and parent phone are required.",
        },
        { status: 400 }
      );
    }

    // Admission number is bursar-controlled and required.
    const finalAdmissionNumber = admissionNumber.trim();

    const admissionTaken = await prisma.student.findFirst({
      where: {
        schoolId: schoolContext.schoolId,
        admissionNumber: finalAdmissionNumber,
      },
      select: { id: true, isActive: true },
    });
    if (admissionTaken) {
      return NextResponse.json(
        {
          error: admissionTaken.isActive
            ? `Admission number "${finalAdmissionNumber}" is already in use for this school.`
            : `Admission number "${finalAdmissionNumber}" exists on an inactive record. Remove that record first (by student ID in admin tools) before re-using this number.`,
        },
        { status: 409 }
      );
    }

    const resolvedStudentEmail = await resolveStudentLoginEmail(
      finalAdmissionNumber,
      params.schoolCode,
      schoolContext.schoolId
    );

    // Fetch current academic year and term
    const currentYear = await prisma.academicYear.findFirst({
      where: { schoolId: schoolContext.schoolId, isCurrent: true },
    });
    let currentTerm = null;
    if (currentYear) {
      currentTerm = await prisma.term.findFirst({
        where: { academicYearId: currentYear.id, isCurrent: true },
      });
    }

    let parentUser = null;
    let parentTempPassword = 'parent123';
    if (parentPhone || parentEmail) {
      const trimmedParentPhone = parentPhone?.trim() || null;
      const trimmedParentEmail = parentEmail?.trim().toLowerCase() || null;

      parentUser = await findExistingParentUser(
        schoolContext.schoolId,
        trimmedParentPhone,
        trimmedParentEmail
      );

      const resolvedParentLoginEmail = await resolveParentLoginEmail(
        schoolContext.schoolId,
        trimmedParentEmail,
        trimmedParentPhone
      );

      if (!parentUser) {
        parentUser = await prisma.user.findFirst({
          where: {
            role: 'parent',
            schoolId: schoolContext.schoolId,
            email: resolvedParentLoginEmail,
          },
        });
      }

      const hashedParentPassword = await hashDefaultPasswordByRole('parent');
      if (!parentUser) {
        parentUser = await prisma.user.create({
          data: {
            name: parentName || `Parent of ${fullName}`,
            email: resolvedParentLoginEmail,
            phone: trimmedParentPhone,
            role: 'parent',
            password: hashedParentPassword,
            isActive: true,
            schoolId: schoolContext.schoolId,
          },
        });
      } else if (trimmedParentPhone && !parentUser.phone) {
        await prisma.user.update({
          where: { id: parentUser.id },
          data: { phone: trimmedParentPhone },
        });
        parentUser = { ...parentUser, phone: trimmedParentPhone };
      }
    }

    const hashedPassword = await hashDefaultPasswordByRole('student');

    const studentUser = await prisma.user.create({
      data: {
        name: fullName,
        email: resolvedStudentEmail,
        phone,
        password: hashedPassword,
        role: 'student',
        isActive: true,
        schoolId: schoolContext.schoolId,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        schoolId: schoolContext.schoolId,
        classId: resolvedClassId,
        admissionNumber: finalAdmissionNumber,
        dateOfBirth: dateOfBirth
          ? new Date(dateOfBirth)
          : yearOfBirth
            ? new Date(Number(yearOfBirth), 0, 1)
            : null,
        dateAdmitted: dateAdmitted ? new Date(dateAdmitted) : new Date(),
        parentName,
        parentPhone,
        parentEmail: parentEmail?.trim() || null,
        address,
        gender,
        parentId: parentUser?.id,
        status: "active",
        avatarUrl,
        emergencyContact,
        medicalInfo,
        notes,
        feeAccommodation: normalizeStudentFeeSegment(feeRaw),
        isActive: true,
        currentAcademicYearId: currentYear?.id,
        currentTermId: currentTerm?.id,
        joinedAcademicYearId: currentYear?.id,
        joinedTermId: currentTerm?.id,
      },
      include: {
        user: true,
        parent: true,
        class: { include: { grade: true } }
      },
    });

    // Update school's lastAdmissionNumber after student creation
    if (finalAdmissionNumber) {
      await prisma.school.update({
        where: { id: schoolContext.schoolId },
        data: { lastAdmissionNumber: finalAdmissionNumber },
      });
    }

    return NextResponse.json({
      ...student,
      name: studentUser.name,
      email: studentUser.email,
      phone: studentUser.phone,
      tempPassword: 'student123',
      className: student.class?.name,
      gradeName: student.class?.grade?.name,
      parent: parentUser ? {
        ...parentUser,
        tempPassword: parentTempPassword,
      } : null,
    });

  } catch (error: unknown) {
    console.error('Failed to create student:', error);
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code: string }).code
        : '';
    if (code === 'P2002') {
      return NextResponse.json(
        {
          error:
            'Duplicate admission number, or a previous student login was not fully removed. Try again or use a different admission number.',
        },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to create student';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { schoolCode } = params;
    const { session, schoolContext } = await requireSchoolAccess(schoolCode);
    requireRole(session, ["super_admin", "school_admin", "bursar"]);

    const body = await req.json();
    const studentId = body.studentId || body.id;
    const {
      name, email, phone, admissionNumber, dateOfBirth, dateAdmitted,
      parentName, parentPhone, parentEmail, address, gender, parentId,
      classId, status, avatarUrl,       emergencyContact, medicalInfo, notes, isActive,
      currentAcademicYearId, currentTermId,
      feeAccommodation: feeSegmentBody,
      feePaymentSmsOptIn: feeSmsOptBody,
    } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required for updating.' }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: schoolContext.schoolId,
      },
      select: { id: true, userId: true, schoolId: true, parentId: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: {
        name: name,
        phone: phone,
        isActive: isActive,
      },
    });

    let resolvedParentId = parentId ?? student.parentId ?? undefined;
    if (parentPhone || parentEmail || parentName) {
      const trimmedParentPhone = parentPhone?.trim() || null;
      const trimmedParentEmail = parentEmail?.trim().toLowerCase() || null;

      let parentUser = await findExistingParentUser(
        student.schoolId,
        trimmedParentPhone,
        trimmedParentEmail
      );

      const resolvedParentLoginEmail = await resolveParentLoginEmail(
        student.schoolId,
        trimmedParentEmail,
        trimmedParentPhone
      );

      if (!parentUser) {
        parentUser = await prisma.user.findFirst({
          where: {
            role: 'parent',
            schoolId: student.schoolId,
            email: resolvedParentLoginEmail,
          },
        });
      }

      if (!parentUser) {
        const hashedParentPassword = await hashDefaultPasswordByRole('parent');
        parentUser = await prisma.user.create({
          data: {
            name: parentName || `Parent of ${name || 'Student'}`,
            email: resolvedParentLoginEmail,
            phone: trimmedParentPhone,
            role: 'parent',
            password: hashedParentPassword,
            isActive: true,
            schoolId: student.schoolId,
          },
        });
      } else if (trimmedParentPhone && !parentUser.phone) {
        await prisma.user.update({
          where: { id: parentUser.id },
          data: { phone: trimmedParentPhone },
        });
      }

      resolvedParentId = parentUser.id;
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        admissionNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        dateAdmitted: dateAdmitted ? new Date(dateAdmitted) : undefined,
        parentName,
        parentPhone,
        parentEmail: parentEmail?.trim() || null,
        address,
        gender,
        parentId: resolvedParentId,
        classId,
        status,
        avatarUrl,
        emergencyContact,
        medicalInfo,
        notes,
        ...(feeSegmentBody !== undefined && feeSegmentBody !== null
          ? { feeAccommodation: normalizeStudentFeeSegment(feeSegmentBody) }
          : {}),
        ...(typeof feeSmsOptBody === 'boolean' ? { feePaymentSmsOptIn: feeSmsOptBody } : {}),
        isActive: typeof isActive === "boolean" ? isActive : (status === "active"),
        updatedAt: new Date(),
        currentAcademicYearId: currentAcademicYearId ?? student.currentAcademicYearId,
        currentTermId: currentTermId ?? student.currentTermId,
      },
      include: { user: true, parent: true, class: { include: { grade: true } } }
    });

    return NextResponse.json(updatedStudent);

  } catch (error: any) {
    console.error('Failed to update student:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ["super_admin", "school_admin", "bursar"]);

    const body = await req.json();
    // Accept both 'studentId' and 'id' for compatibility
    const studentId = body.studentId || body.id;
    const admissionNumber =
      typeof body.admissionNumber === 'string' ? body.admissionNumber.trim() : '';

    if (!studentId && !admissionNumber) {
      return NextResponse.json(
        { error: 'studentId or admissionNumber is required for deletion.' },
        { status: 400 }
      );
    }

    const student = await prisma.student.findFirst({
      where: studentId
        ? { id: studentId, schoolId: schoolContext.schoolId }
        : { schoolId: schoolContext.schoolId, admissionNumber },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({
        success: true,
        alreadyRemoved: true,
        message:
          'This student is no longer in the database (already deleted). Refresh the list to update your screen.',
      });
    }

    await deleteStudentCompletely(student.id, schoolContext.schoolId);

    return NextResponse.json({
      success: true,
      message: 'Student and all associated records were permanently removed from the database.',
    });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ 
      error: 'Failed to delete student', 
      details: error.message 
    }, { status: 500 });
  }
}
