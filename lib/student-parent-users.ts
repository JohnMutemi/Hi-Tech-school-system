import { prisma } from '@/lib/prisma';
import { buildStudentLoginEmail as buildCanonicalStudentLoginEmail } from '@/lib/services/student-login-email';

export { buildCanonicalStudentLoginEmail as buildStudentLoginEmail };

function normalizeAdmission(value: string): string {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/** Default parent portal login email derived from phone (when no contact email is given). */
export function buildParentLoginEmailFromPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return `${digits || phone.trim()}@parent.local`;
}

/** Pick a login email that is not already used in User. */
export async function ensureUniqueLoginEmail(
  candidate: string,
  phoneForSuffix: string | null = null
): Promise<string> {
  let email = candidate.trim().toLowerCase();
  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!taken) return email;

  const digits = (phoneForSuffix || Date.now()).toString().replace(/[^0-9]/g, '') || String(Date.now());
  for (let n = 1; n <= 50; n++) {
    email = `parent-${digits}-${n}@parent.local`;
    const conflict = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!conflict) return email;
  }

  return `parent-${digits}-${Date.now()}@parent.local`;
}

/** Resolve an existing parent so siblings share one account. Phone and contact email are canonical. */
export async function findExistingParentUser(
  schoolId: string,
  phone: string | null,
  contactEmail: string | null
) {
  if (phone) {
    const trimmedPhone = phone.trim();

    const byPhone = await prisma.user.findFirst({
      where: { role: 'parent', schoolId, phone: trimmedPhone },
    });
    if (byPhone) return byPhone;

    const phoneLoginEmail = buildParentLoginEmailFromPhone(trimmedPhone);
    const byPhoneLoginEmail = await prisma.user.findFirst({
      where: { role: 'parent', schoolId, email: phoneLoginEmail },
    });
    if (byPhoneLoginEmail) return byPhoneLoginEmail;

    const siblingWithParent = await prisma.student.findFirst({
      where: {
        schoolId,
        parentPhone: trimmedPhone,
        parentId: { not: null },
      },
      include: { parent: true },
    });
    if (siblingWithParent?.parent) return siblingWithParent.parent;
  }

  if (contactEmail) {
    const normalizedContact = contactEmail.trim().toLowerCase();

    const byLoginEmail = await prisma.user.findFirst({
      where: { role: 'parent', schoolId, email: normalizedContact },
    });
    if (byLoginEmail) return byLoginEmail;

    const siblingWithParent = await prisma.student.findFirst({
      where: {
        schoolId,
        parentEmail: normalizedContact,
        parentId: { not: null },
      },
      include: { parent: true },
    });
    if (siblingWithParent?.parent) return siblingWithParent.parent;
  }

  return null;
}

/** Login email for a new parent User; keeps the canonical address when an existing parent already owns it. */
export async function resolveParentLoginEmail(
  schoolId: string,
  trimmedParentEmail: string | null,
  trimmedParentPhone: string | null
): Promise<string> {
  const candidate = trimmedParentEmail
    ? trimmedParentEmail.trim().toLowerCase()
    : trimmedParentPhone
      ? buildParentLoginEmailFromPhone(trimmedParentPhone.trim())
      : `${Date.now()}@parent.local`;

  const taken = await prisma.user.findUnique({
    where: { email: candidate },
    select: { id: true, role: true, schoolId: true },
  });

  if (!taken) return candidate;
  if (taken.role === 'parent' && taken.schoolId === schoolId) return candidate;

  return ensureUniqueLoginEmail(candidate, trimmedParentPhone);
}

async function findAvailableStudentLoginEmail(
  admissionNumber: string,
  schoolCode: string,
  schoolId: string,
  excludeUserId?: string
): Promise<string> {
  const base = buildCanonicalStudentLoginEmail(admissionNumber, schoolCode);
  const conflict = await prisma.user.findFirst({
    where: {
      email: base,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });
  if (!conflict) return base;

  const normalizedAdmission = normalizeAdmission(admissionNumber);
  const normalizedSchoolCode = schoolCode.trim().toLowerCase();

  for (let n = 1; n <= 50; n++) {
    const candidate = `student-${normalizedAdmission}-${normalizedSchoolCode}-${n}@student.local`;
    const taken = await prisma.user.findFirst({
      where: {
        email: candidate,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });
    if (!taken) return candidate;
  }

  return `student-${normalizedAdmission}-${normalizedSchoolCode}-${Date.now()}@student.local`;
}

/**
 * Free the canonical login email for an admission number.
 * - Deletes orphan student users (no profile).
 * - Reassigns mismatched emails on other students to their own canonical address.
 */
export async function releaseCanonicalStudentLoginEmail(
  admissionNumber: string,
  schoolCode: string,
  schoolId: string
): Promise<string> {
  const canonical = buildCanonicalStudentLoginEmail(admissionNumber, schoolCode);
  const normalizedAdmission = normalizeAdmission(admissionNumber);

  const occupant = await prisma.user.findUnique({
    where: { email: canonical },
    include: {
      studentProfile: {
        select: { id: true, admissionNumber: true, schoolId: true },
      },
    },
  });

  if (!occupant) return canonical;

  if (occupant.role !== 'student') {
    return findAvailableStudentLoginEmail(admissionNumber, schoolCode, schoolId);
  }

  if (!occupant.studentProfile) {
    if (!occupant.schoolId || occupant.schoolId === schoolId) {
      await prisma.user.delete({ where: { id: occupant.id } });
    }
    return canonical;
  }

  const profile = occupant.studentProfile;
  if (profile.schoolId !== schoolId) {
    return findAvailableStudentLoginEmail(admissionNumber, schoolCode, schoolId);
  }

  if (normalizeAdmission(profile.admissionNumber) === normalizedAdmission) {
    return canonical;
  }

  const correctedEmail = await findAvailableStudentLoginEmail(
    profile.admissionNumber,
    schoolCode,
    schoolId,
    occupant.id
  );
  await prisma.user.update({
    where: { id: occupant.id },
    data: { email: correctedEmail },
  });

  return canonical;
}

/** Canonical student portal login email for a new enrolment. */
export async function resolveStudentLoginEmail(
  admissionNumber: string,
  schoolCode: string,
  schoolId: string
): Promise<string> {
  return releaseCanonicalStudentLoginEmail(admissionNumber, schoolCode, schoolId);
}
