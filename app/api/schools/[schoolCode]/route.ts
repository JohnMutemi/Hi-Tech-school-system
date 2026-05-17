import { PrismaClient } from '@prisma/client';
import { type NextRequest, NextResponse } from "next/server";
import { z } from 'zod';
import { getSession } from "@/lib/session";
import { requireSchoolAccess, ApiGuardError } from "@/lib/api-guard";
import { normalizePackageType } from '@/lib/finance-package-gate';
import { getPaletteBySlug } from '@/lib/school-website/palettes';
import { normalizeTemplateSlug } from '@/lib/school-website/templates';
import { transformSchoolForApi } from '@/lib/school-website/transform-school-response';

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

    const transformedSchool = {
      ...transformSchoolForApi(schoolData as any),
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
      classes: schoolData.classes.map(c => ({
        id: c.id,
        name: c.name,
        level: "",
        capacity: 30,
        currentStudents: 0,
        classTeacherId: "",
        subjects: []
      })),
    };

    return NextResponse.json(transformedSchool);
  } catch (error) {
    console.error("Error fetching school:", error);
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const session = await getSession();
    const isSuperAdmin = session.isLoggedIn && session.role === "super_admin";
    if (!isSuperAdmin) {
      try {
        await requireSchoolAccess(params.schoolCode);
      } catch (err) {
        if (err instanceof ApiGuardError) {
          return NextResponse.json({ error: err.message }, { status: err.status });
        }
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
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
      isSuperAdmin && packageType !== undefined
        ? normalizePackageType(packageType)
        : undefined;

    const palette =
      body.colorPaletteSlug !== undefined
        ? getPaletteBySlug(body.colorPaletteSlug)
        : undefined;

    const profileYear = profile?.establishedYear;
    const established =
      profileYear != null && String(profileYear).trim() !== ''
        ? parseInt(String(profileYear), 10)
        : undefined;

    // Update school (use id — code in URL may differ in casing from DB)
    await prisma.school.update({
      where: { id: school.id },
      data: {
        ...(isSuperAdmin && name ? { name } : {}),
        ...(address ? { address } : {}),
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        ...(isSuperAdmin && status !== undefined ? { isActive: status !== "suspended" } : {}),
        ...(body.lastAdmissionNumber !== undefined && {
          lastAdmissionNumber: body.lastAdmissionNumber,
        }),
        ...(nextLogo !== undefined && { logo: nextLogo }),
        ...(nextColorTheme !== undefined && { colorTheme: nextColorTheme }),
        ...(palette && nextColorTheme === undefined && body.colorPaletteSlug
          ? { colorTheme: palette.primary, colorPaletteSlug: palette.slug }
          : body.colorPaletteSlug !== undefined
            ? { colorPaletteSlug: palette?.slug ?? null }
            : {}),
        ...(body.websiteTemplateSlug !== undefined && {
          websiteTemplateSlug: normalizeTemplateSlug(body.websiteTemplateSlug),
        }),
        ...(body.publicWebsiteEnabled !== undefined && {
          publicWebsiteEnabled: Boolean(body.publicWebsiteEnabled),
        }),
        ...(body.feePaymentParentSmsEnabled !== undefined && {
          feePaymentParentSmsEnabled: Boolean(body.feePaymentParentSmsEnabled),
        }),
        ...(profile?.motto !== undefined && { motto: profile.motto || null }),
        ...(profile?.principalName !== undefined && {
          principalName: profile.principalName || null,
        }),
        ...(established !== undefined && !Number.isNaN(established) && { establishedYear: established }),
        ...(profile?.description !== undefined && { description: profile.description || null }),
        ...(profile?.website !== undefined && { websiteUrl: profile.website || null }),
        ...(normalizedPackageType !== undefined && { packageType: normalizedPackageType }),
      },
    });

    const primaryRole = getPrimaryPortalRole((school as any).packageType);
    const primaryUser = school.users.find((user) => user.role === primaryRole);

    // Update the primary portal user for this package (superadmin only).
    if (isSuperAdmin && adminEmail && primaryUser) {
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

    return NextResponse.json(transformSchoolForApi(result as any, { description: description || "" }));
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
      await tx.schoolWebsiteSection.deleteMany({ where: { schoolId: school.id } })
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