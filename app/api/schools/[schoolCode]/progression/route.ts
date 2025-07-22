import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode } });
    if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });
    const classes = await prisma.class.findMany({ where: { schoolId: school.id, isActive: true }, orderBy: { name: 'asc' } });
    const progressions = await prisma.classProgression.findMany({ where: { schoolId: school.id, isActive: true }, orderBy: { order: 'asc' } });
    return NextResponse.json({ classes, progressions });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch progression data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode } });
    if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });
    const body = await req.json();
    const { rules } = body; // rules: [{ fromClass, toClass, order, ... }]
    if (!Array.isArray(rules)) return NextResponse.json({ error: 'Rules array required' }, { status: 400 });
    // Upsert each rule
    for (const rule of rules) {
      await prisma.classProgression.upsert({
        where: { schoolId_fromClass: { schoolId: school.id, fromClass: rule.fromClass } },
        update: {
          toClass: rule.toClass,
          order: rule.order,
          isActive: true,
        },
        create: {
          schoolId: school.id,
          fromClass: rule.fromClass,
          toClass: rule.toClass,
          order: rule.order,
          isActive: true,
          fromGrade: rule.fromGrade || '',
          toGrade: rule.toGrade || '',
          fromAcademicYear: rule.fromAcademicYear || '',
          toAcademicYear: rule.toAcademicYear || '',
        },
      });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save progression rules' }, { status: 500 });
  }
} 