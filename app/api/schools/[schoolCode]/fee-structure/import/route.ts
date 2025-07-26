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
      await prisma.feeStructure.create({
        data: {
          name: row['Name'],
          description: row['Description'],
          amount: parseFloat(row['Amount']),
          frequency: row['Frequency'],
          dueDate: row['Due Date'] ? new Date(row['Due Date']) : undefined,
          isActive: row['Is Active'] === 'TRUE' || row['Is Active'] === true,
          schoolId: school.id,
        },
      });
      created.push({ fee: row['Name'] });
    } catch (err: any) {
      errors.push({ fee: row['Name'], error: err?.message || 'Unknown error' });
    }
  }
  return NextResponse.json({ success: true, created, errors });
} 