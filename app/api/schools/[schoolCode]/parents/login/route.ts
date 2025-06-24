import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json(
        { error: "Phone number and password are required" },
        { status: 400 }
      );
    }

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const parent = await prisma.user.findFirst({
      where: {
        schoolId: school.id,
        role: "parent",
        phone: phone
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, parent.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create JWT token for session management
    const token = jwt.sign(
      {
        userId: parent.id,
        role: "parent",
        schoolCode: school.code.toLowerCase(),
        schoolId: school.id
      },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    // Set the token in a cookie
    const response = NextResponse.json({ 
      parentId: parent.id,
      parentName: parent.name,
      schoolCode: school.code
    });

    response.cookies.set("parent_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Parent login error:", error);
    return NextResponse.json(
      { error: "An internal error occurred" },
      { status: 500 }
    );
  }
} 