import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: List all subjects for a school
export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    
    // Since there's no Subject model in Prisma, we'll return an empty array for now
    // You may want to add a Subject model to your Prisma schema later
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

// POST: Create a new subject
export async function POST(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    
    const body = await request.json();
    const { name, code, description, teacherId } = body;
    
    if (!name || !code) {
      return NextResponse.json({ error: "Missing required fields: name and code are required" }, { status: 400 });
    }
    
    // Since there's no Subject model in Prisma, we'll return an error for now
    // You may want to add a Subject model to your Prisma schema
    return NextResponse.json({ 
      error: "Subject creation not implemented. Please add Subject model to Prisma schema first." 
    }, { status: 501 });
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}

// PUT: Update a subject
export async function PUT(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    
    const body = await request.json();
    const { id, name, code, description, teacherId } = body;
    
    if (!id) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 });
    }
    
    // Since there's no Subject model in Prisma, we'll return an error for now
    return NextResponse.json({ 
      error: "Subject update not implemented. Please add Subject model to Prisma schema first." 
    }, { status: 501 });
  } catch (error) {
    console.error("Error updating subject:", error);
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 });
  }
}

// DELETE: Delete a subject
export async function DELETE(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const school = await prisma.school.findUnique({ where: { code: params.schoolCode.toLowerCase() } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Subject ID is required" }, { status: 400 });
    }
    
    // Since there's no Subject model in Prisma, we'll return an error for now
    return NextResponse.json({ 
      error: "Subject deletion not implemented. Please add Subject model to Prisma schema first." 
    }, { status: 501 });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
  }
} 