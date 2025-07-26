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
    try {
      // 1. Create parent if not exists
      let parent = await prisma.user.findUnique({ where: { email: row['Parent Email'] } });
      if (!parent) {
        parent = await prisma.user.create({
          data: {
            name: row['Parent Name'],
            email: row['Parent Email'],
            phone: row['Parent Phone'],
            role: 'PARENT',
            password: row['Parent Password'] || 'defaultparent',
            schoolId: school.id,
          },
        });
      }
      // 2. Create student user
      const studentUser = await prisma.user.create({
        data: {
          name: row['Name'],
          email: row['Admission Number'] + '@school.local',
          phone: '',
          role: 'STUDENT',
          password: row['Student Password'] || 'defaultstudent',
          schoolId: school.id,
        },
      });
      // 3. Create student
      await prisma.student.create({
        data: {
          userId: studentUser.id,
          schoolId: school.id,
          admissionNumber: row['Admission Number'],
          dateOfBirth: row['Date of Birth'] ? new Date(row['Date of Birth']) : undefined,
          gender: row['Gender'],
          address: row['Address'],
          parentId: parent.id,
          parentEmail: row['Parent Email'],
          parentName: row['Parent Name'],
          parentPhone: row['Parent Phone'],
          status: row['Status'] || 'active',
          academicYear: parseInt(row['Academic Year']) || new Date().getFullYear(),
          notes: row['Notes'] || '',
        },
      });
      created.push({ student: row['Name'], parent: row['Parent Name'] });
    } catch (err: any) {
      errors.push({ student: row['Name'], error: err?.message || 'Unknown error' });
    }
  }
  return NextResponse.json({ success: true, created, errors });
} 