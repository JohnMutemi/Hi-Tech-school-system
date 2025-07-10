import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get all terms for a given academic year
export async function GET(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const yearId = searchParams.get("yearId");
    if (!yearId) return NextResponse.json({ error: "Missing yearId" }, { status: 400 });
    const terms = await prisma.term.findMany({
      where: { academicYearId: yearId },
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json(terms);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch terms" }, { status: 500 });
  }
}

// POST: Create a new term
export async function POST(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { name, startDate, endDate, academicYearId } = await req.json();
    if (!name || !startDate || !endDate || !academicYearId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const term = await prisma.term.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        academicYearId,
      },
    });
    return NextResponse.json(term);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create term" }, { status: 500 });
  }
}

// PUT: Update a term
export async function PUT(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { id, name, startDate, endDate } = await req.json();
    if (!id || !name || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const term = await prisma.term.update({
      where: { id },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });
    return NextResponse.json(term);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update term" }, { status: 500 });
  }
}

// DELETE: Delete a term
export async function DELETE(req: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.term.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete term" }, { status: 500 });
  }
} 