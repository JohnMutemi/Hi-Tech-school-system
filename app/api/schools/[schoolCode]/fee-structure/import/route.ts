import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import * as XLSX from 'xlsx';
import { jsonError, requireRole, requireSchoolAccess } from "@/lib/api-guard";

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { session, schoolContext } = await requireSchoolAccess(params.schoolCode);
    requireRole(session, ["super_admin", "school_admin", "bursar"]);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const school = await prisma.school.findUnique({ where: { id: schoolContext.schoolId } });
    if (!school) return NextResponse.json({ error: 'School not found' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const created: any[] = [];
    const errors: any[] = [];
    
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

        await prisma.feeStructure.create({
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
  } catch (error) {
    return jsonError(error);
  }
} 