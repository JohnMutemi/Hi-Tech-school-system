import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { ImportManager } from '@/lib/import-utils';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  console.log('Teachers import started for school:', params.schoolCode);
  
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const updateMode = formData.get('updateMode') === 'true'; // New parameter for update mode
  const skipDuplicates = formData.get('skipDuplicates') === 'true'; // New parameter for skip duplicates
  
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  console.log('File received:', file.name, 'Size:', file.size);
  console.log('Update mode:', updateMode, 'Skip duplicates:', skipDuplicates);

  // Resolve schoolId from school code
  console.log('Looking for school with code:', params.schoolCode);
  const school = await prisma.school.findUnique({ where: { code: params.schoolCode } });
  if (!school) {
    console.error('School not found for code:', params.schoolCode);
    return NextResponse.json({ error: 'School not found' }, { status: 400 });
  }
  
  console.log('School found:', school.name, 'ID:', school.id);

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log('Processing', rows.length, 'teacher records');

  // Use the new ImportManager
  const importManager = new ImportManager(school.id, {
    updateExisting: updateMode,
    skipDuplicates: skipDuplicates,
    duplicateCheckField: 'email'
  });

  const result = await importManager.importTeachers(rows);
  
  console.log('Import completed:', {
    created: result.created.length,
    updated: result.updated.length,
    skipped: result.skipped.length,
    errors: result.errors.length
  });

  return NextResponse.json({ 
    success: true, 
    created: result.created, 
    updated: result.updated,
    skipped: result.skipped, 
    errors: result.errors 
  });
} 