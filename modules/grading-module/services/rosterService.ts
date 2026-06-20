import { prisma } from '@/lib/prisma';
import { hashDefaultPasswordByRole } from '@/lib/utils/default-passwords';
import { resolveStudentLoginEmail } from '@/lib/student-parent-users';

export async function listLegacyRosterStudents(schoolId: string, legacyClassId: string) {
  const legacyClass = await prisma.class.findFirst({
    where: { id: legacyClassId, schoolId, isActive: true },
    select: { id: true, name: true },
  });

  if (!legacyClass) {
    throw new Error('Legacy class not found for this school');
  }

  const students = await prisma.student.findMany({
    where: {
      schoolId,
      classId: legacyClassId,
      isActive: true,
      status: { not: 'graduated' },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true } },
    },
    orderBy: { user: { name: 'asc' } },
  });

  return { class: legacyClass, students };
}

export async function enrollStudentInLegacyClass(
  schoolId: string,
  schoolCode: string,
  data: {
    name: string;
    admissionNumber: string;
    legacyClassId: string;
    parentName: string;
    parentPhone: string;
    gender?: string;
  }
) {
  const legacyClass = await prisma.class.findFirst({
    where: { id: data.legacyClassId, schoolId, isActive: true },
  });
  if (!legacyClass) {
    throw new Error('Legacy class not found');
  }

  const fullName = data.name.trim();
  const admissionNumber = data.admissionNumber.trim();
  const parentName = data.parentName.trim();
  const parentPhone = data.parentPhone.trim();

  if (!fullName || !admissionNumber || !parentName || !parentPhone) {
    throw new Error('Name, admission number, parent name, and parent phone are required');
  }

  const taken = await prisma.student.findFirst({
    where: { schoolId, admissionNumber },
    select: { id: true, isActive: true },
  });
  if (taken?.isActive) {
    throw new Error(`Admission number "${admissionNumber}" is already in use`);
  }

  const resolvedStudentEmail = await resolveStudentLoginEmail(
    admissionNumber,
    schoolCode,
    schoolId
  );
  const hashedPassword = await hashDefaultPasswordByRole('student');

  const studentUser = await prisma.user.create({
    data: {
      name: fullName,
      email: resolvedStudentEmail,
      phone: parentPhone,
      password: hashedPassword,
      role: 'student',
      isActive: true,
      schoolId,
    },
  });

  const currentYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
  });
  const currentTerm = currentYear
    ? await prisma.term.findFirst({
        where: { academicYearId: currentYear.id, isCurrent: true },
      })
    : null;

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      schoolId,
      classId: data.legacyClassId,
      admissionNumber,
      parentName,
      parentPhone,
      gender: data.gender?.trim() || null,
      status: 'active',
      isActive: true,
      dateAdmitted: new Date(),
      currentAcademicYearId: currentYear?.id,
      currentTermId: currentTerm?.id,
      joinedAcademicYearId: currentYear?.id,
      joinedTermId: currentTerm?.id,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true } },
    },
  });

  await prisma.school.update({
    where: { id: schoolId },
    data: { lastAdmissionNumber: admissionNumber },
  });

  return student;
}
