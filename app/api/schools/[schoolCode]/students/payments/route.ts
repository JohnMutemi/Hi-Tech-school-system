import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const data = await req.json();
  // data should include: studentId, amount, paymentDate, paymentMethod, etc.

  const payment = await prisma.payment.create({
    data: {
      ...data,
      paymentDate: new Date(data.paymentDate),
      createdAt: new Date(),
    },
  });

  return NextResponse.json(payment);
}

export async function GET(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');

  const payments = await prisma.payment.findMany({
    where: { studentId: studentId || undefined },
    orderBy: { paymentDate: 'desc' },
  });

  return NextResponse.json(payments);
} 