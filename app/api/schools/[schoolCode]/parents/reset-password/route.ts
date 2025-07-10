import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const { token, newPassword } = await req.json();
  if (!token || !newPassword) return NextResponse.json({ error: 'Token and new password required' }, { status: 400 });
  // Find parent by resetToken
  const parent = await db.query.users.findFirst({ where: and(eq(users.role, 'parent'), eq(users.resetToken, token)) });
  if (!parent) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  if (!parent.resetTokenExpiry || new Date(parent.resetTokenExpiry) < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 400 });
  }
  const hashed = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ password: hashed, mustChangePassword: false, resetToken: null, resetTokenExpiry: null, updatedAt: new Date() }).where(eq(users.id, parent.id));
  return NextResponse.json({ success: true });
} 