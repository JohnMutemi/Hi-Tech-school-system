import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { ImportManager } from '@/lib/import-utils';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const updateMode = formData.get('updateMode') === 'true';
  const skipDuplicates = formData.get('skipDuplicates') === 'true';
  
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  // Resolve schoolId from school code
  const school = await prisma.school.findUnique({ where: { code: params.schoolCode } });
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  // Use the new ImportManager
  const importManager = new ImportManager(school.id, {
    updateExisting: updateMode,
    skipDuplicates: skipDuplicates,
    duplicateCheckField: 'admissionNumber'
  });

  const result = await importManager.importStudents(rows);
  
  return NextResponse.json({ 
    success: true, 
    created: result.created, 
    updated: result.updated,
    skipped: result.skipped, 
    errors: result.errors 
  });
} 