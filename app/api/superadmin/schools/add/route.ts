import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { name, code, address, phone, email, adminName, adminEmail, adminPassword } = await request.json();

    // Insert school
    const schoolResult = await sql`
      INSERT INTO schools (code, name, address, phone, email, is_active, created_at, updated_at)
      VALUES (${code}, ${name}, ${address}, ${phone}, ${email}, true, NOW(), NOW())
      RETURNING id;
    `;
    const schoolId = schoolResult[0].id;

    // Hash admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Insert school admin
    await sql`
      INSERT INTO users (name, email, password, role, school_id, is_active, created_at, updated_at)
      VALUES (${adminName}, ${adminEmail}, ${hashedPassword}, 'school_admin', ${schoolId}, true, NOW(), NOW());
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding school:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 