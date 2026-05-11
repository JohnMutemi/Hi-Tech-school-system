import { PrismaClient } from '@prisma/client';
import { type NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import { getSession } from "@/lib/session";
import { normalizePackageType } from '@/lib/finance-package-gate';

const prisma = new PrismaClient();

function getPrimaryPortalRole(packageType: string | null | undefined): 'admin' | 'bursar' {
  return normalizePackageType(packageType) === 'finance_only' ? 'bursar' : 'admin';
}

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const school = await prisma.school.findFirst({
    where: {
      code: {
        equals: params.schoolCode,
        mode: 'insensitive',
      },
    },
  });
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 });
  }

  if (action === 'current-academic-year') {
    const year = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, isCurrent: true },
      include: { terms: true },
    });
    return NextResponse.json(year);
  }
  if (action === 'current-term') {
    const year = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, isCurrent: true },
      include: { terms: { where: { isCurrent: true } } },
    });
    return NextResponse.json(year?.terms?.[0] || null);
  }

  try {
    const schoolCode = params.schoolCode;

    const schoolData = await prisma.school.findFirst({
      where: {
        code: {
          equals: schoolCode,
          mode: 'insensitive',
        },
      },
      include: {
        users: {
          where: { role: { in: ['admin', 'bursar'] } },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
          }
        },
        students: {
          select: {
            id: true,
            admissionNumber: true,
            isActive: true,
            createdAt: true
          }
        },
        classes: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    if (!schoolData) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Transform data to match SchoolData interface
    const theme = schoolData.colorTheme || "#d97706";
    const primaryRole = getPrimaryPortalRole((schoolData as any).packageType);
    const primaryUser = schoolData.users.find(u => u.role === primaryRole);
    const fallbackUser = schoolData.users.find(u => u.role === 'admin');

    const transformedSchool = {
      id: schoolData.id,
      schoolCode: schoolData.code,
      name: schoolData.name,
      logo: schoolData.logo,
      logoUrl: schoolData.logo ?? "",
      colorTheme: theme,
      portalUrl: `/schools/${schoolData.code}`,
      description: "",
      adminEmail: primaryUser?.email || fallbackUser?.email || schoolData.email,
      adminPassword: "", // Don't return password
      adminFirstName: primaryUser?.name?.split(' ')[0] || fallbackUser?.name?.split(' ')[0] || "Admin",
      adminLastName:
        primaryUser?.name?.split(' ').slice(1).join(' ') ||
        fallbackUser?.name?.split(' ').slice(1).join(' ') ||
        "User",
      createdAt: schoolData.createdAt.toISOString(),
      status: schoolData.isActive ? "active" : "suspended",
      packageType: normalizePackageType((schoolData as any).packageType),
      profile: {
        address: schoolData.address,
        phone: schoolData.phone,
        website: "",
        principalName: "",
        establishedYear: new Date().getFullYear().toString(),
        description: "",
        email: schoolData.email,
        motto: "",
        type: "primary" as const
      },
      teachers: [],
      students: schoolData.students.map(s => ({
        id: s.id,
        name: "",
        email: "",
        phone: "",
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        admissionNumber: s.admissionNumber,
        class: "",
        dateOfBirth: "",
        gender: "male" as const,
        address: "",
        dateAdmitted: (s as any).createdAt?.toISOString() || new Date().toISOString(),
        status: s.isActive ? "active" : "inactive"
      })),
      subjects: [],
      classes: schoolData.classes.map(c => ({
        id: c.id,
        name: c.name,
        level: "",
        capacity: 30,
        currentStudents: 0,
        classTeacherId: "",
        subjects: []
      })),
      // Add admission number settings
      admissionNumberFormat: schoolData.admissionNumberFormat || '{SCHOOL_CODE}-{YEAR}-{SEQ}',
      lastAdmissionNumber: schoolData.lastAdmissionNumber || '',
      admissionNumberAutoIncrement: schoolData.admissionNumberAutoIncrement ?? true,
    };

    return NextResponse.json(transformedSchool);
  } catch (error) {
    console.error("Error fetching school:", error);
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const schoolCode = params.schoolCode;
    const body = await request.json();
    
    const {
      name,
      address,
      phone,
      email,
      adminEmail,
      adminFirstName,
      adminLastName,
      description,
      colorTheme,
      status,
      profile,
      logo,
      logoUrl,
      packageType,
    } = body;

    // Find the school
    const school = await prisma.school.findFirst({
      where: {
        code: {
          equals: schoolCode,
          mode: 'insensitive',
        },
      },
      include: {
        users: {
          where: { role: { in: ['admin', 'bursar'] } }
        }
      }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const nextLogo =
      logoUrl !== undefined
        ? logoUrl || null
        : logo !== undefined
          ? logo || null
          : undefined;

    const nextColorTheme =
      colorTheme !== undefined && /^#[0-9A-Fa-f]{6}$/.test(String(colorTheme).trim())
        ? String(colorTheme).trim()
        : undefined;

    const normalizedPackageType =
      packageType !== undefined ? normalizePackageType(packageType) : undefined;

    // Update school (use id — code in URL may differ in casing from DB)
    await prisma.school.update({
      where: { id: school.id },
      data: {
        name: name || school.name,
        address: address || school.address,
        phone: phone || school.phone,
        email: email || school.email,
        isActive: status !== "suspended",
        ...(body.lastAdmissionNumber !== undefined && {
          lastAdmissionNumber: body.lastAdmissionNumber,
        }),
        ...(nextLogo !== undefined && { logo: nextLogo }),
        ...(nextColorTheme !== undefined && { colorTheme: nextColorTheme }),
        ...(normalizedPackageType !== undefined && { packageType: normalizedPackageType }),
      },
    });

    const primaryRole = getPrimaryPortalRole((school as any).packageType);
    const primaryUser = school.users.find((user) => user.role === primaryRole);

    // Update the primary portal user for this package.
    if (adminEmail && primaryUser) {
      await prisma.user.update({
        where: { id: primaryUser.id },
        data: {
          name: `${adminFirstName || 'Admin'} ${adminLastName || 'User'}`,
          email: adminEmail
        }
      });
    }

    // Return updated school
    const result = await prisma.school.findFirst({
      where: {
        code: {
          equals: schoolCode,
          mode: 'insensitive',
        },
      },
      include: {
        users: {
          where: { role: { in: ['admin', 'bursar'] } },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    if (!result) {
      return NextResponse.json({ error: 'Failed to retrieve updated school' }, { status: 500 });
    }

    const resultPrimaryRole = getPrimaryPortalRole((result as any).packageType);
    const resultPrimaryUser = result.users.find(u => u.role === resultPrimaryRole);
    const resultFallbackUser = result.users.find(u => u.role === 'admin');

    const transformedSchool = {
      id: result.id,
      schoolCode: result.code,
      name: result.name,
      logo: result.logo,
      logoUrl: result.logo ?? "",
      colorTheme: result.colorTheme || "#d97706",
      portalUrl: `/schools/${result.code}`,
      description: description || "",
      adminEmail: resultPrimaryUser?.email || resultFallbackUser?.email || result.email,
      adminPassword: "",
      adminFirstName: resultPrimaryUser?.name?.split(' ')[0] || resultFallbackUser?.name?.split(' ')[0] || "Admin",
      adminLastName:
        resultPrimaryUser?.name?.split(' ').slice(1).join(' ') ||
        resultFallbackUser?.name?.split(' ').slice(1).join(' ') ||
        "User",
      createdAt: result.createdAt.toISOString(),
      status: result.isActive ? "active" : "suspended",
      packageType: normalizePackageType((result as any).packageType),
      profile: {
        address: result.address,
        phone: result.phone,
        website: profile?.website || "",
        principalName: profile?.principalName || "",
        establishedYear: profile?.establishedYear || new Date().getFullYear().toString(),
        description: profile?.description || "",
        email: result.email,
        motto: profile?.motto || "",
        type: profile?.type || "primary"
      },
      teachers: [],
      students: [],
      subjects: [],
      classes: []
    };

    return NextResponse.json(transformedSchool);
  } catch (error) {
    console.error("Error updating school:", error);
    return NextResponse.json({ error: "Failed to update school" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const session = await getSession()
    if (!session.isLoggedIn || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const schoolCode = params.schoolCode;

    // Check if school exists
    const school = await prisma.school.findFirst({
      where: {
        code: {
          equals: schoolCode,
          mode: 'insensitive',
        },
      },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Remove deepest dependencies first
      await tx.schoolTermsAcceptance.deleteMany({ where: { schoolId: school.id } })

      await tx.schoolRestoreJob.deleteMany({
        where: {
          OR: [{ targetSchoolId: school.id }, { sourceSchoolId: school.id }],
        },
      })
      await tx.schoolBackup.deleteMany({ where: { schoolId: school.id } })

      await tx.studentPromotionRequest.deleteMany({
        where: { promotionRequest: { schoolId: school.id } },
      })
      await tx.promotionRequest.deleteMany({ where: { schoolId: school.id } })

      await tx.promotionExclusion.deleteMany({
        where: { student: { schoolId: school.id } },
      })
      await tx.promotionLog.deleteMany({
        where: { student: { schoolId: school.id } },
      })
      await tx.classProgression.deleteMany({ where: { schoolId: school.id } })
      await tx.bulkPromotionConfig.deleteMany({ where: { schoolId: school.id } })
      await tx.promotionCriteria.deleteMany({ where: { schoolId: school.id } })

      await tx.paymentNotificationLog.deleteMany({
        where: { payment: { student: { schoolId: school.id } } },
      })
      await tx.receipt.deleteMany({
        where: { student: { schoolId: school.id } },
      })
      await tx.payment.deleteMany({
        where: { student: { schoolId: school.id } },
      })
      await tx.paymentRequest.deleteMany({ where: { schoolId: school.id } })

      await tx.feeStatement.deleteMany({
        where: { student: { schoolId: school.id } },
      })
      await tx.studentFee.deleteMany({
        where: { student: { schoolId: school.id } },
      })
      await tx.studentArrear.deleteMany({ where: { schoolId: school.id } })
      await tx.studentYearlyBalance.deleteMany({
        where: { student: { schoolId: school.id } },
      })

      await tx.feeStructureLog.deleteMany({
        where: { feeStructure: { schoolId: school.id } },
      })
      await tx.termlyFeeStructure.deleteMany({ where: { schoolId: school.id } })
      await tx.feeStructure.deleteMany({ where: { schoolId: school.id } })

      await tx.alumni.deleteMany({ where: { schoolId: school.id } })
      await tx.subject.deleteMany({ where: { schoolId: school.id } })
      await tx.student.deleteMany({ where: { schoolId: school.id } })
      await tx.class.deleteMany({ where: { schoolId: school.id } })
      await tx.grade.deleteMany({ where: { schoolId: school.id } })

      await tx.term.deleteMany({
        where: { academicYear: { schoolId: school.id } },
      })
      await tx.academicYear.deleteMany({ where: { schoolId: school.id } })

      await tx.emailNotificationConfig.deleteMany({ where: { schoolId: school.id } })
      await tx.user.deleteMany({ where: { schoolId: school.id } })

      await tx.school.delete({ where: { id: school.id } })
    }, {
      // School teardown can touch many related tables; keep transaction alive longer.
      maxWait: 10_000,
      timeout: 120_000,
    })

    return NextResponse.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error("Error deleting school:", error);
    return NextResponse.json(
      {
        error:
          "Failed to delete school. It may still have protected linked records. Please deactivate it if deletion is not allowed.",
      },
      { status: 500 }
    );
  }
}

// POST: Set current academic year or term
export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const body = await req.json();

  const school = await prisma.school.findFirst({
    where: {
      code: {
        equals: params.schoolCode,
        mode: 'insensitive',
      },
    },
  });
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 });
  }

  if (action === 'set-current-academic-year') {
    const { academicYearId } = body;
    // Set all years to not current, then set the selected one to current
    await prisma.academicYear.updateMany({
      where: { schoolId: school.id },
      data: { isCurrent: false },
    });
    const updated = await prisma.academicYear.update({
      where: { id: academicYearId },
      data: { isCurrent: true },
    });
    return NextResponse.json(updated);
  }
  if (action === 'set-current-term') {
    const { termId } = body;
    // Find the academic year for this term
    const term = await prisma.term.findUnique({ where: { id: termId } });
    if (!term) return NextResponse.json({ error: 'Term not found' }, { status: 404 });
    await prisma.term.updateMany({
      where: { academicYearId: term.academicYearId },
      data: { isCurrent: false },
    });
    const updated = await prisma.term.update({
      where: { id: termId },
      data: { isCurrent: true },
    });
    return NextResponse.json(updated);
  }

  // ... existing code ...
}

// Academic Year CRUD
export async function academicYearsHandler(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const school = await prisma.school.findFirst({
    where: { code: params.schoolCode, },
    // @ts-ignore
    mode: 'insensitive',
  });
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });
  const method = req.method;
  if (method === 'GET') {
    const years = await prisma.academicYear.findMany({ where: { schoolId: school.id }, include: { terms: true } });
    return NextResponse.json(years);
  }
  if (method === 'POST') {
    const body = await req.json();
    const created = await prisma.academicYear.create({ data: { ...body, schoolId: school.id } });
    return NextResponse.json(created);
  }
  if (method === 'PUT') {
    const body = await req.json();
    const updated = await prisma.academicYear.update({ where: { id: body.id }, data: body });
    return NextResponse.json(updated);
  }
  if (method === 'DELETE') {
    const body = await req.json();
    await prisma.academicYear.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Invalid method' }, { status: 405 });
}

// Term CRUD
export async function termsHandler(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const school = await prisma.school.findFirst({
    where: { code: params.schoolCode, },
    // @ts-ignore
    mode: 'insensitive',
  });
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });
  const method = req.method;
  const yearId = new URL(req.url).searchParams.get('yearId');
  if (method === 'GET') {
    if (!yearId) return NextResponse.json({ error: 'Missing yearId' }, { status: 400 });
    const terms = await prisma.term.findMany({ where: { academicYearId: yearId } });
    return NextResponse.json(terms);
  }
  if (method === 'POST') {
    const body = await req.json();
    const created = await prisma.term.create({ data: body });
    return NextResponse.json(created);
  }
  if (method === 'PUT') {
    const body = await req.json();
    const updated = await prisma.term.update({ where: { id: body.id }, data: body });
    return NextResponse.json(updated);
  }
  if (method === 'DELETE') {
    const body = await req.json();
    await prisma.term.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Invalid method' }, { status: 405 });
} 