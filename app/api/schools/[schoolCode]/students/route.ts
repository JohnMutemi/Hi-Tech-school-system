import { NextRequest, NextResponse } from 'next/server';
import { generateNextAdmissionNumber } from '@/lib/utils/school-generator';
import { withSchoolContext } from '@/lib/school-context';
import { hashDefaultPasswordByRole } from '@/lib/utils/default-passwords';
import { prisma } from "@/lib/prisma";
import { jsonError, requireRole, requireSchoolAccess } from "@/lib/api-guard";

function getNextAdmissionNumber(lastAdmissionNumber: string): string {
  if (!lastAdmissionNumber) return '001';
  const match = lastAdmissionNumber.match(/(\d+)(?!.*\d)/);
  if (match) {
    const number = match[1];
    const next = (parseInt(number, 10) + 1).toString().padStart(number.length, '0');
    return lastAdmissionNumber.replace(/(\d+)(?!.*\d)/, next);
  }
  return lastAdmissionNumber + '1';
}

function normalizeName(value?: string | null): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
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
    requireRole(session, ["super_admin", "school_admin"]);

    const data = await req.json();
    const {
      name, email, phone, admissionNumber, dateOfBirth, dateAdmitted,
      parentName, parentPhone, parentEmail, address, gender, classId, avatarUrl,
      emergencyContact, medicalInfo, notes
    } = data;

    if (!name || !email || !classId) {
      return NextResponse.json({ error: 'Missing required fields: name, email, and classId are required.' }, { status: 400 });
    }

    const emailTaken = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (emailTaken) {
      return NextResponse.json(
        { error: 'This email is already registered. Each student must use a unique email.' },
        { status: 409 }
      );
    }

    // Admission number logic - use school-specific settings
    let finalAdmissionNumber = admissionNumber;
    if (!finalAdmissionNumber) {
      const settings = await prisma.school.findUnique({
        where: { id: schoolContext.schoolId },
        select: {
          admissionNumberAutoIncrement: true,
          lastAdmissionNumber: true,
        },
      });

      if (settings?.admissionNumberAutoIncrement && settings.lastAdmissionNumber) {
        // Use the school's last admission number and increment it
        finalAdmissionNumber = getNextAdmissionNumber(settings.lastAdmissionNumber);
      } else {
        // Fallback to default
        finalAdmissionNumber = 'ADM001';
      }
    }

    const admissionTaken = await prisma.student.findFirst({
      where: {
        schoolId: schoolContext.schoolId,
        admissionNumber: finalAdmissionNumber,
      },
    });
    if (admissionTaken) {
      return NextResponse.json(
        { error: `Admission number "${finalAdmissionNumber}" is already in use for this school.` },
        { status: 409 }
      );
    }

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
      const normalizedParentName = normalizeName(parentName);

      const [parentByPhone, parentByEmail] = await Promise.all([
        trimmedParentPhone
          ? prisma.user.findFirst({
              where: {
                role: 'parent',
                schoolId: schoolContext.schoolId,
                phone: trimmedParentPhone,
              },
            })
          : Promise.resolve(null),
        trimmedParentEmail
          ? prisma.user.findFirst({
              where: {
                role: 'parent',
                schoolId: schoolContext.schoolId,
                email: trimmedParentEmail,
              },
            })
          : Promise.resolve(null),
      ]);

      if (parentByPhone && parentByEmail && parentByPhone.id !== parentByEmail.id) {
        return NextResponse.json(
          { error: 'Parent email and phone belong to different parent records. Please use matching parent details.' },
          { status: 409 }
        );
      }

      parentUser = parentByEmail || parentByPhone;

      // If the email exists globally but belongs to a non-parent account, block parent linkage.
      if (!parentUser && trimmedParentEmail) {
        const anyUserWithEmail = await prisma.user.findUnique({
          where: { email: trimmedParentEmail },
          select: { id: true, role: true, schoolId: true },
        });
        if (anyUserWithEmail && anyUserWithEmail.role !== 'parent') {
          return NextResponse.json(
            { error: 'Parent email belongs to another non-parent account. Use a different parent email.' },
            { status: 409 }
          );
        }
      }

      const hashedParentPassword = await hashDefaultPasswordByRole('parent');
      if (!parentUser) {
        parentUser = await prisma.user.create({
          data: {
            name: parentName || `Parent of ${name}`,
            email: trimmedParentEmail || `${trimmedParentPhone || Date.now()}@parent.local`,
            phone: trimmedParentPhone,
            role: 'parent',
            password: hashedParentPassword,
            isActive: true,
            schoolId: schoolContext.schoolId,
          },
        });
      } else {
        const existingName = normalizeName(parentUser.name);
        const existingEmail = (parentUser.email || '').trim().toLowerCase();
        const existingPhone = (parentUser.phone || '').trim();

        if (normalizedParentName && existingName && normalizedParentName !== existingName) {
          return NextResponse.json(
            { error: 'Parent name does not match existing parent record for the provided email/phone.' },
            { status: 409 }
          );
        }
        if (trimmedParentEmail && existingEmail && trimmedParentEmail !== existingEmail) {
          return NextResponse.json(
            { error: 'Parent email does not match existing parent record.' },
            { status: 409 }
          );
        }
        if (trimmedParentPhone && existingPhone && trimmedParentPhone !== existingPhone) {
          return NextResponse.json(
            { error: 'Parent phone does not match existing parent record.' },
            { status: 409 }
          );
        }
      }
    }

    const hashedPassword = await hashDefaultPasswordByRole('student');

    const studentUser = await prisma.user.create({
      data: {
        name,
        email: email.trim(),
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
        classId,
        admissionNumber: finalAdmissionNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
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
        { error: 'Duplicate value: email or admission number must be unique.' },
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
    const body = await req.json();
    const studentId = body.studentId || body.id;
    const {
      name, email, phone, admissionNumber, dateOfBirth, dateAdmitted,
      parentName, parentPhone, parentEmail, address, gender, parentId,
      classId, status, avatarUrl, emergencyContact, medicalInfo, notes, isActive,
      currentAcademicYearId, currentTermId
    } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required for updating.' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, userId: true, schoolId: true, parentId: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const trimmedEmail = email?.trim();
    if (trimmedEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: trimmedEmail },
        select: { id: true },
      });
      if (existingUser && existingUser.id !== student.userId) {
        return NextResponse.json(
          { error: 'This email is already registered. Each student must use a unique email.' },
          { status: 409 }
        );
      }
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: {
        name: name,
        email: trimmedEmail,
        phone: phone,
        isActive: isActive,
      },
    });

    let resolvedParentId = parentId ?? student.parentId ?? undefined;
    if (parentPhone || parentEmail || parentName) {
      const trimmedParentPhone = parentPhone?.trim() || null;
      const trimmedParentEmail = parentEmail?.trim().toLowerCase() || null;
      const normalizedParentName = normalizeName(parentName);

      const [parentByPhone, parentByEmail] = await Promise.all([
        trimmedParentPhone
          ? prisma.user.findFirst({
              where: {
                role: 'parent',
                schoolId: student.schoolId,
                phone: trimmedParentPhone,
              },
            })
          : Promise.resolve(null),
        trimmedParentEmail
          ? prisma.user.findFirst({
              where: {
                role: 'parent',
                schoolId: student.schoolId,
                email: trimmedParentEmail,
              },
            })
          : Promise.resolve(null),
      ]);

      if (parentByPhone && parentByEmail && parentByPhone.id !== parentByEmail.id) {
        return NextResponse.json(
          { error: 'Parent email and phone belong to different parent records. Please use matching parent details.' },
          { status: 409 }
        );
      }

      let parentUser = parentByEmail || parentByPhone;

      if (!parentUser && trimmedParentEmail) {
        const anyUserWithEmail = await prisma.user.findUnique({
          where: { email: trimmedParentEmail },
          select: { id: true, role: true },
        });
        if (anyUserWithEmail && anyUserWithEmail.role !== 'parent') {
          return NextResponse.json(
            { error: 'Parent email belongs to another non-parent account. Use a different parent email.' },
            { status: 409 }
          );
        }
      }

      if (!parentUser) {
        const hashedParentPassword = await hashDefaultPasswordByRole('parent');
        parentUser = await prisma.user.create({
          data: {
            name: parentName || `Parent of ${name || 'Student'}`,
            email: trimmedParentEmail || `${trimmedParentPhone || Date.now()}@parent.local`,
            phone: trimmedParentPhone,
            role: 'parent',
            password: hashedParentPassword,
            isActive: true,
            schoolId: student.schoolId,
          },
        });
      } else {
        const existingName = normalizeName(parentUser.name);
        const existingEmail = (parentUser.email || '').trim().toLowerCase();
        const existingPhone = (parentUser.phone || '').trim();

        if (normalizedParentName && existingName && normalizedParentName !== existingName) {
          return NextResponse.json(
            { error: 'Parent name does not match existing parent record for the provided email/phone.' },
            { status: 409 }
          );
        }
        if (trimmedParentEmail && existingEmail && trimmedParentEmail !== existingEmail) {
          return NextResponse.json(
            { error: 'Parent email does not match existing parent record.' },
            { status: 409 }
          );
        }
        if (trimmedParentPhone && existingPhone && trimmedParentPhone !== existingPhone) {
          return NextResponse.json(
            { error: 'Parent phone does not match existing parent record.' },
            { status: 409 }
          );
        }
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
    const body = await req.json();
    // Accept both 'studentId' and 'id' for compatibility
    const studentId = body.studentId || body.id;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required for deletion.' }, { status: 400 });
    }
    
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Delete related records in the correct order to avoid foreign key constraint violations
    // 1. Delete promotion exclusions first (they reference promotion logs)
    await prisma.promotionExclusion.deleteMany({
      where: { studentId: studentId },
    });

    // 2. Delete promotion logs
    await prisma.promotionLog.deleteMany({
      where: { studentId: studentId },
    });

    // 3. Delete student promotion requests
    await prisma.studentPromotionRequest.deleteMany({
      where: { studentId: studentId },
    });

    // 4. Delete student arrears
    await prisma.studentArrear.deleteMany({
      where: { studentId: studentId },
    });

    // 5. Delete student yearly balances
    await prisma.studentYearlyBalance.deleteMany({
      where: { studentId: studentId },
    });

    // 6. Delete student fees
    await prisma.studentFee.deleteMany({
      where: { studentId: studentId },
    });

    // 7. Delete receipts
    await prisma.receipt.deleteMany({
      where: { studentId: studentId },
    });

    // 8. Delete payments
    await prisma.payment.deleteMany({
      where: { studentId: studentId },
    });

    // 9. Delete payment requests
    await prisma.paymentRequest.deleteMany({
      where: { studentId: studentId },
    });

    // 10. Delete fee statements
    await prisma.feeStatement.deleteMany({
      where: { studentId: studentId },
    });

    // 11. Delete alumni records (if any)
    await prisma.alumni.deleteMany({
      where: { studentId: studentId },
    });

    // 12. Finally delete the student
    await prisma.student.delete({
      where: { id: studentId },
    });
    
    // 13. Delete the associated user
    await prisma.user.delete({
      where: { id: student.userId },
    });
    
    return NextResponse.json({ success: true, message: "Student and all associated records deleted successfully." });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ 
      error: 'Failed to delete student', 
      details: error.message 
    }, { status: 500 });
  }
}
