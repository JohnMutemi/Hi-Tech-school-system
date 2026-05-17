import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { normalizePackageType } from '@/lib/finance-package-gate';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode.toLowerCase();

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
      include: {
        users: {
          where: { role: { in: ['admin', 'bursar'] } },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const financeOnly = normalizePackageType(school.packageType) === 'finance_only';
    const preferredRole = financeOnly ? 'bursar' : 'admin';
    const portalUser =
      school.users.find((u) => u.role === preferredRole && u.isActive) ||
      school.users.find((u) => u.role === preferredRole) ||
      school.users.find((u) => u.role === 'admin') ||
      school.users.find((u) => u.role === 'bursar');

    if (!portalUser) {
      return NextResponse.json({ error: 'Portal user not found' }, { status: 404 });
    }

    return NextResponse.json({
      email: portalUser.email,
      schoolName: school.name,
      schoolCode: school.code,
      role: portalUser.role,
      message: financeOnly
        ? 'Finance portal login email (use Finance workspace password).'
        : 'Admin credentials retrieved. Please use the admin email and your actual password to login.',
      note: "If you don't remember your password, please contact the system administrator or use the password reset functionality."
    });

  } catch (error) {
    console.error('Error fetching admin credentials:', error);
    return NextResponse.json({ error: 'Failed to fetch admin credentials' }, { status: 500 });
  }
} 