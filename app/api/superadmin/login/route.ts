import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from "@/lib/session";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getSession();
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Compare the entered password with the hashed password in the DB
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  // Set session data
  session.id = user.id;
  session.name = user.name;
  session.email = user.email;
  session.role = user.role;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json(user);
} 