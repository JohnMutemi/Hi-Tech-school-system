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
      // Use exact field names from template
      const name = row['Name'] || '';
      const isAlumni = row['Is Alumni'] === 'TRUE' || row['Is Alumni'] === true || false;

      if (!name) {
        errors.push({ grade: name, error: 'Name is required' });
        continue;
      }

      // Check if grade already exists
      const existingGrade = await prisma.grade.findFirst({
        where: { 
          name: name,
          schoolId: school.id 
        }
      });

      if (existingGrade) {
        errors.push({ grade: name, error: 'Grade already exists' });
        continue;
      }

      // Create grade
      const grade = await prisma.grade.create({
        data: {
          name: name,
          isAlumni: isAlumni === 'TRUE' || isAlumni === true,
          schoolId: school.id,
        },
      });

      created.push({ grade: name });
    } catch (err: any) {
      errors.push({ grade: row['Name'] || row['name'] || row['NAME'] || '', error: err?.message || 'Unknown error' });
    }
  }
  
  return NextResponse.json({ success: true, created, errors });
} 