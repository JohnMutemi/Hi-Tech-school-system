import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const { emailOrPhone } = await req.json();
  if (!emailOrPhone) return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
  // Find teacher by email or phone
  const teacher = await db.query.users.findFirst({
    where: and(eq(users.role, 'teacher'),
      or(eq(users.email, emailOrPhone), eq(users.phone, emailOrPhone)))
  });
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  // Generate token and expiry
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await db.update(users).set({ resetToken: token, resetTokenExpiry: expiry }).where(eq(users.id, teacher.id));
  // TODO: Send token via email/SMS
  return NextResponse.json({ success: true, token }); // Return token for testing
} 