import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  // Resolve schoolId from school code
  const school = await prisma.school.findUnique({ where: { code: params.schoolCode } });
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const created = [];
  const errors = [];
  for (const _row of rows) {
    const row = _row as any;
    // Find teacher by email
    const teacher = await prisma.user.findUnique({ where: { email: row['Teacher Email'] } });
    // Find grade by name
    const grade = await prisma.grade.findFirst({ where: { name: row['Grade'], schoolId: school.id } });

    if (!grade) {
      errors.push({ class: row['Name'], error: `Grade '${row['Grade']}' not found.` });
      continue;
    }

    await prisma.class.create({
      data: {
        name: row['Name'],
        schoolId: school.id,
        teacherId: teacher?.id,
        academicYear: row['Academic Year'],
        isActive: row['Is Active'] === 'TRUE' || row['Is Active'] === true,
        createdAt: row['Created At'] ? new Date(row['Created At']) : undefined,
        updatedAt: row['Updated At'] ? new Date(row['Updated At']) : undefined,
        gradeId: grade.id,
      },
    });
    created.push({ class: row['Name'] });
  }
  return NextResponse.json({ success: true, created, errors });
} 