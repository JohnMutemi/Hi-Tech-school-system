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
      // Flexible header mapping (case-insensitive)
      const name = row['Name'] || row['name'] || row['NAME'] || '';
      const email = row['Email'] || row['email'] || row['EMAIL'] || '';
      const phone = row['Phone'] || row['phone'] || row['PHONE'] || '';
      const employeeId = row['Employee ID'] || row['employeeId'] || row['EMPLOYEE ID'] || '';
      const password = row['Password'] || row['password'] || row['PASSWORD'] || 'defaultteacher';
      const qualification = row['Qualification'] || row['qualification'] || row['QUALIFICATION'] || '';
      const dateJoined = row['Date Joined'] || row['dateJoined'] || row['DATE JOINED'] || '';
      const assignedClass = row['Assigned Class'] || row['assignedClass'] || row['ASSIGNED CLASS'] || '';
      const academicYear = row['Academic Year'] || row['academicYear'] || row['ACADEMIC YEAR'] || '';
      const status = row['Status'] || row['status'] || row['STATUS'] || 'active';

      // Check for existing user by email
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        errors.push({ teacher: name, error: 'Email already exists' });
        continue;
      }

      // Create user
      const teacherUser = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          role: 'TEACHER',
          password,
          employeeId,
          schoolId: school.id,
          // status is not a valid field in User model
        },
      });

      // Create teacher profile
      await prisma.teacherProfile.create({
        data: {
          userId: teacherUser.id,
          qualification,
          dateJoined: dateJoined ? new Date(dateJoined) : undefined,
          tempPassword: password,
        },
      });

      created.push({
        name,
        email,
        phone,
        employeeId,
        password,
        qualification,
        dateJoined,
        assignedClass,
        academicYear,
        status,
      });
    } catch (err: any) {
      errors.push({ teacher: row['Name'] || row['name'] || row['NAME'] || '', error: err?.message || 'Unknown error' });
    }
  }
  return NextResponse.json({ success: true, created, errors });
} 