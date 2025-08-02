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
      const description = row['Description'] || '';
      const amount = parseFloat(row['Amount']) || 0;
      const frequency = row['Frequency'] || 'monthly';
      const dueDate = row['Due Date'] ? new Date(row['Due Date']) : undefined;
      const isActive = row['Is Active'] === 'TRUE' || row['Is Active'] === true;

      if (!name || amount <= 0) {
        errors.push({ fee: name, error: 'Name and Amount are required. Amount must be greater than 0.' });
        continue;
      }

      // Check if fee structure already exists
      const existingFee = await prisma.feeStructure.findFirst({
        where: { 
          name: name,
          schoolId: school.id 
        }
      });

      if (existingFee) {
        errors.push({ fee: name, error: 'Fee structure already exists' });
        continue;
      }

      // Create fee structure
      const feeStructure = await prisma.feeStructure.create({
        data: {
          name: name,
          description: description,
          amount: amount,
          frequency: frequency,
          dueDate: dueDate,
          isActive: isActive,
          schoolId: school.id,
        },
      });

      created.push({ fee: name });
    } catch (err: any) {
      errors.push({ fee: row['Name'] || '', error: err?.message || 'Unknown error' });
    }
  }
  
  return NextResponse.json({ success: true, created, errors });
} 