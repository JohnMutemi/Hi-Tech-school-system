import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SchoolSeedingService } from '@/lib/services/school-seeding-service';
import { normalizePackageType } from '@/lib/finance-package-gate';

const prisma = new PrismaClient();

function getPrimaryPortalRole(packageType: string | null | undefined): 'admin' | 'bursar' {
  return normalizePackageType(packageType) === 'finance_only' ? 'bursar' : 'admin';
}

export async function GET() {
  try {
    const schools = await prisma.school.findMany({
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

    // Transform data to match SchoolData interface
    const transformedSchools = schools.map((school: any) => {
      const isInlineLogo =
        typeof school.logo === 'string' && school.logo.trim().startsWith('data:');
      const primaryRole = getPrimaryPortalRole(school.packageType);
      const primaryUser = school.users.find((u: any) => u.role === primaryRole);
      const fallbackUser = school.users.find((u: any) => u.role === 'admin');

      return ({
      id: school.id,
      schoolCode: school.code,
      name: school.name,
      // Keep school listing payload lightweight; large inline logos can freeze the dashboard table.
      logo: isInlineLogo ? null : school.logo,
      logoUrl: isInlineLogo ? "" : (school.logo ?? ""),
      hasLogo: Boolean(school.logo),
      colorTheme: school.colorTheme || "#d97706",
      portalUrl: `/schools/${school.code}`,
      description: "",
      adminEmail: primaryUser?.email || fallbackUser?.email || school.email,
      adminPassword: "", // Don't return password
      adminFirstName: primaryUser?.name?.split(' ')[0] || fallbackUser?.name?.split(' ')[0] || "Admin",
      adminLastName:
        primaryUser?.name?.split(' ').slice(1).join(' ') ||
        fallbackUser?.name?.split(' ').slice(1).join(' ') ||
        "User",
      createdAt: school.createdAt.toISOString(),
      status: school.isActive ? "active" : "suspended",
      packageType: normalizePackageType((school as any).packageType),
      profile: {
        address: school.address,
        phone: school.phone,
        website: "",
        principalName: "",
        establishedYear: new Date().getFullYear().toString(),
        description: "",
        email: school.email,
        motto: "",
        type: "primary" as const
      },
      teachers: [],
      students: school.students.map((s: any) => ({
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
      classes: school.classes.map((c: any) => ({
        id: c.id,
        name: c.name,
        level: "",
        capacity: 30,
        currentStudents: 0,
        classTeacherId: "",
        subjects: []
      }))
    })});

    return NextResponse.json(transformedSchools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      schoolCode,
      address,
      phone,
      email,
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
      description,
      colorTheme,
      status,
      logoUrl,
      logo,
      packageType,
    } = body;

    // Validate required fields
    if (!name || !schoolCode || !address || !phone || !email || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if school code already exists
    const existingSchool = await prisma.school.findUnique({
      where: { code: schoolCode.toLowerCase() }
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: 'School with this code already exists' },
        { status: 409 }
      );
    }

    const logoData =
      typeof logoUrl === 'string' && logoUrl.length > 0
        ? logoUrl
        : typeof logo === 'string' && logo.length > 0
          ? logo
          : null;

    const themeHex =
      typeof colorTheme === 'string' && /^#[0-9A-Fa-f]{6}$/.test(colorTheme.trim())
        ? colorTheme.trim()
        : '#d97706';
    const normalizedPackageType = normalizePackageType(packageType);

    // Create school (logo: data URL or URL string; colorTheme: hex)
    const school = await prisma.school.create({
      data: {
        name,
        code: schoolCode.toLowerCase(),
        address,
        phone,
        email,
        logo: logoData,
        colorTheme: themeHex,
        packageType: normalizedPackageType,
        isActive: status !== 'suspended'
      }
    });

    // Automatically seed grades for the new school
    // (Removed: grades are now global and seeded once)
    // const defaultGrades = [...];
    // await prisma.grade.createMany({ data: defaultGrades, skipDuplicates: true });

    // Hash the admin password before saving
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const primaryRole = getPrimaryPortalRole(normalizedPackageType);

    // Create the initial portal user (admin for full package, bursar for finance-only).
    const adminUser = await prisma.user.create({
      data: {
        name: `${adminFirstName} ${adminLastName}`,
        email: adminEmail,
        password: hashedPassword,
        mustChangePassword: true,
        role: primaryRole,
        schoolId: school.id,
        isActive: true
      }
    });

    // Automatically seed initial school data
    try {
      console.log(`🌱 Auto-seeding data for new school: ${schoolCode}`);
      const seedingService = new SchoolSeedingService(school.id, schoolCode);
      const seedingResults = await seedingService.seedSchoolData();
      console.log(`✅ Auto-seeding completed for school: ${schoolCode}`, seedingResults);
    } catch (seedingError) {
      console.error(`⚠️ Warning: Auto-seeding failed for school: ${schoolCode}`, seedingError);
      // Don't fail school creation if seeding fails - it can be done manually later
    }

    // Return the created school with admin info
    const createdSchool = {
      id: school.id,
      schoolCode: school.code,
      name: school.name,
      logo: school.logo,
      logoUrl: school.logo ?? "",
      colorTheme: school.colorTheme || themeHex,
      portalUrl: `/schools/${school.code}`,
      description: description || "",
      adminEmail: adminUser.email,
      adminPassword: "", // Don't return password
      adminFirstName,
      adminLastName,
      createdAt: school.createdAt.toISOString(),
      status: school.isActive ? "active" : "suspended",
      packageType: normalizePackageType((school as any).packageType),
      profile: {
        address: school.address,
        phone: school.phone,
        website: "",
        principalName: "",
        establishedYear: new Date().getFullYear().toString(),
        description: description || "",
        email: school.email,
        motto: "",
        type: "primary" as const
      },
      teachers: [],
      students: [],
      subjects: [],
      classes: []
    };

    return NextResponse.json(createdSchool, { status: 201 });
  } catch (error) {
    console.error('Error creating school:', error);
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}
