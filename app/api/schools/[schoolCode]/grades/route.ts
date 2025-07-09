import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all grades (global)
export async function GET(request: NextRequest) {
  try {
    const grades = await prisma.grade.findMany();
    return NextResponse.json(grades);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
} 