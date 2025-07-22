import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      include: {
        users: {
          where: { role: 'admin' },
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
    const transformedSchools = schools.map((school: any) => ({
      id: school.id,
      schoolCode: school.code,
      name: school.name,
      logo: school.logo,
      colorTheme: "#3b82f6", // Default theme
      portalUrl: `/schools/${school.code}`,
      description: "",
      adminEmail: school.users.find((u: any) => u.role === 'admin')?.email || school.email,
      adminPassword: "", // Don't return password
      adminFirstName: school.users.find((u: any) => u.role === 'admin')?.name?.split(' ')[0] || "Admin",
      adminLastName: school.users.find((u: any) => u.role === 'admin')?.name?.split(' ').slice(1).join(' ') || "User",
      createdAt: school.createdAt.toISOString(),
      status: school.isActive ? "active" : "suspended",
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
    }));

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
      status
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

    // Create school
    const school = await prisma.school.create({
      data: {
        name,
        code: schoolCode.toLowerCase(),
        address,
        phone,
        email,
        isActive: status !== 'suspended'
      }
    });

    // Automatically seed grades for the new school
    // (Removed: grades are now global and seeded once)
    // const defaultGrades = [...];
    // await prisma.grade.createMany({ data: defaultGrades, skipDuplicates: true });

    // Hash the admin password before saving
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name: `${adminFirstName} ${adminLastName}`,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        schoolId: school.id,
        isActive: true
      }
    });

    // Return the created school with admin info
    const createdSchool = {
      id: school.id,
      schoolCode: school.code,
      name: school.name,
      logo: school.logo,
      colorTheme: colorTheme || "#3b82f6",
      portalUrl: `/schools/${school.code}`,
      description: description || "",
      adminEmail: adminUser.email,
      adminPassword: "", // Don't return password
      adminFirstName,
      adminLastName,
      createdAt: school.createdAt.toISOString(),
      status: school.isActive ? "active" : "suspended",
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
